# 🗺️ BranchSync — Codebase Map

> A complete guide to every important folder and file in the project.
> Intended for developers joining the project or after returning from a long break.

---

## 📁 Root Directory

```
BranchSync/
├── backend/                  ← Spring Boot REST API
├── frontend/                 ← React + TypeScript SPA
├── docker-compose.yml        ← Starts MySQL for local development
├── hq_approval_migration.sql ← Old migration (HQ approval flow addition)
├── BUSINESS_OVERVIEW.md      ← Non-technical description of how the system works
├── CODEBASE_MAP.md           ← This file
└── README.md                 ← Project setup instructions
```

| File | What it does |
|---|---|
| `docker-compose.yml` | Spins up a MySQL container on port 3306. Run `docker-compose up -d` before starting the backend. |
| `hq_approval_migration.sql` | Legacy SQL migration that added the HQ approval columns to `transfer_requests`. Run once if upgrading from an older version. |
| `BUSINESS_OVERVIEW.md` | Plain-English explanation of the full system — roles, request lifecycle, cash tracking. Good for onboarding. |

---

## 🔧 Backend (`backend/`)

**Tech stack:** Java 21 · Spring Boot 3 · Spring Security + JWT · JPA/Hibernate · MySQL

```
backend/src/main/
├── java/com/jamunabank/branchsync/
│   ├── BranchSyncApplication.java     ← Main entry point
│   ├── controller/                    ← HTTP request handlers (REST endpoints)
│   ├── service/                       ← Business logic interfaces + implementations
│   ├── repository/                    ← Database query interfaces (Spring Data JPA)
│   ├── model/                         ← JPA entities (database table mappings)
│   ├── dto/                           ← Data Transfer Objects (API input/output shapes)
│   ├── mapper/                        ← Converts between entities and DTOs
│   ├── security/                      ← JWT auth, password hashing, Spring Security config
│   └── exception/                     ← Custom exceptions + global error handler
└── resources/
    ├── application.properties         ← DB connection, JWT secret, server config
    └── db/
        ├── migration/                 ← SQL migration scripts (run to set up schema)
        └── test data/                 ← SQL scripts to seed realistic test data
```

---

### 📌 Entry Point

#### `BranchSyncApplication.java`
The `main()` method. Bootstraps the Spring Boot application. Nothing to change here unless adding startup runners.

---

### 🌐 Controllers (`controller/`)

Each controller maps to a URL prefix and handles HTTP requests for a specific domain.

| File | URL Prefix | Responsibility |
|---|---|---|
| `AuthController.java` | `/api/auth` | Login endpoint. Validates credentials, returns a JWT token. |
| `TransferController.java` | `/api/transfers` | The largest controller. Handles the full transfer request lifecycle: create, approve (internal), HQ verify, dest accept, assign driver, pickup, deliver, close. |
| `CashController.java` | `/api/cash` | All cash-tracking endpoints: branch balances, denomination breakdown submission, cash ledger view, manual adjustment submit/approve. |
| `LookupController.java` | `/api/lookup` | Read-only reference data used to populate dropdowns in the UI: branches, departments, categories, available delivery drivers. |
| `OrgManagementController.java` | `/api/admin/org` | System Admin only. CRUD for branches, departments, and item categories. |
| `UserManagementController.java` | `/api/admin/users` | System Admin only. Create, update, deactivate users. |
| `UserController.java` | `/api/users` | Logged-in user operations: view own profile, change password. |

---

### ⚙️ Services (`service/`)

Services contain all actual business logic. Controllers call services; services never call controllers.

#### Interfaces (define the contract)

| File | Purpose |
|---|---|
| `TransferService.java` | Declares all transfer lifecycle methods: initiate, approve, hqVerify, accept, pickup, deliver, close, etc. |
| `CashService.java` | Declares cash tracking methods: balance get/update, ledger recording, denomination save, manual adjustment submit/approve. |
| `AuditService.java` | Declares `logAction()` — writes an audit entry to `audit_logs`. |
| `ManagementService.java` | Declares org CRUD + user management methods used by admins. |

