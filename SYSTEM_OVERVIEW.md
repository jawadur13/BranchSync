# BranchSync — Inter-Branch Transfer Management System
### Jamuna Bank PLC | University Practicum Demo Reference

---

## Project overview

**BranchSync** is a full-stack **Inter-Branch Transfer & Logistics Management System** for **Jamuna Bank PLC**. It digitizes the lifecycle of physical asset transfers between branches—from officer initiation through HQ routing, branch approvals, courier handoffs, and final receipt verification.

Integrated subsystems:

| Subsystem | Driven by | Purpose |
|-----------|-----------|---------|
| **Cash vault** | `behavior_type = CASH` | ৳ balances, denominations, cash ledger, vault adjustments |
| **Stock inventory** | `behavior_type = STOCK` | Per-SKU quantities, stock ledger, stock adjustments |
| **Document / simple** | `behavior_type = DOCUMENT_CASE` | Workflow only—no ledger |

For exhaustive documentation, see **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)**.

### Technology stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript (Vite) |
| **Backend** | Spring Boot 3 (Java 21) |
| **Database** | MariaDB / MySQL |
| **Security** | Spring Security + JWT |
| **ORM** | Hibernate / Spring Data JPA |
| **Build** | Maven |
| **Styling** | Vanilla CSS (custom design system) |

---

## System modules

### Module 1 — Authentication & security

JWT-based authentication. No protected page without a valid session.

**Features:**
- Login with **Employee ID** + **Password**
- JWT carries `userId`, `role`, `branchId`, `departmentId`, `departmentName`
- Axios interceptor attaches `Authorization: Bearer` on every request
- 401 → redirect to login
- RBAC enforced in **backend services** and **frontend** (sidebar, action buttons)
- Password hashing: **SHA-256** (`Sha256PasswordEncoder`)

| File | Path |
|------|------|
| `Login.tsx` | `frontend/src/pages/Login.tsx` |
| `ProtectedRoute.tsx` | `frontend/src/components/ProtectedRoute.tsx` |
| `AuthContext.tsx` | `frontend/src/context/AuthContext.tsx` |
| `axiosConfig.ts` | `frontend/src/api/axiosConfig.ts` |
| `AuthController.java` | `backend/.../controller/AuthController.java` |
| `SecurityConfig.java` | `backend/.../security/SecurityConfig.java` |
| `JwtAuthenticationFilter.java` | `backend/.../security/JwtAuthenticationFilter.java` |

---

### Module 2 — Role-based access control (RBAC)

**7 roles** with distinct permissions and dashboard scope.

| Role | Key permissions |
|------|-----------------|
| `SYSTEM_ADMIN` | Full org CRUD, all transfers/ledgers, consolidated reports; **cannot** create transfer requests (UI) |
| `HQ_LOGISTICS_OFFICER` | `PENDING_HQ_APPROVAL` queue; assign destination; balance warnings; **cannot** create requests |
| `BRANCH_MANAGER` | Internal approve/reject; final release; cash/stock adjustment approval; branch directory |
| `OPERATION_MANAGER` | Same as Branch Manager |
| `FIRST_EXECUTIVE_OFFICER` | Same as manager; **bypasses** `PENDING_INTERNAL` on create |
| `OFFICER` | Create requests; destination accept; cash adjust (Cash Ops only); stock adjust; receipt verify |
| `DELIVERY_PERSON` | Pickup and deliver assigned transfers only |

**Sidebar** adapts per role: Cash Management, Stock Management, Administration sections appear based on role and department.

| File | Path |
|------|------|
| `Sidebar.tsx` | `frontend/src/components/Layout/Sidebar.tsx` |
| `Layout.tsx` | `frontend/src/components/Layout/Layout.tsx` |
| `Topbar.tsx` | `frontend/src/components/Layout/Topbar.tsx` |

---

### Module 3 — Category behavior engine

