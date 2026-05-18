# BranchSync – Inter-Branch Transfer Management System
### Jamuna Bank PLC | University Practicum Demo Reference

---

## 🏦 Project Overview

**BranchSync** is a full-stack, enterprise-grade **Inter-Branch Transfer & Logistics Management System** built for **Jamuna Bank PLC**. It digitizes and tracks the complete lifecycle of physical asset and document transfers between bank branches — from the moment a request is created by an officer to its final delivery confirmation, covering every approval stage in between.

### Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript (Vite) |
| **Backend** | Spring Boot 3 (Java 21) |
| **Database** | MariaDB / MySQL |
| **Security** | Spring Security + JWT (JSON Web Tokens) |
| **ORM** | Hibernate / Spring Data JPA |
| **Build Tool** | Maven |
| **Styling** | Vanilla CSS (Custom Design System) |

---

## 🗂️ System Modules

### Module 1 — Authentication & Security
The entire system is protected behind a JWT-based authentication layer. No page is accessible without a valid login session.

**Features:**
- Employee login using **Employee ID** and **Password**
- JWT token issued on login, stored in browser memory
- All API calls carry the JWT in the `Authorization: Bearer` header
- Token expiry and auto-logout
- Role-based access enforced on **both** the backend (Spring Security `@PreAuthorize`) and frontend (route guards)
- Password hashing using **BCrypt**

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
| `SYSTEM_ADMIN` | Full access: create users, manage branches, departments, categories, view all transfers |
| `BRANCH_MANAGER` | Approve/reject internal transfers, view branch directory, view branch history |
| `OPERATION_MANAGER` | Same scope as Branch Manager, operational oversight |
| `FIRST_EXECUTIVE_OFFICER` | Senior approval authority, branch directory access |
| `HQ_LOGISTICS_OFFICER` | HQ-level approval of cross-branch transfers, cannot initiate transfers |
| `OFFICER` | Initiate transfer requests, view own transfer history |
| `DELIVERY_PERSON` | Pick up and deliver assigned transfers, mark as delivered |

**The sidebar navigation dynamically changes per role.** Admins see the full administration panel. Managers see the Branch Directory. Officers see New Request. Delivery persons only see their active deliveries.

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
- Title, Description
- Category (linked to department)
- Priority: `NORMAL`, `HIGH`, `URGENT`, `CRITICAL`
- Origin Branch & Department (auto-assigned from session)
- Destination Branch & Department
- Sensitivity Level
- Assigned Delivery Person
- HQ Approver details
- Timestamps: Requested, Picked Up, Delivered, Closed

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
Every action performed on a transfer is permanently recorded in the `audit_logs` table. This gives the system a **complete, tamper-evident history** of who did what and when.

**Each Audit Log Entry Contains:**
- Actor (full name + role)
- Action performed (e.g. `APPROVED_BY_MANAGER`, `PICKED_UP`, `REJECTED_BY_HQ`)
- Human-readable action description
- Remarks / comments entered by the actor
- IP Address of the actor
- Timestamp

**Where it's visible:** On the **Transfer Details** page, a full chronological timeline is rendered showing every action from creation to completion.

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
All completed and active transfers are accessible through a searchable, filterable **History** page. Each role sees a scoped view — officers see only their own transfers, managers see their branch, HQ sees all.

**Filter Capabilities:**
- **Free-text search** — by Request Code, Title, Category, or Initiator Name
- **Date Range filter** — From Date and To Date pickers
- **Branch filter** — Dynamically populated from the user's visible transfers
- **Status filter** — Filter by any transfer status
- **Clear Filters** button

**Export & Print:**
- 🖨️ **Print / Save PDF** — generates a formatted landscape bank report of the **filtered** data
- Standard browser `Ctrl+P` also hides UI chrome and prints only the table

**Frontend Files:**
| File | Path |
|---|---|
| `TransferHistory.tsx` | `frontend/src/pages/TransferHistory.tsx` |
| `TransferHistory.css` | `frontend/src/pages/TransferHistory.css` |

---

