# BranchSync – Inter-Branch Transfer Management System
### Jamuna Bank PLC | University Practicum Demo Reference

---

## 🏦 Project Overview

**BranchSync** is a full-stack, enterprise-grade **Inter-Branch Transfer & Logistics Management System** built for **Jamuna Bank PLC**. It digitizes and tracks the complete lifecycle of physical asset and document transfers between bank branches — from the moment a request is created by an officer to its final delivery confirmation, covering every approval stage in between. Additionally, it integrates a real-time **💰 Cash Vault Tracking & Ledger System** with denomination breakdowns, low cash thresholds, and safe manual corrections.

### Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript (Vite) |
| **Backend** | Spring Boot 3 (Java 21) |
| **Database** | MariaDB / MySQL |
| **Security** | Spring Security + JWT (JSON Web Tokens) |
| **ORM** | Hibernate / Spring Data JPA |
| **Build Tool** | Maven |
| **Styling** | Vanilla CSS (Custom Premium Design System) |

---

## 🗂️ System Modules

### Module 1 — Authentication & Security
The entire system is protected behind a JWT-based authentication layer. No page is accessible without a valid login session.

**Features:**
- Employee login using **Employee ID** and **Password**
- JWT token issued on login, carrying standard user claims plus `departmentName`
- All API calls carry the JWT in the `Authorization: Bearer` header
- Token expiry and auto-logout
- Role-based access enforced on **both** the backend (Spring Security `@PreAuthorize`) and frontend (route guards)
- Password hashing using **BCrypt / SHA-256**

**Frontend Files:**
| File | Path |
|---|---|
| `Login.tsx` | `frontend/src/pages/Login.tsx` |
| `Login.css` | `frontend/src/pages/Login.css` |
| `ProtectedRoute.tsx` | `frontend/src/components/ProtectedRoute.tsx` |
| `AuthContext.tsx` | `frontend/src/context/AuthContext.tsx` |
| `axiosConfig.ts` | `frontend/src/api/axiosConfig.ts` |

**Backend Files:**
| File | Path |
|---|---|
| `AuthController.java` | `backend/.../controller/AuthController.java` |
| `CustomUserDetails.java` | `backend/.../security/CustomUserDetails.java` |

---

### Module 2 — Role-Based Access Control (RBAC)
The system defines **7 distinct user roles**, each with a unique set of permissions and a dedicated dashboard view.

| Role | Key Permissions |
|---|---|
| `SYSTEM_ADMIN` | Full access: manage users, branches, departments, categories, view all balances, view consolidated print reports |
| `BRANCH_MANAGER` | Approve/reject transfers, view branch directory, view cash ledger, approve/reject manual adjustments |
| `OPERATION_MANAGER` | Same scope as Branch Manager, operational oversight |
| `FIRST_EXECUTIVE_OFFICER` | Senior approval authority, branch directory access, cash vault oversight |
| `HQ_LOGISTICS_OFFICER` | HQ-level approval of cross-branch transfers, low-cash balance warning warnings |
| `OFFICER` | Initiate transfer requests, view own transfer history, request manual adjustments |
| `DELIVERY_PERSON` | Pick up and deliver assigned transfers, mark as delivered |

**The sidebar navigation dynamically changes per role.** Admins see the full administration panel. Managers and Cash Department Officers see the **💰 Cash Ledger** sidebar. Delivery persons only see active deliveries.

**Frontend Files:**
| File | Path |
|---|---|
| `Sidebar.tsx` | `frontend/src/components/Layout/Sidebar.tsx` |
| `Layout.tsx` | `frontend/src/components/Layout/Layout.tsx` |
| `Layout.css` | `frontend/src/components/Layout/Layout.css` |

---

### Module 3 — Transfer Request Lifecycle (Core Module)
This is the heart of the system. Every transfer request passes through a **state machine** with well-defined status transitions.

#### Complete Transfer Status Flow:

```
PENDING_INTERNAL
    ↓ (Branch Manager approves)
PENDING_HQ_APPROVAL          ← (if cross-branch, requires HQ Officer)
    ↓ (HQ Officer approves)
PENDING_ASSIGNMENT
    ↓ (Manager assigns a delivery person)
READY_FOR_PICKUP
    ↓ (Delivery Person picks up)
IN_TRANSIT
    ↓ (Delivery Person marks delivered)
DELIVERED
    ↓ (Receiving Officer confirms)
COMPLETED
```

**Rejection paths at any stage → `REJECTED_BY_HQ` / `REJECTED_ON_RECEIPT` / `CANCELLED`**

**Transfer Fields:**
- Request Code (auto-generated, e.g. `REQ-00042`)
- Title, Description, category (linked to department)
- Priority: `NORMAL`, `HIGH`, `URGENT`, `CRITICAL`
- Origin & Destination Branch & Department
- Sensitivity Level, Assigned Delivery Person, Timestamps, HQ details
- **Denominations Submitted** (for Cash category transfers)

