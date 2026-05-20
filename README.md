# BranchSync - Jamuna Bank PLC

BranchSync is an internal inter-branch transfer and requisition tracking system for Jamuna Bank PLC. It manages the movement of sensitive operational assets between branches, including cash bundles, cheque books, demand drafts, IT equipment, stationery, security items, and other branch resources. It features a fully-fledged **💰 Cash Stock Tracking and Vault Ledger System** with notes denomination tracking, balance validations, and manual adjustments auditing.

The project is a monorepo with a Spring Boot backend, a React/Vite frontend, MariaDB schema and seed data, JWT authentication, role-aware transfer workflow screens, user profile support, transfer history, and admin tools for users, branches, departments, and item categories.

## Current Project Status

The project currently has a working end-to-end transfer workflow across backend and frontend, plus a real-time vault balance audit trail.

Implemented areas:

- Employee ID/password login with JWT authentication (propagating `departmentName`).
- Protected frontend routes with persisted auth state.
- User profile page backed by `/api/users/profile`.
- Dashboard for role/branch-scoped active transfers and pending action alerts.
- New transfer request form (with duplicate prefill).
- Transfer details page with role-aware workflow actions.
- Transfer history page for completed, rejected, and cancelled transfers with date, category, branch, and status filtering.
- **💰 Cash Stock Tracking & Ledger System**:
  - Automatically debits sending branch balance upon physical courier pickup (`recordTransferOut`) and credits receiving branch balance upon physical delivery (`recordTransferIn`). On final receipt rejection, the ledger automatically reverses the movement (`recordReversal`).
  - Strict scope: applied only to the **Cash Bundle** category; all other item categories remain simple physical trackings.
  - **Denomination breakdown**: Dest branch staff must input denomination counts (৳1000, ৳500, ৳200, ৳100, ৳50, etc.) on acceptance. The system calculates and validates that the total matches the request amount, displaying this breakdown on the printed slip.
  - **Low Cash Warnings**: HQ Approval page flags sending branches with a `⚠️ LOW` warning if their vault balance is less than the requested amount. Cash officers are blocked from accepting if their branch balance is too low.
  - **Manual Adjustments Panel**: Scoped screen for Officers to submit vault corrections with a mandatory reason, and Managers to approve/reject them.
  - **Double Balance Guard**: Validates both on the frontend (instant form alerts with live balance indicators) and backend (exception throws in service layer) that no user can submit or approve a manual debit adjustment that exceeds the branch's current cash balance.
  - **Ledger Reason Audit**: Every ledger record saves a descriptive reason column, displaying the officer's typed manual reasoning or clear automated transfer status logs.
  - **Premium Button styling**: Header controls styled as solid, modern white buttons with borders, depth shadows, bold typography, and hover translations.
  - **Audit Printing & PDF Exports**:
    - **Single Branch Landscape Report**: Formatted Landscape printout for branch users showing full balance movements, credit/debit totals, and timestamps.
    - **Consolidated Portrait Report**: Formatted portrait printout for `SYSTEM_ADMIN` users showing all branches cash balances and total system cash reserves.
    - **Toggleable Deselection**: Admins can deselect selected branches by clicking again on cards.
- Admin user management with create, edit, profile view, filtering, and activation toggling.
- Admin branch management with branch create/update and department assignment.
- Admin department management with global department create/update.
- Admin item category management with create/update, sensitivity level, description, and responsible department mapping.
- MariaDB / MySQL schema and seed/test data scripts.
- Transactional audit logging for transfer status changes.
- Backend service and repository tests.
- Custom BranchSync logo/favicon assets in the frontend.

## Core Purpose

BranchSync is a controlled banking workflow system. It is meant to:

- Request assets from one branch to another.
- Enforce source branch approval before destination processing.
- Let destination staff accept requests, supply note breakdowns (for cash), and assign available delivery personnel.
- Require destination manager-level release before pickup.
- Track pickup, transit, delivery, and final requester verification, dynamically updating branch cash balances for cash transfers.
- Keep a detailed audit trail of workflow actions and vault movements.
- Restrict visibility and actions by role, branch, department, and item ownership.

## Workflow

The transfer lifecycle is implemented as a six-step process.

1. Request initiation
   - A branch user creates a transfer request.
   - Regular officers start at `PENDING_INTERNAL`.
   - Manager-level users bypass internal approval and start at `PENDING_ASSIGNMENT`.