### Module 6 — Individual Transfer View & Actions
Each transfer has a detailed view page that shows all metadata, routing information, and the full audit trail. Role-specific action panels allow the right user to perform the next step.

**Action Panels by Role:**

| Role | Available Actions on Transfer Details |
|---|---|
| Branch Manager | ✅ Approve Internal / ❌ Reject / 👤 Assign Delivery Person |
| HQ Officer | ✅ Approve HQ / ❌ Reject with note |
| Delivery Person | 📦 Mark as Picked Up / 🚚 Mark as Delivered |
| Officer (Requester) | ✔️ Confirm Receipt / ❌ Reject on Receipt |
| All (except HQ & Delivery) | 📋 Duplicate Request, 🖨️ Print Slip / Save PDF |

**Print Slip Feature:**
- Opens a new browser window
- Renders a fully formatted **"Official Inter-Branch Transfer Request Slip"** with Jamuna Bank PLC branding
- Contains all metadata + the complete audit trail table
- Auto-triggers the browser print dialog

**Frontend Files:**
| File | Path |
|---|---|
| `TransferDetails.tsx` | `frontend/src/pages/TransferDetails.tsx` |
| `TransferDetails.css` | `frontend/src/pages/TransferDetails.css` |

---

### Module 7 — Dashboard & Smart Alert Widget
The dashboard is the home screen for every role. It shows a real-time table of active transfers relevant to the logged-in user.

**"Attention Required" Widget:**
- Appears automatically if there are transfers **waiting for the user's specific action**
- Intelligent per-role logic:
  - Manager → flags `PENDING_INTERNAL` and `PENDING_FINAL_RELEASE`
  - HQ Officer → flags `PENDING_HQ_APPROVAL`
  - Delivery Person → flags `READY_FOR_PICKUP` and `IN_TRANSIT`
  - Original Requester → flags `DELIVERED` items awaiting their confirmation
- Displays a shaking 🔔 bell icon with a red badge showing the count
- Each item in the widget is a direct clickable link to the transfer

**Frontend Files:**
| File | Path |
|---|---|
| `Dashboard.tsx` | `frontend/src/pages/Dashboard.tsx` |
| `Dashboard.css` | `frontend/src/pages/Dashboard.css` |

---

### Module 8 — System Administration Panel
Accessible **only to SYSTEM_ADMIN**. Provides full CRUD (Create, Read, Update, Delete) control over all master data in the system.

#### Sub-Module 8a — User Management
- View all system users in a paginated table
- Create new user accounts (assign role, branch, department)
- Edit existing user details
- Activate / Deactivate user accounts (soft delete)
- Search and filter users by name, role, or branch

**Frontend Files:**
| File | Path |
|---|---|
| `UserManagement.tsx` | `frontend/src/pages/admin/UserManagement.tsx` |
| `Admin.css` | `frontend/src/pages/admin/Admin.css` |

**Backend Files:**
| File | Path |
|---|---|
| `UserManagementController.java` | `backend/.../controller/UserManagementController.java` |
| `ManagementService.java` | `backend/.../service/ManagementService.java` |

#### Sub-Module 8b — Branch Management
- View all branches in the bank network
- Create new branch records
- Edit branch details: name, code, district, type (`MAIN`, `REGIONAL`, `SUB`)
- Delete branches

**Frontend Files:**
| File | Path |
|---|---|
| `OrgManagement.tsx` (Branches tab) | `frontend/src/pages/admin/OrgManagement.tsx` |

#### Sub-Module 8c — Department Management
- View all departments
- Create, edit, delete departments

**Frontend Files:**
| File | Path |
|---|---|
| `OrgManagement.tsx` (Departments tab) | `frontend/src/pages/admin/OrgManagement.tsx` |

#### Sub-Module 8d — Item Category Management
- View all transferable item/document categories
- Assign sensitivity levels: `NORMAL`, `CONFIDENTIAL`, `HIGHLY_CONFIDENTIAL`
- Link categories to specific departments
- Create, edit, delete categories

**Frontend Files:**
| File | Path |
|---|---|
| `OrgManagement.tsx` (Items & Depts tab) | `frontend/src/pages/admin/OrgManagement.tsx` |