**Frontend Files:**
| File | Path |
|---|---|
| `Dashboard.tsx` | `frontend/src/pages/Dashboard.tsx` |
| `Dashboard.css` | `frontend/src/pages/Dashboard.css` |
| `NewTransfer.tsx` | `frontend/src/pages/NewTransfer.tsx` |
| `NewTransfer.css` | `frontend/src/pages/NewTransfer.css` |
| `TransferDetails.tsx` | `frontend/src/pages/TransferDetails.tsx` |
| `TransferDetails.css` | `frontend/src/pages/TransferDetails.css` |

**Backend Files:**
| File | Path |
|---|---|
| `TransferController.java` | `backend/.../controller/TransferController.java` |
| `TransferService.java` | `backend/.../service/TransferService.java` |
| `TransferServiceImpl.java` | `backend/.../service/impl/TransferServiceImpl.java` |
| `TransferRequest.java` | `backend/.../model/entity/TransferRequest.java` |

---

### Module 4 — Audit Log & Lifecycle Tracking
Every action performed on a transfer is permanently recorded in the `audit_logs` table.

**Each Audit Log Entry Contains:**
- Actor (full name + role), Action performed, Human-readable description, Remarks/comments, IP address, and Timestamp.

**Frontend Files:**
| File | Path |
|---|---|
| `TransferDetails.tsx` | `frontend/src/pages/TransferDetails.tsx` |

**Backend Files:**
| File | Path |
|---|---|
| `AuditLog.java` | `backend/.../model/entity/AuditLog.java` |
| `AuditService.java` | `backend/.../service/AuditService.java` |

---

### Module 5 — Transfer History & Advanced Filtering
All completed and active transfers are accessible through a searchable, filterable **History** page.

**Filter & Export Capabilities:**
- Free-text search, Date range filter, Branch & Status dropdown filters
- 🖨️ **Print / Save PDF** — generates landscape bank history reports of the filtered results.

**Frontend Files:**
| File | Path |
|---|---|
| `TransferHistory.tsx` | `frontend/src/pages/TransferHistory.tsx` |
| `TransferHistory.css` | `frontend/src/pages/TransferHistory.css` |

---

### Module 6 — Individual Transfer View & Actions
Detailed view page with role-specific action panels for approving, assigning, picking up, delivering, and closing requests.

**Official Print Slip:**
- Opens a branded **"Official Inter-Branch Transfer Request Slip"** showing all metadata, note breakdowns (for cash transfers), and full transaction timelines. Auto-triggers print.

---

### Module 7 — Dashboard & Smart Alert Widget
Main dashboard with real-time active transfers table scoped per role.

**"Attention Required" Widget:**
- Flags pending manager approvals (`PENDING_INTERNAL` / `PENDING_FINAL_RELEASE`), HQ approvals (`PENDING_HQ_APPROVAL`), active transits (`IN_TRANSIT`), or pending manual cash adjustments awaiting manager decision.

---

### Module 8 — System Administration Panel
Accessible exclusively to `SYSTEM_ADMIN` roles. Enables full user, branch, department, and category CRUD.

---

### Module 9 — Branch Directory
A private staff contact book filtered by the logged-in user's branch for Manager roles.

---

### Module 10 — Cash Stock Tracking & Vault System (Specialized Module)
This module tracks physical cash holdings and transaction logs inside branch vaults, strictly applied to the **Cash Bundle** category.

**Features:**
- **Vault Automation**: When a courier picks up a cash bundle, the sending branch's vault balance is debited. When delivered, the receiving branch's balance is credited. If rejected, it reverses back.
- **Denomination breakdown validation**: The destination branch staff must fill in note denominations (৳1000 x N, ৳500 x M, etc.) when accepting. The system checks that the calculated total matches the requested amount.
- **Low Cash Warnings**: Flags destination branches with a `⚠️ LOW` status in the HQ Approval page if their current cash balance is strictly less than the requested transfer amount.
- **Manual Balance Adjustments**: Scoped adjustments form where Officers can request vault corrections (Credit/Debit) with a mandatory reason, and Managers can decide on them.
- **Double Balance Guard**: Validates that no Officer can submit, and no Manager can approve, a manual debit adjustment that exceeds the branch's current cash balance.
- **Audit Trails**: Ledger displays the ledger reason field, populated with the custom reasons for adjustments or clear automated messages for transfer events.
- **Premium Printing**:
  - **Export PDF / Print**: Generates landscape bank ledger reports for single branches.
  - **Print All Branch Balances**: For System Admin users, generates portrait consolidated summaries of all branches and total vault reserves in the bank system.
  - **Toggleable Selection**: Admins can toggle branch selection on/off in the ledger.

