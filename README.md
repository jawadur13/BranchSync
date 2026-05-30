# BranchSync — Jamuna Bank PLC

BranchSync is an internal **inter-branch transfer and requisition** system for Jamuna Bank PLC. It manages the movement of physical assets between branches—cash bundles, cheque books, IT equipment, stationery, security items, customer documents, and more—with a strict approval workflow, HQ central routing, courier tracking, and immutable audit trails.

The platform includes two specialized inventory engines:

- **Cash (CASH behavior)** — vault balances in ৳, note denomination breakdowns, cash ledger, manual adjustments  
- **Stock (STOCK behavior)** — per-SKU quantity tracking by branch, stock ledger, manual adjustments  
- **Documents (DOCUMENT_CASE behavior)** — workflow-only transfers with no ledger

**Monorepo:** Spring Boot backend · React/Vite frontend · MariaDB · JWT authentication

For the full system reference (every role, workflow step, API, and table), see **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)**.

---

## Features

### Transfer workflow
- Employee ID + password login with JWT (`departmentName` in session)
- Protected routes with persisted auth state
- **HQ deferred routing** — requesters do not pick destination; HQ assigns branch + department after internal approval
- Eight logical steps: initiation → internal approval → HQ verify → destination accept → final release → pickup → delivery → requester sign-off
- Rejection and **return-to-HQ re-routing** when destination cannot fulfill
- Role/branch/department-scoped dashboard, history, and audit visibility
- **Attention Required** widget for pending actions
- Duplicate request, printable transfer slip (cash denominations + stock lines)
- Transfer history with search, filters, and print/PDF export

### Cash vault (`behavior_type = CASH`)
- Auto debit/credit/reversal on pickup, delivery, and receipt rejection
- Denomination breakdown (৳1000 … ৳1) validated at destination acceptance
- Low-cash warnings for HQ routing
- Manual adjustments (Cash Operations officers submit; managers approve)
- Landscape branch ledger print; admin consolidated portrait report

### Stock inventory (`behavior_type = STOCK`)
- Per-branch quantities per **stock item** (admin-managed SKUs under STOCK categories)
- Auto quantity debit/credit/reversal on transfer lifecycle (same trigger points as cash)
- Manual stock adjustments (officers submit; managers approve; department-scoped)
- Stock ledger with branch/SKU views and print export
- Low-stock warnings on transfer detail

### Administration
- User CRUD and activate/deactivate
- Separate admin pages: **Users**, **Branches**, **Departments**, **Items**
- Item categories with **behavior type** (CASH / STOCK / DOCUMENT_CASE), sensitivity, department mapping, activate/deactivate
- Stock item CRUD under STOCK categories

### Other
- Branch directory (managers)
- User profile and password change
- MariaDB schema + seed data in `backend/src/main/resources/db/migration/branchsync.sql`
- Transactional audit logging on every transfer action

---

## Technology stack

| Layer | Stack |
|-------|--------|
| Frontend | React 18, TypeScript, Vite, React Router, Axios |
| Backend | Java 21, Spring Boot 3, Spring Security, JPA |
| Database | MariaDB / MySQL |
| Auth | JWT (SHA-256 password hashing) |

---

## Workflow (summary)

| Step | Actor | Status transition |
|------|--------|-------------------|
| 0 | Officer / Manager | Create → `PENDING_INTERNAL` or `PENDING_HQ_APPROVAL` (manager bypass) |
| 1 | Origin manager | Approve → `PENDING_HQ_APPROVAL` · Reject → `REJECTED_BY_MANAGER` |
| 2 | HQ logistics | Route → `PENDING_ASSIGNMENT` · Reject → `REJECTED_BY_HQ` |
| 3 | Destination staff | Accept + driver → `PENDING_FINAL_RELEASE` · Decline → back to HQ |
| 4 | Destination manager | Release → `READY_FOR_PICKUP` · Decline → back to HQ |
| 5 | Delivery person | Pickup → `IN_TRANSIT` (cash/stock debited at destination) |
| 6 | Delivery person | Deliver → `DELIVERED` (cash/stock credited at origin) |
| 7 | Original requester | Close → `COMPLETED` or `REJECTED_ON_RECEIPT` (+ reversals) |

**Origin** = branch that needs the asset (receives delivery). **Destination** = HQ-assigned branch that sends the asset (courier picks up there).

---

## Roles