**Backend Files:**
| File | Path |
|---|---|
| `OrgManagementController.java` | `backend/.../controller/OrgManagementController.java` |
| `LookupController.java` | `backend/.../controller/LookupController.java` |

---

### Module 9 — Branch Directory (Manager Exclusive)
A private staff contact book for branch leadership.

**Features:**
- Lists all users belonging to the manager's branch
- **Scoped automatically** — backend filters by the logged-in user's `branchId`
- Search by Name, Employee ID, or Email
- Filter by Department (dynamic dropdown)
- Filter by Role (dynamic dropdown)
- Click-to-email and click-to-call links
- Shows active/inactive status of each staff member

**Visibility:** Only `BRANCH_MANAGER`, `OPERATION_MANAGER`, `FIRST_EXECUTIVE_OFFICER`

**Frontend Files:**
| File | Path |
|---|---|
| `BranchDirectory.tsx` | `frontend/src/pages/BranchDirectory.tsx` |
| `BranchDirectory.css` | `frontend/src/pages/BranchDirectory.css` |

**Backend Files:**
| File | Path |
|---|---|
| `UserController.java` | `backend/.../controller/UserController.java` |

---

### Module 10 — User Profile
Every logged-in user can view their own profile information.

**Displays:**
- Full Name, Employee ID
- Assigned Role
- Branch and Department
- Email and Phone Number
- Account status and creation date

**Frontend Files:**
| File | Path |
|---|---|
| `Profile.tsx` | `frontend/src/pages/Profile.tsx` |
| `Profile.css` | `frontend/src/pages/Profile.css` |

---

### Module 11 — Duplicate / Re-order Transfer
Available to all roles **except** HQ Logistics Officers and Delivery Persons.

**How it works:**
- A "📋 Duplicate Request" button appears on every Transfer Details page
- Clicking it navigates to the New Transfer form
- The form is **automatically pre-filled** with: Title, Description, Category, Priority, Destination Branch, and Destination Department
- The user can adjust any field before submitting as a brand-new request

**Use Case:** Officers who perform the same recurring transfer (e.g., daily cash remittance) can re-order in 2 clicks.

**Frontend Files:**
| File | Path |
|---|---|
| `TransferDetails.tsx` | `frontend/src/pages/TransferDetails.tsx` |
| `NewTransfer.tsx` | `frontend/src/pages/NewTransfer.tsx` |

---

## 🗄️ Database Schema (Core Tables)

| Table | Description |
|---|---|
| `users` | All system users, linked to a role, branch, and department |
| `roles` | 7 role definitions |
| `branches` | All bank branches with type and district |
| `departments` | Departments that exist within branches |
| `item_categories` | Transferable item types with sensitivity levels |
| `transfer_requests` | The core transfer records with full state machine |
| `audit_logs` | Immutable log of every action on every transfer |

---

## 🔐 API Security Architecture

All backend APIs are secured under the base path `/api/`. The security layer works as follows:

1. **Login** → `POST /api/auth/login` → Returns JWT token
2. **Every subsequent request** → Must include `Authorization: Bearer <token>`
3. **Spring Security** validates the token and loads the `CustomUserDetails`
4. **Method-level security** (`@PreAuthorize`) enforces role restrictions on sensitive endpoints

**Key Endpoints:**