#### Implementations (`service/impl/`)

| File | Purpose |
|---|---|
| `TransferServiceImpl.java` | The core engine. Implements the full transfer state machine. Also calls `CashService` at pickup/delivery/rejection for Cash Bundle transfers. |
| `CashServiceImpl.java` | Manages `branch_cash_balance`, `cash_ledger`, `cash_transfer_denominations`, and `cash_manual_adjustments`. All balance math happens here. Validates denomination totals match requested amounts. |
| `AuditServiceImpl.java` | Writes a row to `audit_logs` with actor, action, old/new status, timestamp, and IP. |
| `ManagementServiceImpl.java` | Creates/updates/deletes branches, departments, categories, and users. Includes role assignment logic. |

---

### 🗄️ Repositories (`repository/`)

All Spring Data JPA interfaces. They automatically generate SQL — no manual queries needed for basic operations. Custom `@Query` methods are added where needed.

| File | Table it queries |
|---|---|
| `TransferRequestRepository.java` | `transfer_requests` — includes custom queries to filter by role/branch/status. |
| `UserRepository.java` | `users` — includes `findByEmployeeId()` for login. |
| `BranchRepository.java` | `branches` |
| `DepartmentRepository.java` | `departments` |
| `ItemCategoryRepository.java` | `item_categories` |
| `AuditLogRepository.java` | `audit_logs` |
| `RoleRepository.java` | `roles` |
| `BranchCashBalanceRepository.java` | `branch_cash_balance` — cash tracking |
| `CashLedgerRepository.java` | `cash_ledger` — cash tracking |
| `CashTransferDenominationRepository.java` | `cash_transfer_denominations` — cash tracking |
| `CashManualAdjustmentRepository.java` | `cash_manual_adjustments` — cash tracking |

---

### 🏛️ Entities (`model/entity/`)

Each class maps directly to a database table using JPA annotations.

| File | Table | What it stores |
|---|---|---|
| `TransferRequest.java` | `transfer_requests` | The central record of every transfer. Holds status, origin/dest branch, category, priority, all timestamps, HQ approval info, delivery person, and cash fields (`requestedAmount`, `denominationsSubmitted`). |
| `User.java` | `users` | Employee accounts: employee ID, full name, hashed password, role, branch, department, active status. |
| `Branch.java` | `branches` | Branch name, code, address, contact info. |
| `Department.java` | `departments` | Department name, linked to a branch. |
| `ItemCategory.java` | `item_categories` | Transfer categories (e.g. "Cash Bundle", "Documents"). Includes sensitivity level. |
| `Role.java` | `roles` | Role definitions (e.g. `OFFICER`, `BRANCH_MANAGER`, `HQ_LOGISTICS_OFFICER`, `SYSTEM_ADMIN`). |
| `AuditLog.java` | `audit_logs` | Immutable audit trail. One row per action taken on a transfer request. |
| `BranchCashBalance.java` | `branch_cash_balance` | Live cash balance for each branch. One row per branch. Updated on every transfer/adjustment. |
| `CashLedgerEntry.java` | `cash_ledger` | Immutable ledger. Every balance movement (in/out/reversal/adjustment) is a new row — never edited. |
| `CashTransferDenomination.java` | `cash_transfer_denominations` | The note-by-note breakdown (৳1000 × 5, ৳500 × 2, etc.) submitted by dest branch when accepting a Cash Bundle request. |
| `CashManualAdjustment.java` | `cash_manual_adjustments` | Manual balance correction requests submitted by officers and approved/rejected by managers. |

---

### 📦 DTOs (`dto/`)

DTOs are plain data classes with no logic. They define the exact shape of data coming **in** from requests or going **out** in responses.

#### Request DTOs (`dto/request/`) — what the frontend sends