| Role | Code |
|------|------|
| System Admin | `SYSTEM_ADMIN` |
| HQ Logistics Officer | `HQ_LOGISTICS_OFFICER` |
| Branch Manager | `BRANCH_MANAGER` |
| Operation Manager | `OPERATION_MANAGER` |
| First Executive Officer | `FIRST_EXECUTIVE_OFFICER` |
| Officer | `OFFICER` |
| Delivery Person | `DELIVERY_PERSON` |

---

## Status values

`PENDING_INTERNAL` · `PENDING_HQ_APPROVAL` · `PENDING_ASSIGNMENT` · `PENDING_FINAL_RELEASE` · `READY_FOR_PICKUP` · `IN_TRANSIT` · `DELIVERED` · `COMPLETED` · `REJECTED_ON_RECEIPT` · `REJECTED_BY_MANAGER` · `REJECTED_BY_HQ` · `CANCELLED`

---

## API overview

Base URL: `http://localhost:8080/api` · Header: `Authorization: Bearer <token>`

### Auth
- `POST /api/auth/login`

### Transfers
- `GET /api/transfers` · `GET /api/transfers/history` · `GET /api/transfers/{id}`
- `POST /api/transfers`
- `POST /api/transfers/{id}/approve-internal` · `reject-internal`
- `POST /api/transfers/{id}/hq-verify`
- `POST /api/transfers/{id}/accept` · `reject-destination`
- `POST /api/transfers/{id}/release` · `reject-release`
- `POST /api/transfers/{id}/pickup` · `deliver` · `close`

### Cash
- `GET /api/cash/balances` · `/balance/{branchId}` · `/ledger/{branchId}`
- `POST /api/cash/denominations/{requestId}` · `GET` same
- `POST /api/cash/adjust` · `POST /api/cash/adjust/{id}/decide`
- `GET /api/cash/adjust/pending` · `/adjust/all`

### Stock
- `GET /api/stock/balances` · `/balances/{branchId}` · `/balance/{branchId}/{stockItemId}`
- `GET /api/stock/ledger/{branchId}/{stockItemId}`
- `POST /api/stock/adjust` · `POST /api/stock/adjust/{id}/decide`
- `GET /api/stock/adjust/pending` · `/adjust/all`

### Users
- `GET /api/users/profile` · `/branch-directory`

### Admin
- `/api/admin/users` — CRUD + toggle-active
- `/api/admin/org/branches` · `departments` · `items` — CRUD, map, toggle-active, stock-items

### Lookups
- `GET /api/lookup/branches` · `departments` · `roles` · `categories`
- `GET /api/lookup/branches/{branchId}/departments`
- `GET /api/lookup/stock-items/{categoryId}`
- `GET /api/lookup/users/delivery-persons/available`

---

## Frontend routes

| Route | Page |
|-------|------|
| `/login` | Login |
| `/` | Dashboard |
| `/transfers/new` | New request |
| `/transfers/:id` | Transfer details |
| `/transfers/history` | History |
| `/branch-directory` | Branch directory (managers) |
| `/profile` | Profile |
| `/cash/ledger` | Cash ledger |
| `/cash/adjust` | Cash adjustments |
| `/stock/ledger` | Stock ledger |
| `/stock/adjust` | Stock adjustments |
| `/admin/users` | User management |
| `/admin/branches` | Branch management |
| `/admin/departments` | Department management |
| `/admin/items` | Item & stock item management |

---

## Local development

### Prerequisites

- Java 21  
- Maven 3.9+  
- Node.js 22+  
- MariaDB / MySQL (e.g. XAMPP)

### Database

1. Create database `branchsync`.
2. Run schema and seed:
   - `backend/src/main/resources/db/migration/branchsync.sql`
3. Optional test scripts: `backend/src/main/resources/db/test data/`

### Backend

```bash
cd backend
mvn spring-boot:run
```

API: `http://localhost:8080`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173` (API base in `frontend/src/api/axiosConfig.ts`)

### Docker (optional)

```bash
docker-compose up -d
```

---

## Project layout

```
BranchSync/
├── backend/                 Spring Boot API
├── frontend/                React SPA
├── PROJECT_OVERVIEW.md      Full system documentation
├── SYSTEM_OVERVIEW.md       Module-oriented demo reference
├── BUSINESS_OVERVIEW.md       Plain-language guide for bank staff
└── README.md                This file
```

---

Developed by [Jawadur Rafid](https://jawadur.me)