| Method | Endpoint | Access |
|---|---|---|
| `POST` | `/api/auth/login` | Public |
| `GET` | `/api/users/profile` | All authenticated |
| `GET` | `/api/users/branch-directory` | Managers only |
| `GET` | `/api/transfers` | Role-scoped |
| `POST` | `/api/transfers` | Officers, Managers |
| `GET` | `/api/transfers/{id}` | Role-scoped |
| `POST` | `/api/transfers/{id}/approve-internal` | Branch Managers |
| `POST` | `/api/transfers/{id}/approve-hq` | HQ Officers |
| `POST` | `/api/transfers/{id}/assign-delivery` | Branch Managers |
| `POST` | `/api/transfers/{id}/pickup` | Delivery Persons |
| `POST` | `/api/transfers/{id}/deliver` | Delivery Persons |
| `POST` | `/api/transfers/{id}/confirm-receipt` | Original Requester |
| `GET` | `/api/transfers/history` | Role-scoped |
| `GET` | `/api/admin/users` | SYSTEM_ADMIN |
| `POST` | `/api/admin/users` | SYSTEM_ADMIN |
| `GET` | `/api/lookup/branches` | All authenticated |
| `GET` | `/api/lookup/departments` | All authenticated |
| `GET` | `/api/lookup/categories` | All authenticated |

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
│   └── AuthContext.tsx         ← Global auth state (user, token, login, logout)
├── pages/
│   ├── Login.tsx               ← Login page
│   ├── Dashboard.tsx           ← Home dashboard with Attention Widget
│   ├── NewTransfer.tsx         ← Create transfer form (with duplicate prefill)
│   ├── TransferDetails.tsx     ← Full transfer view + action panels + print
│   ├── TransferHistory.tsx     ← Filterable history table + PDF export
│   ├── BranchDirectory.tsx     ← Branch staff directory (Managers only)
│   ├── Profile.tsx             ← User profile view
│   └── admin/
│       ├── UserManagement.tsx  ← Admin: CRUD for users
│       └── OrgManagement.tsx   ← Admin: Branches, Departments, Categories
├── types/
│   └── transfer.ts             ← TypeScript interfaces for transfer DTOs
└── App.tsx                     ← Main router with all route definitions
```

---

## 🎯 Key Demo Scenarios (What to Show in Demo)

### Scenario A — Full Transfer Lifecycle (End-to-End)
1. Log in as an **Officer** → Create a new transfer (fill all fields, show route visual)
2. Log out → Log in as **Branch Manager** → See it in "Attention Required" widget → Approve it
3. Log in as **HQ Logistics Officer** → See it pending HQ approval → Approve it
4. Log back in as **Branch Manager** → Assign a Delivery Person
5. Log in as **Delivery Person** → Pick it up → Mark as Delivered
6. Log back in as the original **Officer** → Confirm receipt → Transfer is COMPLETED

### Scenario B — Rejection Flow
1. Create a transfer as an Officer
2. Log in as Branch Manager → Reject it with a reason
3. Log in as the Officer → See it in history with status `REJECTED`

### Scenario C — HQ Officer Rejection
1. Push a transfer to `PENDING_HQ_APPROVAL`
2. Log in as HQ Officer → Reject with a note
3. Show the audit log reflecting the HQ rejection reason

### Scenario D — System Admin Demonstration
1. Log in as SYSTEM_ADMIN → Show all 4 admin tabs
2. Create a new user, assign them a role and branch
3. Add a new branch, add a new department, add a new item category

### Scenario E — Branch Directory & Filtering
1. Log in as a Branch Manager → Click "Branch Directory" in sidebar
2. Search for a user by name
3. Filter by department
4. Show click-to-email and click-to-call links

### Scenario F — Export & Print
1. Open Transfer History → Apply a date range filter
2. Click "Print / Save PDF" → Show the formatted bank report
3. Open any Transfer Details → Click "Print Slip / Save PDF" → Show the official slip

### Scenario G — Duplicate Request
1. Open a COMPLETED transfer
2. Click "📋 Duplicate Request"
3. Show that the New Transfer form is automatically pre-filled

---

## 💡 Key Talking Points for Demo

- **"BranchSync replaces manual paperwork and phone calls between branches"**
- **"Every action is permanently logged for regulatory audit purposes"**
- **"The system enforces workflow — no step can be skipped"**
- **"Each role only sees what they are authorized to see — both on the UI and at the API level"**
- **"The print/PDF feature produces bank-grade official slips suitable for physical record-keeping"**
- **"The Attention Required widget eliminates the need to manually scan lists — it surfaces exactly what needs action"**
- **"The Branch Directory gives managers a private, always-up-to-date staff contact book"**
- **"Duplicate Request saves officers significant time on recurring daily transfers"**

---

*Document generated: May 2026 | BranchSync v1.0 | Jamuna Bank PLC Practicum Project*