| File | Used when |
|---|---|
| `InitiateTransferRequestDto.java` | Creating a new transfer request. Includes `requestedAmount` for Cash Bundle. |
| `ApprovalRequestDto.java` | Manager internally approving/rejecting a request. |
| `VerificationRequestDto.java` | HQ Logistics Officer verifying and routing a request to a destination branch. |
| `CompletionRequestDto.java` | Origin officer accepting or rejecting the delivery on receipt. |
| `CreateUserDto.java` | Admin creating a new user account. |
| `CreateBranchDto.java` | Admin creating a new branch. |
| `CreateDepartmentDto.java` | Admin creating a new department. |
| `CreateItemCategoryDto.java` | Admin creating a new item category. |

#### Response DTOs (`dto/response/`) — what the API returns

| File | Used when |
|---|---|
| `TransferDetailDto.java` | Full detail view of a single transfer. Includes all related data, audit logs, and cash bundle fields. |
| `TransferResponseDto.java` | Lightweight list item used in dashboard/history tables. |
| `AuditLogResponseDto.java` | One audit log entry within a `TransferDetailDto`. |
| `ErrorResponse.java` | Standardised error payload returned on any exception. |

---

### 🔄 Mapper (`mapper/`)

#### `TransferMapper.java`
Converts between `TransferRequest` (entity) and `TransferDetailDto` / `TransferResponseDto` (DTOs). Also maps `InitiateTransferRequestDto` → `TransferRequest` when creating. Keeps controllers clean.

---

### 🔐 Security (`security/`)

| File | Purpose |
|---|---|
| `SecurityConfig.java` | Main Spring Security configuration. Sets up JWT filter, CORS, CSRF-off, stateless sessions. Defines which endpoints are public vs. authenticated. |
| `JwtUtils.java` | Generates JWT tokens on login and validates them on each request. Reads the secret and expiry from `application.properties`. |
| `JwtAuthenticationFilter.java` | A filter that runs before every request. Extracts the JWT from the `Authorization` header, validates it, and sets the authenticated user in the security context. |
| `CustomUserDetails.java` | Wraps a `User` entity to implement Spring Security's `UserDetails`. Exposes `userId`, `branchId`, `role` for use in controllers. |
| `CustomUserDetailsService.java` | Loads a user from the database by employee ID during authentication. |
| `Sha256PasswordEncoder.java` | Custom password encoder using SHA-256 (instead of BCrypt). Keeps compatibility with existing password hashes in the database. |
| `PasswordEncodingRunner.java` | Dev utility. Run this once to generate a SHA-256 hash for a plain-text password to seed the database. |

---

### ❌ Exceptions (`exception/`)

| File | Purpose |
|---|---|
| `GlobalExceptionHandler.java` | `@RestControllerAdvice` — catches all exceptions thrown anywhere in the app and converts them to clean JSON error responses with the right HTTP status codes. |
| `ResourceNotFoundException.java` | Thrown when a requested record (user, branch, transfer) doesn't exist → 404. |
| `UnauthorizedRoleException.java` | Thrown when a user tries to take an action their role doesn't permit → 403. |
| `BusinessRuleViolationException.java` | Thrown when a business rule is broken (e.g. balance too low) → 400. |

---

### 📋 Resources (`resources/`)

#### `application.properties`
Core configuration:
- **Database** — MySQL URL, username, password
- **JWT** — secret key, token expiry duration
- **Server** — port (default 8080)
- **JPA** — DDL mode (`validate` in prod, `update` in dev)

#### `db/migration/`
SQL scripts that alter or create database schema. Run these manually in order when setting up or upgrading the database.

| File | What it adds |
|---|---|
| `branchsync.sql` | Full original schema — all base tables. |
| `cash_tracking_migration.sql` | Adds 4 new cash tracking tables + 2 new columns on `transfer_requests`. |

#### `db/test data/`
| File | Purpose |
|---|---|
| `test_data_mysql.sql` | Basic seed data: roles, branches, departments, users, categories. |
| `extended_test_data_mysql.sql` | More comprehensive seed data including sample transfers across multiple branches. |

---

## 🖥️ Frontend (`frontend/`)

**Tech stack:** React 18 · TypeScript · Vite · React Router · Axios