2. Source branch internal approval
   - A manager-level user from the origin branch approves the request.
   - Status changes from `PENDING_INTERNAL` to `PENDING_ASSIGNMENT`.

3. Destination acceptance and delivery assignment
   - Destination branch staff accepts the request (inputs note denomination counts for Cash Bundle transfers).
   - An available delivery person is assigned.
   - Status changes to `PENDING_FINAL_RELEASE`.

4. Final destination release
   - A manager-level user from the destination branch gives final approval.
   - Status changes to `READY_FOR_PICKUP`.

5. Pickup and delivery
   - The assigned delivery person marks pickup.
   - Status changes to `IN_TRANSIT`, the delivery person becomes unavailable, and cash balances are debited for Cash Bundle transfers.
   - The same delivery person marks delivery.
   - Status changes to `DELIVERED`, the delivery person becomes available again, and cash balances are credited for Cash Bundle transfers.

6. Final requester verification
   - The original requester accepts or rejects the delivered item.
   - Accepted requests become `COMPLETED`.
   - Rejected requests become `REJECTED_ON_RECEIPT` (automatically reversing cash balances if it is a Cash Bundle transfer).

## Status Values

Transfer requests use string status values:

- `PENDING_INTERNAL`
- `PENDING_ASSIGNMENT`
- `PENDING_FINAL_RELEASE`
- `READY_FOR_PICKUP`
- `IN_TRANSIT`
- `DELIVERED`
- `COMPLETED`
- `REJECTED_ON_RECEIPT`
- `CANCELLED`

## Roles

The seed data and backend logic use these roles:

- `SYSTEM_ADMIN`
- `FIRST_EXECUTIVE_OFFICER`
- `BRANCH_MANAGER`
- `OPERATION_MANAGER`
- `OFFICER`
- `DELIVERY_PERSON`

## Main API Areas

Authentication:
- `POST /api/auth/login`

Lookups:
- `GET /api/lookup/branches`
- `GET /api/lookup/departments`
- `GET /api/lookup/roles`
- `GET /api/lookup/categories`
- `GET /api/lookup/users/delivery-persons/available`

Transfers:
- `GET /api/transfers`
- `GET /api/transfers/history`
- `GET /api/transfers/{requestId}`
- `POST /api/transfers`
- `POST /api/transfers/{requestId}/approve-internal`
- `POST /api/transfers/{requestId}/accept`
- `POST /api/transfers/{requestId}/release`
- `POST /api/transfers/{requestId}/pickup`
- `POST /api/transfers/{requestId}/deliver`
- `POST /api/transfers/{requestId}/close`

Cash Vault & Ledger:
- `GET /api/cash/balances` (Admin only)
- `GET /api/cash/balance/{branchId}`
- `GET /api/cash/ledger/{branchId}`
- `POST /api/cash/adjust`
- `POST /api/cash/adjust/{id}/decide`
- `GET /api/cash/adjust/all`
- `GET /api/cash/adjust/pending`

Admin organization:
- `GET /api/admin/org/branches`
- `POST /api/admin/org/branches`
- `GET /api/admin/org/departments`
- `GET /api/admin/org/items`

Admin users:
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PUT /api/admin/users/{userId}`
- `PUT /api/admin/users/{userId}/toggle-active`

## Frontend Routes

Public:
- `/login`

Protected:
- `/`
- `/profile`
- `/transfers/new`
- `/transfers/history`
- `/transfers/:id`
- `/cash/ledger`
- `/cash/adjust`
- `/admin/users`
- `/admin/branches`
- `/admin/departments`
- `/admin/items`

## Local Development

### Prerequisites

- Java 21
- Maven 3.9+
- Node.js 22+
- MariaDB / MySQL (XAMPP / Local server)

### Backend Setup

1. Create a local MariaDB/MySQL database named `branchsync`.
2. Apply schema and seed data scripts:
   - `backend/src/main/resources/db/migration/schema_mysql.sql`
   - `backend/src/main/resources/db/test data/test_data_mysql.sql`
3. Run the Spring Boot application:
   - `cd backend`
   - `mvn spring-boot:run` (Server runs on `http://localhost:8080`)

### Frontend Setup

1. Install dependencies and run Vite:
   - `cd frontend`
   - `npm install`
   - `npm run dev` (Client runs on `http://localhost:5173`)

---

Developed by [Jawadur Rafid](https://jawadur.pro.bd)