Each `item_category` has `behavior_type`: **CASH**, **STOCK**, or **DOCUMENT_CASE**.

| Behavior | Transfer extras | Ledger |
|----------|-----------------|--------|
| CASH | `requestedAmount`, denominations | `branch_cash_balance`, `cash_ledger` |
| STOCK | `stockItemId`, `quantity` | `branch_stock_balance`, `stock_ledger` |
| DOCUMENT_CASE | None | None |

| File | Path |
|------|------|
| `CategoryBehavior.java` | `backend/.../model/enums/CategoryBehavior.java` |
| `ItemCategory.java` | `backend/.../model/entity/ItemCategory.java` |
| `ItemManagement.tsx` | `frontend/src/pages/admin/ItemManagement.tsx` |

---

### Module 4 — Transfer request lifecycle (core)

State machine with strict transitions. **Origin** = requester (receives package). **Destination** = HQ-assigned sender (courier picks up there).

#### Status flow

```
PENDING_INTERNAL
    ↓ (Origin Manager approves)
PENDING_HQ_APPROVAL
    ↓ (HQ Officer routes)
PENDING_ASSIGNMENT
    ↓ (Dest. staff accepts + assigns driver)
PENDING_FINAL_RELEASE
    ↓ (Dest. Manager releases)
READY_FOR_PICKUP
    ↓ (Driver picks up)          ← CASH/STOCK debited at destination
IN_TRANSIT
    ↓ (Driver delivers)          ← CASH/STOCK credited at origin
DELIVERED
    ↓ (Requester confirms)
COMPLETED
```

**Rejection / re-route:** `REJECTED_BY_MANAGER`, `REJECTED_BY_HQ`, `REJECTED_ON_RECEIPT`, `CANCELLED`; destination decline → `PENDING_HQ_APPROVAL` for re-allocation.

**Transfer fields:** `requestCode`, title, description, category, priority, origin/destination branches & departments, sensitivity, delivery person, HQ fields, `requestedAmount`, `stockItemId`, `quantity`, `denominationsSubmitted`, timestamps.

| Frontend | Backend |
|----------|---------|
| `Dashboard.tsx`, `NewTransfer.tsx`, `TransferDetails.tsx`, `TransferHistory.tsx` | `TransferController.java`, `TransferServiceImpl.java`, `TransferRequest.java`, `TransferMapper.java` |

**API highlights:** `approve-internal`, `reject-internal`, `hq-verify`, `accept`, `reject-destination`, `release`, `reject-release`, `pickup`, `deliver`, `close`.

---

### Module 5 — Audit log & lifecycle tracking

Every transfer action writes to `audit_logs` (actor, action, from/to status, remarks, IP, timestamp). Visibility is **role-scoped** on transfer detail (full log vs. delivery subset).

| File | Path |
|------|------|
| `AuditLog.java` | `backend/.../model/entity/AuditLog.java` |
| `AuditServiceImpl.java` | `backend/.../service/impl/AuditServiceImpl.java` |
| `TransferDetails.tsx` | `frontend/src/pages/TransferDetails.tsx` |

---

### Module 6 — Transfer history & filtering

Searchable history with status, date, branch, category filters and **print/PDF** export of filtered results. Behavior badges (CASH / STOCK / DOCUMENT_CASE) on rows.

| File | Path |
|------|------|
| `TransferHistory.tsx` | `frontend/src/pages/TransferHistory.tsx` |

---

### Module 7 — Transfer detail view & actions

Role-specific action panels per status. **Print slip** includes route, priority, sensitivity, cash denominations, stock item/qty. **Duplicate request** copies fields to New Request (not for HQ or delivery roles).

| File | Path |
|------|------|
| `TransferDetails.tsx` | `frontend/src/pages/TransferDetails.tsx` |

---

### Module 8 — Dashboard & attention widget

Role-scoped active transfers table. **Attention Required** highlights actionable items:

- HQ → `PENDING_HQ_APPROVAL`
- Manager → `PENDING_INTERNAL`, `PENDING_FINAL_RELEASE`
- Officer → `PENDING_ASSIGNMENT`
- Delivery → `READY_FOR_PICKUP`, `IN_TRANSIT`
- Requester → `DELIVERED` (own requests)
- Manager → pending **cash** adjustments (dashboard widget)

| File | Path |
|------|------|
| `Dashboard.tsx` | `frontend/src/pages/Dashboard.tsx` |

---

### Module 9 — System administration

`SYSTEM_ADMIN` only. Four dedicated pages (replacing legacy single `OrgManagement`):

| Page | Route | Capabilities |
|------|-------|--------------|
| User Management | `/admin/users` | Create, edit, activate/deactivate |
| Branch Management | `/admin/branches` | Create, edit, assign departments |
| Department Management | `/admin/departments` | Global department CRUD |
| Item Management | `/admin/items` | Categories + behavior type; STOCK → stock item CRUD; toggle active |

| File | Path |
|------|------|
| `UserManagement.tsx` | `frontend/src/pages/admin/UserManagement.tsx` |
| `BranchManagement.tsx` | `frontend/src/pages/admin/BranchManagement.tsx` |
| `DepartmentManagement.tsx` | `frontend/src/pages/admin/DepartmentManagement.tsx` |
| `ItemManagement.tsx` | `frontend/src/pages/admin/ItemManagement.tsx` |
| `OrgManagementController.java` | `backend/.../controller/OrgManagementController.java` |
| `ManagementServiceImpl.java` | `backend/.../service/impl/ManagementServiceImpl.java` |

---

### Module 10 — Branch directory

Managers search same-branch colleagues (name, employee ID, email, phone, role, department).

| File | Path |
|------|------|
| `BranchDirectory.tsx` | `frontend/src/pages/BranchDirectory.tsx` |
| `UserController.java` | `backend/.../controller/UserController.java` |

---

### Module 11 — Cash vault & ledger

Applies to **CASH** categories (e.g. Cash Bundle).

**Features:**
- Vault debit at destination pickup; credit at origin delivery; reversal on receipt reject
- Denomination breakdown validated at `PENDING_ASSIGNMENT`
- Low-cash warnings on HQ routing
- Manual adjustments: **Cash Operations officers** submit; managers approve; debit balance guard
- Landscape branch print; admin consolidated portrait print

| Frontend | Backend |
|----------|---------|
| `CashLedger.tsx`, `ManualAdjustment.tsx` | `CashController.java`, `CashServiceImpl.java` |
| | `BranchCashBalance.java`, `CashLedgerEntry.java`, `CashManualAdjustment.java`, `CashTransferDenomination.java` |

---

### Module 12 — Stock inventory & ledger

Applies to **STOCK** categories (e.g. Computers, Stationery Pack, Office Furniture).

**Features:**
- Admin-defined **stock items** (SKUs) per STOCK category
- Quantity debit at destination pickup; credit at origin delivery; reversal on reject
- New transfer requires **stock item** + **quantity**
- Low-stock warnings on transfer detail
- Manual adjustments: officers submit (dept-scoped); managers approve
- Stock ledger: branch → SKU pills → movement history; print export
- 39 seeded stock items in `branchsync.sql`

| Frontend | Backend |
|----------|---------|
| `StockLedger.tsx`, `StockAdjustment.tsx` | `StockController.java`, `StockServiceImpl.java` |
| | `StockItem.java`, `BranchStockBalance.java`, `StockLedgerEntry.java`, `StockManualAdjustment.java` |

**Hooks in** `TransferServiceImpl.markPickedUp`, `markDelivered`, `closeRequest` alongside existing cash hooks.

---

## Database schema (core tables)