```
frontend/src/
├── main.tsx               ← App entry point (mounts React to #root)
├── App.tsx                ← Router setup — all page routes defined here
├── App.css                ← Global app-level CSS resets
├── index.css              ← Base styles, typography, layout foundations
├── variables.css          ← CSS custom properties (colors, spacing, shadows)
├── api/                   ← Axios instance configuration
├── context/               ← React context (auth state)
├── types/                 ← Shared TypeScript type definitions
├── components/            ← Reusable UI components
└── pages/                 ← Full page components (one per route)
```

---

### 🚀 Entry Files

| File | Purpose |
|---|---|
| `main.tsx` | Renders `<App />` into the DOM. Wraps with `AuthProvider`. |
| `App.tsx` | Defines all routes with React Router. Protected routes go inside `<Layout>`. Registers all page components. |
| `index.css` | Base styles: font import (Outfit), box-sizing, scrollbar styling, common utility classes. |
| `variables.css` | CSS variables for the design system: `--text-primary`, `--surface-card`, `--color-primary-blue`, `--border-subtle`, etc. Used across all component CSS files. |

---

### 🔌 API (`api/`)

#### `axiosConfig.ts`
Creates and exports a pre-configured Axios instance (`api`). Automatically:
- Sets base URL to `http://localhost:8080/api`
- Attaches the JWT token from `localStorage` to every request's `Authorization` header
- Intercepts 401 responses and redirects to login

---

### 🧠 Context (`context/`)

#### `AuthContext.tsx`
React context that holds the logged-in user's state globally. Provides:
- `user` — decoded JWT payload (employeeId, role, branchId, fullName)
- `login(token)` — stores the JWT in `localStorage` and updates state
- `logout()` — clears `localStorage` and resets state

Used by almost every component to check who is logged in and what role they have.

---

### 📐 Types (`types/`)

#### `transfer.ts`
TypeScript interfaces for transfer-related API responses:
- `TransferResponseDto` — the shape of a transfer in list/dashboard views

---

### 🧩 Components (`components/`)

#### `ProtectedRoute.tsx`
Wrapper component for authenticated routes. Redirects to `/login` if no valid JWT is found in `localStorage`.

#### `Layout/Layout.tsx`
The main app shell. Renders `<Sidebar>` on the left and `<Topbar>` at the top, with the page content in the middle. All authenticated pages are rendered inside this wrapper.

#### `Layout/Sidebar.tsx`
Left navigation sidebar. Shows different nav items depending on the user's role:
- Everyone: Dashboard, New Request, History, Branch Directory
- Managers + Admins: Cash Ledger
- Managers + Officers: Cash Adjustments
- Admins only: User Management, Org Management

#### `Layout/Topbar.tsx`
Top bar showing the logged-in user's employee ID, role badge, avatar, "My Profile" link, and Logout button.

#### `Layout/Layout.css`
Styles the overall app shell: sidebar width, content area, topbar height.

---

### 📄 Pages (`pages/`)

Each page is a full-screen React component rendered by the router.

#### `Login.tsx` + `Login.css`
Login form. Submits employee ID + password to `/api/auth/login`. On success, stores the JWT via `AuthContext.login()` and redirects to the dashboard.

---

#### `Dashboard.tsx` + `Dashboard.css`
Main landing page after login. Shows:
- A personalised greeting
- **"Attention Required" widget** — highlights transfers needing action + any pending cash adjustments (for managers)
- A table of all active transfers the user can see (scoped by role/branch on the backend)

---

#### `NewTransfer.tsx` + `NewTransfer.css`
Form to create a new inter-branch transfer request. Fields:
- Title, description, category, priority
- For **Cash Bundle** category: shows an additional "Amount Requested (৳)" field
- Submits to `POST /api/transfers`

---