**Frontend Files:**
| File | Path |
|---|---|
| `CashLedger.tsx` | `frontend/src/pages/CashLedger.tsx` |
| `CashLedger.css` | `frontend/src/pages/CashLedger.css` |
| `ManualAdjustment.tsx` | `frontend/src/pages/ManualAdjustment.tsx` |
| `ManualAdjustment.css` | `frontend/src/pages/ManualAdjustment.css` |

**Backend Files:**
| File | Path |
|---|---|
| `CashController.java` | `backend/.../controller/CashController.java` |
| `CashService.java` | `backend/.../service/CashService.java` |
| `CashServiceImpl.java` | `backend/.../service/impl/CashServiceImpl.java` |
| `BranchCashBalance.java` | `backend/.../model/entity/BranchCashBalance.java` |
| `CashLedgerEntry.java` | `backend/.../model/entity/CashLedgerEntry.java` |
| `CashManualAdjustment.java` | `backend/.../model/entity/CashManualAdjustment.java` |

---

## 🗄️ Database Schema (Core Tables)

| Table | Description |
|---|---|
| `users` | System users linked to roles, branches, and departments |
| `roles` | 7 system role definitions |
| `branches` | All bank branches with type (`HQ`, `AD_BRANCH`, `SUB_BRANCH`) |
| `departments` | Global department list |
| `item_categories` | Item types (sensitivity level, responsible department) |
| `transfer_requests` | Transfer requests lifecycle status records |
| `branch_cash_balances` | Vault cash holdings per branch |
| `cash_ledger` | Immutable audit trail of every vault balance movement |
| `cash_manual_adjustments` | Scoped manual adjustment requests (Credit/Debit) |
| `audit_logs` | Immutable audit history of all request actions |

---

## 🔐 API Security & Endpoint Architecture

All backend APIs are secured under `/api/` using JWT authentication.

**Key Cash Endpoints:**
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/cash/balances` | `SYSTEM_ADMIN` | List all branch cash vault balances |
| `GET` | `/api/cash/balance/{branchId}` | Scoped | Get current vault balance of a branch |
| `GET` | `/api/cash/ledger/{branchId}` | Scoped | Get cash ledger history for a branch |
| `POST` | `/api/cash/adjust` | `OFFICER` | Submit a manual vault adjustment |
| `POST` | `/api/cash/adjust/{id}/decide` | Managers | Approve or reject a pending adjustment |
| `GET` | `/api/cash/adjust/all` | Scoped | View all branch manual adjustments history |
| `GET` | `/api/cash/adjust/pending` | Managers | Get pending manual adjustments |

---

## 🧩 Frontend Application Structure

```
frontend/src/
├── api/
│   └── axiosConfig.ts          ← Global Axios instance with JWT interceptor
├── components/
│   ├── Layout/
│   │   ├── Layout.tsx          ← Main layout wrapper (Sidebar + Topbar + Outlet)
│   │   ├── Layout.css          ← Layout styling
│   │   ├── Sidebar.tsx         ← Role-aware navigation sidebar
│   │   └── Topbar.tsx          ← Top header bar with user menu
│   └── ProtectedRoute.tsx      ← Route guard (redirects to login if no auth)
├── context/
│   └── AuthContext.tsx         ← Global auth state (with user departmentName)
├── pages/
│   ├── Login.tsx               ← Login page
│   ├── Dashboard.tsx           ← Home dashboard with Attention Widget & Adjustments
│   ├── NewTransfer.tsx         ← Create transfer form (denomination breakdown supported)
│   ├── TransferDetails.tsx     ← Full transfer view + note breakdown details + print slip
│   ├── TransferHistory.tsx     ← Filterable history table + PDF export
│   ├── BranchDirectory.tsx     ← Branch staff directory (Managers only)
│   ├── Profile.tsx             ← User profile view
│   ├── CashLedger.tsx          ← Cash vault balances and movement list + print / export PDF
│   ├── ManualAdjustment.tsx    ← Manual adjustments submissions & decisions + balance badge
│   └── admin/
│       ├── UserManagement.tsx  ← Admin: CRUD for users
│       └── OrgManagement.tsx   ← Admin: Branches, Departments, Categories
├── types/
│   └── transfer.ts             ← TypeScript interfaces for transfer DTOs
└── App.tsx                     ← Main router with all route definitions
```

---

## 💡 Key Talking Points for Demo

- **"BranchSync replaces manual paperwork and phone calls between branches"**
- **"Every single cash movement is permanently tracked and audited in the Cash Ledger"**
- **"Automated balance debits and credits trigger on physical logistics transitions"**
- **"The note denomination breakdown ensures cash accuracy and is visible on print slips"**
- **"The double balance guard prevents branches from accidentally going negative"**
- **"Integrated Attention widgets alerts managers to pending manual vault adjustments"**
- **"Comprehensive single branch landscape reports and admin Portrait Consolidated reports"**

---

*Document generated: May 2026 | BranchSync v1.1 | Jamuna Bank PLC Practicum Project*