| Table | Description |
|-------|-------------|
| `users`, `roles` | Accounts and RBAC |
| `branches`, `departments`, `branch_departments` | Org structure |
| `item_categories` | Categories + `behavior_type`, `is_active` |
| `stock_items` | SKUs under STOCK categories |
| `transfer_requests` | Workflow + cash/stock fields |
| `audit_logs` | Immutable action history |
| `branch_cash_balance`, `cash_ledger`, `cash_transfer_denominations`, `cash_manual_adjustments` | Cash vault |
| `branch_stock_balance`, `stock_ledger`, `stock_manual_adjustments` | Stock inventory |

**Schema file:** `backend/src/main/resources/db/migration/branchsync.sql`

---

## API security & endpoints

All `/api/*` routes (except login and lookups) require JWT.

### Cash

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cash/balances` | All branch vault balances |
| GET | `/api/cash/balance/{branchId}` | Single branch balance |
| GET | `/api/cash/ledger/{branchId}` | Cash ledger |
| POST | `/api/cash/denominations/{requestId}` | Submit note breakdown |
| POST | `/api/cash/adjust` | Submit adjustment |
| POST | `/api/cash/adjust/{id}/decide` | Approve/reject |
| GET | `/api/cash/adjust/pending` | Pending (managers) |

### Stock

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stock/balances` | All branch×SKU balances |
| GET | `/api/stock/balances/{branchId}` | Branch stock list |
| GET | `/api/stock/ledger/{branchId}/{stockItemId}` | Stock ledger (`stockItemId=0` = all) |
| POST | `/api/stock/adjust` | Submit adjustment |
| POST | `/api/stock/adjust/{id}/decide` | Approve/reject |
| GET | `/api/stock/adjust/pending` | Pending (managers) |

### Admin stock items

| GET/POST | `/api/admin/org/items/{categoryId}/stock-items` |
| PUT | `/api/admin/org/stock-items/{stockItemId}`, `.../toggle-active` |

---

## Frontend application structure

```
frontend/src/
├── api/axiosConfig.ts
├── components/
│   ├── Layout/          Layout, Sidebar, Topbar
│   └── ProtectedRoute.tsx
├── context/AuthContext.tsx
├── types/transfer.ts
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── NewTransfer.tsx
│   ├── TransferDetails.tsx
│   ├── TransferHistory.tsx
│   ├── BranchDirectory.tsx
│   ├── Profile.tsx
│   ├── CashLedger.tsx
│   ├── ManualAdjustment.tsx
│   ├── StockLedger.tsx
│   ├── StockAdjustment.tsx
│   └── admin/
│       ├── UserManagement.tsx
│       ├── BranchManagement.tsx
│       ├── DepartmentManagement.tsx
│       └── ItemManagement.tsx
└── App.tsx
```

---

## Key talking points for demo

- **"BranchSync replaces manual paperwork and phone calls between branches."**
- **"HQ centrally routes every request—the branch never guesses the destination."**
- **"Three category behaviors: cash vault, stock quantities, or simple document tracking."**
- **"Every cash movement and stock movement is permanently audited in separate ledgers."**
- **"Debits and credits trigger only when the courier physically picks up and delivers."**
- **"Cash denomination breakdown ensures vault accuracy on the printed slip."**
- **"Stock tracks real SKUs—laptops, forms, chairs—not just category names."**
- **"Destination can send a request back to HQ for re-routing instead of killing it."**
- **"Attention Required tells each role exactly what needs their action today."**
- **"Managers approve vault and inventory corrections with balance guards."**

---

## Related documentation

| Document | Audience |
|----------|----------|
| [README.md](./README.md) | Quick start and API/route reference |
| [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) | Complete system specification |
| [BUSINESS_OVERVIEW.md](./BUSINESS_OVERVIEW.md) | Non-technical bank staff guide |
| [stock_behavior_plan.md](./stock_behavior_plan.md) | STOCK feature design notes |

---

*BranchSync v2.0 · May 2026 · Jamuna Bank PLC Practicum Project*