#### `TransferDetails.tsx` + `TransferDetails.css`
The most complex page. Shows full details of a single transfer and all action buttons available to the current user at the current stage. Key sections:
- Status badge + transfer metadata card
- **Cash Bundle info card** — shows requested amount, denomination breakdown table (read-only view)
- Action panel — renders different controls depending on role and current status:
  - **Origin Manager**: Approve / Reject internally
  - **HQ Logistics Officer**: Verify & route to branch (branch dropdown shows live cash balances for Cash Bundle), Reject
  - **Destination Branch Officer**: Fill denomination breakdown + select driver → Accept / Return to HQ
  - **Destination Manager**: Final Release / Return to HQ
  - **Delivery Person**: Confirm Pickup / Confirm Delivery
  - **Origin Officer**: Accept on receipt / Reject on receipt
- Timeline of all state changes
- Full audit log table (System Admin only)
- 🖨️ Print Slip — generates a printable HTML slip including denomination table for Cash Bundle

---

#### `TransferHistory.tsx` + `TransferHistory.css`
Searchable, filterable history of all transfers the user can access. Includes:
- Status, date range, branch, category, priority filters
- Paginated table
- System Admin sees all transfers; branch users see their own branch's transfers

---

#### `BranchDirectory.tsx` + `BranchDirectory.css`
Read-only directory of all branches with their departments listed. Visible to all logged-in users.

---

#### `Profile.tsx` + `Profile.css`
Displays the logged-in user's profile details (name, employee ID, role, branch, department). Allows changing the password.

---

#### `CashLedger.tsx` + `CashLedger.css`
**Cash Management** page. Accessible to Branch Managers and System Admins.
- System Admins see a grid of all branches with live balances — click any branch to load its ledger
- Managers see their own branch's balance hero + full ledger table
- Ledger table: color-coded rows (green = cash in, red = cash out, amber = manual adjustment)
- Each row links back to the originating transfer request

---

#### `ManualAdjustment.tsx` + `ManualAdjustment.css`
**Cash Adjustments** page. Accessible to Officers and Managers.
- **Officers** see a submission form: select Credit or Debit, enter amount + mandatory reason, submit for manager approval
- **Managers** see a "Pending Approvals" section with each pending request, a decision note field, and Approve/Reject buttons
- Both see the full adjustment history for their branch

---

#### `admin/UserManagement.tsx`
System Admin only. Full CRUD for user accounts:
- Create users with employee ID, name, password, role, branch, department
- Edit user details and reassign roles/branches
- Activate/deactivate accounts

#### `admin/OrgManagement.tsx`
System Admin only. Full CRUD for the organisational structure:
- Branches — create, edit, delete
- Departments — create within a branch, edit, delete
- Item Categories — create, edit (including sensitivity level), delete

#### `admin/Admin.css`
Shared CSS for both admin pages.

---

## 🔑 Key Design Patterns

| Pattern | Where used | Why |
|---|---|---|
| **Role-based access control (RBAC)** | `TransferServiceImpl`, `CashServiceImpl`, all controllers | Different roles see and can do different things. Checked in both frontend (UI hides buttons) and backend (service throws `UnauthorizedRoleException`). |
| **State machine** | `TransferRequest.status` + `TransferServiceImpl` | Transfer goes through strict ordered statuses: `PENDING_INTERNAL` → `PENDING_HQ_APPROVAL` → `PENDING_ASSIGNMENT` → `PENDING_FINAL_RELEASE` → `READY_FOR_PICKUP` → `IN_TRANSIT` → `DELIVERED` → `COMPLETED`. Each transition is a separate service method. |
| **Immutable audit trail** | `audit_logs`, `cash_ledger` | Rows are only ever inserted, never updated or deleted. Provides a full, tamper-proof history. |
| **Category gating** | `CashServiceImpl`, `TransferServiceImpl` | All cash tracking logic is guarded by `category.categoryName == "Cash Bundle"`. Non-cash transfers are completely unaffected. |
| **DTO pattern** | `dto/request`, `dto/response`, `TransferMapper` | Entities never leave the service layer. Controllers always receive/return DTOs. This prevents accidentally exposing internal fields. |
| **Optimistic UI** | `TransferDetails.tsx` | After any action, `fetchTransferDetails()` is re-called to reload fresh server state instead of manually patching local state. |
