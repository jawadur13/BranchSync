# BranchSync — Project Defense & Viva Preparation Guide

This document is compiled specifically for project defense and viva preparation. It answers common operational and architectural questions feature-by-feature, details file responsibilities, traces process flows, and links components to their database schema and endpoints.

---

## Core Architecture & System Stack

To start any viva explanation, present a crisp summary of the system architecture:
* **Frontend**: React 18, TypeScript, Vite. Single Page Application (SPA) driven by React Router. State is held locally and scoped inside React Contexts (like `AuthContext`). Intercepted by Axios to auto-inject JWT tokens. Styling is premium, custom-written Vanilla CSS.
* **Backend**: Spring Boot 3, Java 21, Spring Data JPA, Spring Security (JWT-based stateless authentication).
* **Database**: MySQL/MariaDB.
* **Design Pattern**: Three-tier architecture. Controller Layer (REST endpoints) ⇄ Service Layer (Business logic state engine) ⇄ Repository Layer (JPA-driven queries) ⇄ Database (Relational tables).

---

## Workflow Implementation Status (Important!)

During your defense, you must confidently represent which features are ready and which are extension points:

### 1. [Fully Implemented] Core Mechanics
* **JWT Security & Custom Encoding**: Stateless tokens with SHA-256 custom hashing in the `Sha256PasswordEncoder` component.
* **HQ Routing**: Dynamic Supplier Branch and Department assignment by central operations, deferred at request initiation.
* **Dual-Custody Approvals**: Source manager internal approval, supplying branch acceptance/release gates, and double-authorizer manual balance adjustments.
* **Double-Entry Append-Only Ledger**: Vault cash ledger (`cash_ledger`) and SKU quantity ledger (`stock_ledger`) are strictly append-only. Error corrections write reversal transactions.
* **Stock Category Behavior**: Category behavior maps (`CategoryBehavior.STOCK` / `CategoryBehavior.CASH` / `CategoryBehavior.DOCUMENT_CASE`) dynamically toggle denomination entry tables, stock item listings, live balances, and workflow rules.

### 2. [Partially Implemented] Extension Capabilities
* **Backend-Driven Server-Side Pagination**: Standard JPA Page interfaces are implemented in the `UserRepository` interface (e.g., `Page<User> findByRole_RoleName(...)`). However, the controller layer returns unpaginated lists to the React frontend client, which processes full array sorting, filtering, and searches instantly in the browser memory for a highly responsive user experience.
* **Audit Scoping**: Security constraints in `TransferController.java` (`getTransferById()` method) scope what audit trails are loaded in the browser. For instance, drivers can only see pickup/delivery logs.

### 3. [Planned / Not Yet Implemented] Future Features
* **Cancel Request Capability**: The React frontend (`Dashboard.tsx`, `TransferHistory.tsx`) declares badge styles for a `CANCELLED` status. However, there is no backend route, endpoint, or service method to perform request cancellations. This is a planned security enhancement.

---

## Module-by-Module Defense Profiles

---

# 1. Authentication & Authorization

*Status: **[Fully Implemented]***

## Business Purpose
Secures access to banking operations. Ensures only verified employees can log in using their unique Employee ID, and restricts actions in accordance with their designated role.

## User Flow
User submits credentials (Employee ID and password) on the login screen. On success, the API returns a stateless JWT token alongside the employee's profile metadata. This JWT is stored in `localStorage` and attached to all subsequent request headers.

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/Login.tsx` (Login UI form & input management)
  * `frontend/src/context/AuthContext.tsx` (Authentication provider & global state store)
  * `frontend/src/components/ProtectedRoute.tsx` (Route-level auth guard)
  * `frontend/src/api/axiosConfig.ts` (API Client with JWT interceptor)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/AuthController.java` (Exposes authentication endpoint)
  * `backend/src/main/java/com/jamunabank/branchsync/security/JwtUtils.java` (JWT parsing & validation utilities)
  * `backend/src/main/java/com/jamunabank/branchsync/security/JwtAuthenticationFilter.java` (Pre-controller filter intercepting headers)
  * `backend/src/main/java/com/jamunabank/branchsync/security/CustomUserDetailsService.java` (Loads user record by Employee ID)
  * `backend/src/main/java/com/jamunabank/branchsync/security/CustomUserDetails.java` (User detail principal object)
  * `backend/src/main/java/com/jamunabank/branchsync/security/Sha256PasswordEncoder.java` (Hashed password encoder)
  * `backend/src/main/java/com/jamunabank/branchsync/security/SecurityConfig.java` (Spring Security filter chain builder)
* **Database**:
  * `users` (Hashed password, active flag, branch, department)
  * `roles` (User security role tags)

### Visual Source Mapping
* **Login Screen**:
  * **Page Component**: `frontend/src/pages/Login.tsx`
  * **Child Components**: Password visibility toggle (SVG inline button)
  * **Styling Sheet**: `frontend/src/pages/Login.css`
  * **Data Source API**: `POST /api/auth/login`

## APIs Used
* `POST /api/auth/login` → Handles authentication. Returns the JWT token, employee profile details, and role specifications.

## Common Viva Questions
* **Q: Why did you choose SHA-256 instead of BCrypt?**
  * **A:** SHA-256 was implemented to align with the seeded database records and existing corporate directories. In production, a rolling update is usually configured to migrate SHA-256 legacy records to BCrypt.
* **Q: Where is the JWT verified on the backend?**
  * **A:** Inside the `doFilterInternal()` method in `JwtAuthenticationFilter.java`. It intercepts all requests before they hit controllers, parses the `Authorization: Bearer <token>` header, verifies the signature, and sets the auth context.

---

# 2. Dashboard

*Status: **[Fully Implemented]***

## Business Purpose
Provides employees with a personalized landing zone containing immediate notifications, metric cards, and a real-time table of active inter-branch transfers relevant to their specific role.

## User Flow
Upon logging in, the user lands on the dashboard. They see a personalized greeting, a high-priority "Attention Required" action box, and a list of active transfers. Clicking any row navigates directly to the Transfer Details screen.

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/Dashboard.tsx` (Dashboard UI & action tables)
  * `frontend/src/components/Layout/Sidebar.tsx` (Menu links scoped by roles)
  * `frontend/src/components/Layout/Topbar.tsx` (Header cards & branch details)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/TransferController.java` (Exposes dashboard requests mapping)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/TransferServiceImpl.java` (Executes scoping logic)
* **Database**:
  * `transfer_requests` (Fetches active workflow records)
  * `item_categories` (Resolves behavior type for list badges)

### Visual Source Mapping
* **Dashboard Screen**:
  * **Page Component**: `frontend/src/pages/Dashboard.tsx`
  * **Child Components**: Sidebar (`frontend/src/components/Layout/Sidebar.tsx`), Topbar (`frontend/src/components/Layout/Topbar.tsx`)
  * **Styling Sheets**: `frontend/src/pages/Dashboard.css`, `frontend/src/components/Layout/Layout.css`
  * **Data Source API**: `GET /api/transfers` (Dashboard Transfers), `GET /api/cash/adjust/pending` (Managers' adjustment alerts)

## APIs Used
* `GET /api/transfers` → Fetches active transfers filtered by the user's role and branch/department context.

## Common Viva Questions
* **Q: What determines which active transfers are shown on a user's dashboard?**
  * **A:** Scoping is enforced in `TransferServiceImpl.getDashboardTransfers()`. A `SYSTEM_ADMIN` sees all active transfers; `DELIVERY_PERSON` sees only transfers assigned to them; and Branch Managers/Officers are restricted to transfers where their branch is either the origin or destination. Officers are further restricted to transfers matching their specific department.

---

# 3. Transfer Request Creation

*Status: **[Fully Implemented]***

## Business Purpose
Allows branch personnel to initiate an inter-branch transfer request for cash, stock inventory, or documents, without having to choose the destination supplying branch at creation.

## User Flow
The initiator clicks "New Request". The page loads, auto-detecting the user's branch as the origin. They select a category. Choosing a CASH category displays an amount field. Choosing a STOCK category loads related stock items (SKUs) and displays quantity inputs. They choose priority, enter details, and hit Submit.

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/NewTransfer.tsx` (Form inputs, validation, and step guides)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/TransferController.java` (Exposes creation mapping)
  * `backend/src/main/java/com/jamunabank/branchsync/controller/LookupController.java` (Populates form selections)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/TransferServiceImpl.java` (Applies business rules)
* **Database**:
  * `transfer_requests` (Inserts new row)
  * `item_categories` (Resolves configuration details)
  * `stock_items` (Resolves SKU selections)

### Visual Source Mapping
* **New Transfer Request Form**:
  * **Page Component**: `frontend/src/pages/NewTransfer.tsx`
  * **Child Components**: Category selection drawer, Dynamic amount/SKU fields
  * **Styling Sheet**: `frontend/src/pages/NewTransfer.css`
  * **Data Source APIs**: `GET /api/lookup/departments`, `GET /api/lookup/categories`, `GET /api/lookup/stock-items/{categoryId}`

## APIs Used
* `GET /api/lookup/branches` → Populates branch information (read-only for non-admins).
* `GET /api/lookup/departments` → Populates target department drop-down.
* `GET /api/lookup/categories` → Fetches categories mapped to the initiator's department.
* `GET /api/lookup/stock-items/{categoryId}` → Loads active items for STOCK requests.
* `POST /api/transfers` → Submits the DTO.

## Common Viva Questions
* **Q: Why does a manager's request skip the first state (PENDING_INTERNAL)?**
  * **A:** In `TransferServiceImpl.initiateTransfer()`, the service layer checks if the creator's role matches `MANAGER_ROLES`. If true, the system skips internal approval and sets the request's status to `PENDING_HQ_APPROVAL`, saving the creator as the internal approver.
* **Q: How is the unique request code generated?**
  * **A:** In `TransferServiceImpl.initiateTransfer()`, the system counts existing rows, formats the count, and concatenates it with the current year: `REQ-YYYY-NNNN` (e.g., `REQ-2026-0045`).

---

# 4. Transfer Workflow Lifecycle

*Status: **[Fully Implemented]***

## Business Purpose
Coordinates inter-branch transfers through a multi-stage state machine that prevents out-of-order handoffs, guarantees proper approvals, and records compliance states.

## User Flow
The request advances through 8 logical states:
1. `PENDING_INTERNAL` (Origin Manager checks)
2. `PENDING_HQ_APPROVAL` (HQ reviews and assigns supply source)
3. `PENDING_ASSIGNMENT` (Destination accepts and binds driver)
4. `PENDING_FINAL_RELEASE` (Destination Manager approves)
5. `READY_FOR_PICKUP` (Driver picks up)
6. `IN_TRANSIT` (Assets in transit)
7. `DELIVERED` (Initiator inspects)
8. `COMPLETED` / `REJECTED_ON_RECEIPT` (Terminal states)

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/TransferDetails.tsx` (Main view component displaying details and actions)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/TransferController.java` (Exposes state transition endpoints)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/TransferServiceImpl.java` (Executes validations and transitions)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/AuditServiceImpl.java` (Logs action records)
* **Database**:
  * `transfer_requests` (Tracks current status)
  * `audit_logs` (Records historical log rows)

### Visual Source Mapping
* **Transfer Details Screen**:
  * **Page Component**: `frontend/src/pages/TransferDetails.tsx`
  * **Timeline Source**: Timeline stepper displaying chronological stages based on `transfer.status`.
  * **Status Badge Source**: Class selector returning style variables based on `transfer.status`.
  * **Action Panel Source**: Contextual action cards displaying buttons only if the user is authorized for the current stage.
  * **API Source**: `GET /api/transfers/{requestId}` (Fetches details, stepper, and nested audit logs)

## APIs Used
* `GET /api/transfers/{requestId}` → Renders current request details and states.
* `POST /api/transfers/{requestId}/approve-internal` (Source manager approval)
* `POST /api/transfers/{requestId}/reject-internal` (Source manager rejection)

## Common Viva Questions
* **Q: How does the system prevent out-of-order workflow execution?**
  * **A:** Enforced on both layers. The React client hides buttons for invalid stages, and `TransferServiceImpl.java` methods check that the current database status matches the required preceding state before executing updates. If a violation is detected, a `BusinessRuleViolationException` is thrown.

---

# 5. HQ Routing & Assignment

*Status: **[Fully Implemented]***

## Business Purpose
Maintains central control over inter-branch logistics. Decentralized branch creators do not determine which branch supplies their requested asset; HQ Logistics evaluates reserves and routes the supply order to the most appropriate branch.

## User Flow
HQ Logistics Officer views their dashboard queue (`PENDING_HQ_APPROVAL`). They select a request. The details panel presents dropdown lists of branches and departments. For CASH, the branch choices highlight live balances. HQ selects the supplier and clicks "Verify & Route".

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/TransferDetails.tsx` (Conditionally renders the HQ assignment selector panel)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/TransferController.java` (Exposes `/hq-verify` endpoint)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/TransferServiceImpl.java` (Executes the `hqVerify()` method)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/CashServiceImpl.java` (Supplies branch cash balances)
* **Database**:
  * `transfer_requests` (Updates `destination_branch_id`, `destination_department_id`, and `hq_approver_id` fields)
  * `branch_cash_balance` / `branch_stock_balance` (Vault levels checked during routing)

### Visual Source Mapping
* **HQ Action Panel**:
  * **Page Component**: `frontend/src/pages/TransferDetails.tsx` (Renders selector dropdowns for HQ role)
  * **Styling Sheet**: `frontend/src/pages/TransferDetails.css`
  * **Data Source APIs**: `GET /api/lookup/branches`, `GET /api/lookup/branches/{branchId}/departments`, `GET /api/cash/balances` (For vault levels warnings)

## APIs Used
* `POST /api/transfers/{requestId}/hq-verify` → Triggers routing (submits destination branch and department).

## Common Viva Questions
* **Q: Why does the system defer routing to HQ instead of letting the creator select the source branch?**
  * **A:** To prevent branch coordination issues and cash hoarding. Requisitioning branches do not know which branch has excess inventory or vault cash; HQ manages overall liquidity and makes informed routing decisions.

---

# 6. Destination Acceptance & Driver Assignment

*Status: **[Fully Implemented]***

## Business Purpose
Gives the supplying branch control over their physical inventory. They verify they have the asset, allocate specific cash denominations or physical stock, and schedule an available courier.

## User Flow
A branch officer at the supplying branch sees a routed transfer in `PENDING_ASSIGNMENT`. They open it. For CASH, they enter the cash denomination count. For STOCK, they see quantity requirements (low stock warnings appear if on-hand quantity is too low). They choose an available courier from the driver dropdown and hit "Accept & Assign".

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/TransferDetails.tsx` (Conditionally renders the acceptance sheet, denomination spreadsheet, and driver selector)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/TransferController.java` (Exposes accept endpoint)
  * `backend/src/main/java/com/jamunabank/branchsync/controller/LookupController.java` (Exposes available drivers endpoint)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/TransferServiceImpl.java` (Binds courier and advances state)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/CashServiceImpl.java` (Processes denomination counts)
* **Database**:
  * `transfer_requests` (Updates `dept_acceptor_id`, `delivery_person_id`, and status fields)
  * `cash_transfer_denominations` (Stores note counts matching transfer amount)

### Visual Source Mapping
* **Acceptance Action Panel**:
  * **Page Component**: `frontend/src/pages/TransferDetails.tsx` (Denominations count and courier selection dropdown)
  * **Styling Sheet**: `frontend/src/pages/TransferDetails.css`
  * **Data Source APIs**: `GET /api/lookup/users/delivery-persons/available` (Fetches available drivers), `POST /api/cash/denominations/{requestId}`

## APIs Used
* `GET /api/lookup/users/delivery-persons/available` → Fetches drivers with `role = DELIVERY_PERSON` and `isAvailable = true`.
* `POST /api/cash/denominations/{requestId}` → Saves cash note counts.
* `POST /api/transfers/{requestId}/accept` → Completes acceptance (submits courier selection).
* `POST /api/transfers/{requestId}/reject-destination` → Returns request to HQ queue.

## Common Viva Questions
* **Q: How does driver availability tracking work?**
  * **A:** The system checks the `isAvailable` boolean on `User.java`. Drivers are excluded from the drop-down selection when `isAvailable` is `false`. A driver's availability is set to `false` during courier pickup, and reset to `true` during delivery.

---

# 7. Final Release Workflow

*Status: **[Fully Implemented]***

## Business Purpose
Branch gatekeeping. Ensures that a branch manager at the supplying branch authorizes the physical release of the assets before a courier can carry them away.

## User Flow
The supplying branch manager views the request in `PENDING_FINAL_RELEASE`. They review the details (denominations, stock items, driver) and click "Approve & Release".

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/TransferDetails.tsx` (Renders supplying branch manager action panel)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/TransferController.java` (Exposes release endpoint)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/TransferServiceImpl.java` (Executes the `releaseFinal()` method)
* **Database**:
  * `transfer_requests` (Updates `final_releaser_id` and sets status to `READY_FOR_PICKUP`)

### Visual Source Mapping
* **Final Release Panel**:
  * **Page Component**: `frontend/src/pages/TransferDetails.tsx` (Conditionally renders for supplying branch manager role)
  * **Data Source API**: `POST /api/transfers/{requestId}/release`

## APIs Used
* `POST /api/transfers/{requestId}/release` → Triggers final release.
* `POST /api/transfers/{requestId}/reject-release` → Rejects and routes back to HQ.

## Common Viva Questions
* **Q: Can an officer perform the final release step?**
  * **A:** No. The service layer strictly validates that the actor's role is in the `MANAGER_ROLES` set and that they belong to the supplying destination branch. If this check fails, it throws an `UnauthorizedRoleException` (returning a 403 status).

---

# 8. Courier Pickup & Delivery

*Status: **[Fully Implemented]***

## Business Purpose
Tracks the physical movement of assets. Locks driver availability while in transit, and executes automated balance and ledger updates at pickup and delivery.

## User Flow
The assigned driver logs in and views their dashboard queue (`READY_FOR_PICKUP`). They click "Confirm Pickup" upon collecting the asset. Status changes to `IN_TRANSIT` (locking the driver's availability). Upon arrival, the driver clicks "Confirm Delivery". Status changes to `DELIVERED` (restoring the driver's availability).

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/TransferDetails.tsx` (Conditionally renders driver pickup and delivery actions)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/TransferController.java` (Exposes pickup and deliver endpoints)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/TransferServiceImpl.java` (Triggers status changes and ledger actions)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/CashServiceImpl.java` (Performs cash ledger updates)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/StockServiceImpl.java` (Performs stock ledger updates)
* **Database**:
  * `transfer_requests` (Updates `picked_up_at` and `delivered_at` timestamps)
  * `users` (Updates courier `is_available` flag)
  * `branch_cash_balance` / `branch_stock_balance` (Modifies supplying and receiving branch balances)
  * `cash_ledger` / `stock_ledger` (Inserts `TRANSFER_OUT` at pickup and `TRANSFER_IN` at delivery)

### Visual Source Mapping
* **Courier Actions Box**:
  * **Page Component**: `frontend/src/pages/TransferDetails.tsx` (Renders for assigned courier role)
  * **Styling Sheet**: `frontend/src/pages/TransferDetails.css`
  * **Data Source APIs**: `POST /api/transfers/{requestId}/pickup`, `POST /api/transfers/{requestId}/deliver`

## APIs Used
* `POST /api/transfers/{requestId}/pickup` → Processes pickup (debits supplier balances, logs `TRANSFER_OUT` in ledger, locks driver).
* `POST /api/transfers/{requestId}/deliver` → Processes delivery (credits receiver balances, logs `TRANSFER_IN` in ledger, releases driver).

## Common Viva Questions
* **Q: Why are vault and stock balances debited on pickup, rather than on delivery?**
  * **A:** To prevent double-spending and stock out-of-sync issues. Once assets leave the supplying branch, they must be removed from that vault's balances. While in transit, they are not available at either branch, and are credited to the receiving branch only upon delivery.

---

# 9. Request Completion & Rejection

*Status: **[Fully Implemented]***

## Business Purpose
Establishes recipient verification and fallback workflows. The creator must confirm they received the assets in correct order, or reject them (triggering a reversal of ledger updates).

## User Flow
The original request initiator views the request in `DELIVERED`. They select "Accept & Close" or "Reject & Revert". If they reject, they must enter a mandatory rejection reason. The request becomes `COMPLETED` or `REJECTED_ON_RECEIPT`.

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/TransferDetails.tsx` (Conditionally renders recipient actions)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/TransferController.java` (Exposes close endpoint)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/TransferServiceImpl.java` (Processes `closeRequest()` and initiates reversals)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/CashServiceImpl.java` (Applies cash reversals math)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/StockServiceImpl.java` (Applies stock reversals math)
* **Database**:
  * `transfer_requests` (Updates status to `COMPLETED` or `REJECTED_ON_RECEIPT`, sets `closed_at` and `final_note`)
  * `branch_cash_balance` / `branch_stock_balance` (Reverses balances if rejected)
  * `cash_ledger` / `stock_ledger` (Appends `REVERSAL_OUT` for origin branch and `REVERSAL_IN` for destination branch)

### Visual Source Mapping
* **Verification Form Box**:
  * **Page Component**: `frontend/src/pages/TransferDetails.tsx` (Renders for request initiator)
  * **Data Source API**: `POST /api/transfers/{requestId}/close` (Submits `accepted` decision and `finalNote`)

## APIs Used
* `POST /api/transfers/{requestId}/close` → Submits verification (payload DTO contains `accepted` flag and `finalNote` text).

## Common Viva Questions
* **Q: What happens if a recipient rejects a cash transfer upon arrival?**
  * **A:** The system marks the request as `REJECTED_ON_RECEIPT` and immediately triggers ledger reversals. The receiving branch is debited, the supplying branch is credited, and `REVERSAL_IN` / `REVERSAL_OUT` transactions are logged to maintain audit records.

---

# 10. Cash Vault Module

*Status: **[Fully Implemented]***

## Business Purpose
Maintains live, real-time balances in local currencies (৳) for each bank branch, providing cash vault tracking for all locations.

## User Flow
Branch Managers and System Admins access `/cash/ledger`. Admins see a consolidated overview of balances across all branch vaults, while managers view their local branch reserves.

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/CashLedger.tsx` (Consolidated balances grid and local hero cards)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/CashController.java` (Exposes balance mappings)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/CashServiceImpl.java` (Processes balance lookups)
* **Database**:
  * `branch_cash_balance` (Tracks live cash vault levels)

### Visual Source Mapping
* **Cash Vault Balances View**:
  * **Page Component**: `frontend/src/pages/CashLedger.tsx`
  * **Child Components**: Consolidated Branch Cards Grid (Admin view), Local Branch Vault Card
  * **Styling Sheet**: `frontend/src/pages/CashLedger.css`
  * **Data Source APIs**: `GET /api/cash/balances` (Admin overview), `GET /api/cash/balance/{branchId}` (Local view)

## APIs Used
* `GET /api/cash/balances` → Returns balances for all branch vaults (Admin view).
* `GET /api/cash/balance/{branchId}` → Returns balance for a single branch.

## Common Viva Questions
* **Q: How does the system ensure the vault balance is never modified directly?**
  * **A:** The `branch_cash_balance` table is updated only through transactional operations (courier pickup/delivery, manual adjustments, or receipt rejections) handled via service layer processes.

---

# 11. Cash Denomination Handling

*Status: **[Fully Implemented]***

## Business Purpose
Ensures physical vault counts match the digital ledger. Supplying branches must break down cash transfers by exact note quantities, verifying counts before the assets leave the vault.

## User Flow
At the `PENDING_ASSIGNMENT` stage, the destination officer inputs the note count breakdown (e.g., ৳1000 × 5, ৳500 × 10). The system validates that the calculated sum matches the requested transfer amount.

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/TransferDetails.tsx` (Conditionally renders the denomination breakdown form)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/CashController.java` (Exposes denomination endpoints)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/CashServiceImpl.java` (Validates and saves denomination lists)
* **Database**:
  * `cash_transfer_denominations` (Stores quantity breakdown of notes for ৳1 to ৳1000)

### Visual Source Mapping
* **Note Denomination Spreadsheet Grid**:
  * **Page Component**: `frontend/src/pages/TransferDetails.tsx` (Renders denomination input rows and sub-totals)
  * **Data Source APIs**: `POST /api/cash/denominations/{requestId}` (Saves data), `GET /api/cash/denominations/{requestId}` (Fetches details)

## APIs Used
* `POST /api/cash/denominations/{requestId}` → Saves note counts.
* `GET /api/cash/denominations/{requestId}` → Fetches note counts for read-only displays.

## Common Viva Questions
* **Q: What happens if the sum of note values does not match the requested amount?**
  * **A:** In `CashServiceImpl.submitDenominations()`, the service layer validates that the sum matches the requested transfer amount. If the amounts do not match, it throws a validation error, blocking the user from proceeding with driver assignment.

---

# 12. Cash Adjustments

*Status: **[Fully Implemented]***

## Business Purpose
Provides a secure, dual-custody audit pathway to manually adjust branch vault balances for audits, cash imports, or sorting corrections.

## User Flow
An officer in the Cash Operations department submits an adjustment request (Credit or Debit, amount, and justification). The request is logged as `PENDING`. The branch manager views the request on their dashboard, reviews the justification, and approves or rejects it.

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/ManualAdjustment.tsx` (Form inputs for Officers, approval lists for Managers)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/CashController.java` (Exposes adjustment mappings)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/CashServiceImpl.java` (Processes `submitAdjustment()` and `approveAdjustment()`)
* **Database**:
  * `cash_manual_adjustments` (Tracks pending and resolved adjustments)
  * `branch_cash_balance` (Updated on approval)
  * `cash_ledger` (Appends `MANUAL_CREDIT` or `MANUAL_DEBIT` entries)

### Visual Source Mapping
* **Manual Cash Adjustments Workspace**:
  * **Page Component**: `frontend/src/pages/ManualAdjustment.tsx`
  * **Child Components**: Submission Form, Pending Cards Feed (Manager view), Adjustment Logs Table
  * **Styling Sheet**: `frontend/src/pages/ManualAdjustment.css`
  * **Data Source APIs**: `POST /api/cash/adjust` (Submit request), `POST /api/cash/adjust/{adjustmentId}/decide` (Approve/Reject request), `GET /api/cash/adjust/pending` (Dashboard widgets details)

## APIs Used
* `POST /api/cash/adjust` → Submits a new adjustment request.
* `POST /api/cash/adjust/{id}/decide` → Approves or rejects a pending adjustment.
* `GET /api/cash/adjust/pending` → Fetches pending adjustments for the manager's branch.
* `GET /api/cash/adjust/all` → Fetches adjustment history.

## Common Viva Questions
* **Q: How does the system prevent managers from approving arbitrary cash adjustments that exceed reserves?**
  * **A:** The system validates debit adjustments on the backend. In `decideAdjustment()`, a debit adjustment is checked against the branch's live vault balance. If the adjustment would cause an overdraft, the system blocks approval and throws a `BusinessRuleViolationException`.

---

# 13. Cash Ledger

*Status: **[Fully Implemented]***

## Business Purpose
Maintains an immutable, chronological, append-only transaction ledger for branch vault movements.

## User Flow
Managers or Admins open `/cash/ledger` to inspect every single cash deposit, withdrawal, transfer, or adjustment that took place.

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/CashLedger.tsx` (Transaction tables and local branch panels)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/CashController.java` (Exposes ledger endpoints)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/CashServiceImpl.java` (Fetches ledger logs)
* **Database**:
  * `cash_ledger` (Immutable transaction log table)

### Visual Source Mapping
* **Ledger View Screen**:
  * **Page Component**: `frontend/src/pages/CashLedger.tsx`
  * **Child Components**: Printable table, ledger row highlight cards
  * **Styling Sheet**: `frontend/src/pages/CashLedger.css`
  * **Data Source API**: `GET /api/cash/ledger/{branchId}`

## APIs Used
* `GET /api/cash/ledger/{branchId}` → Fetches vault transactions history.

## Common Viva Questions
* **Q: Can a ledger entry be deleted or edited if an error is made?**
  * **A:** No. The `cash_ledger` table is strictly append-only. Corrective actions are handled by submitting a new manual adjustment, ensuring a clear and complete audit trail.

---

# 14. Stock Inventory Module

*Status: **[Fully Implemented]***

## Business Purpose
Tracks physical, countable asset inventories (e.g. computers, network routers, office furniture) across multiple branches.

## User Flow
Authorized personnel access the stock dashboards to review current item quantities across all branch vaults.

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/StockLedger.tsx` (Pills panel and branch summaries)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/StockController.java` (Exposes inventory endpoints)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/StockServiceImpl.java` (Fetches balances)
* **Database**:
  * `branch_stock_balance` (Tracks live inventory levels per branch per SKU)

### Visual Source Mapping
* **Stock Inventory View**:
  * **Page Component**: `frontend/src/pages/StockLedger.tsx`
  * **Child Components**: Branch Summaries Cards (HQ view), Balances Chips Panel, Quantity cards
  * **Styling Sheet**: `frontend/src/pages/StockLedger.css`
  * **Data Source APIs**: `GET /api/stock/balances` (Admin overview), `GET /api/stock/balances/{branchId}` (Branch inventory levels)

## APIs Used
* `GET /api/stock/balances` → Returns stock balances across all locations.
* `GET /api/stock/balances/{branchId}` → Returns stock balances for a single branch.

## Common Viva Questions
* **Q: How does the stock inventory system differentiate between item types?**
  * **A:** The system uses the `ItemCategory` entity’s `behaviorType` configuration. Items under categories set to `STOCK` are routed through the stock inventory system, managing countable quantities at the branch level.

---

# 15. Stock Item Management

*Status: **[Fully Implemented]***

## Business Purpose
System catalog management. Allows administrators to define and manage individual stock items (SKUs) nested under STOCK categories.

## User Flow
The System Admin opens `/admin/items`, selects a category with STOCK behavior, and opens the stock items panel to add, edit, or toggle the active status of items (SKUs).

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/admin/ItemManagement.tsx` (Category grid and stock items drawer)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/OrgManagementController.java` (Exposes CRUD endpoints)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/ManagementServiceImpl.java` (Executes database modifications)
* **Database**:
  * `stock_items` (Stores name, unit, and active status per SKU)

### Visual Source Mapping
* **Stock Catalog Admin Portal**:
  * **Page Component**: `frontend/src/pages/admin/ItemManagement.tsx`
  * **Child Components**: Stock Items List sliding drawer, SKU entry form
  * **Data Source APIs**: `GET /api/admin/org/items/{categoryId}/stock-items` (Fetches SKUs), `POST /api/admin/org/items/{categoryId}/stock-items` (Adds new SKU), `PUT /api/admin/org/stock-items/{stockItemId}/toggle-active` (Toggles item status)

## APIs Used
* `GET /api/admin/org/items/{categoryId}/stock-items` → Fetches SKUs for a category.
* `POST /api/admin/org/items/{categoryId}/stock-items` → Adds a new SKU.
* `PUT /api/admin/org/stock-items/{stockItemId}` → Edits a SKU's details.
* `PUT /api/admin/org/stock-items/{stockItemId}/toggle-active` → Toggles item active status.

## Common Viva Questions
* **Q: What happens if a stock item is deactivated?**
  * **A:** Setting `is_active = false` excludes the item from new transfer dropdown lists and adjustments, while preserving history and existing ledger logs.

---

# 16. Stock Adjustments

*Status: **[Fully Implemented]***

## Business Purpose
Maintains inventory accuracy. Allows officers to submit quantity adjustments (Credit/Debit) for items within their department, subject to manager approval.

## User Flow
An officer submits an adjustment request (amount, item SKU, and reason). The request is logged as `PENDING`. The branch manager reviews the request and approves or rejects it.

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/StockAdjustment.tsx` (Officer submission form, Manager approval queue)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/StockController.java` (Exposes adjustment endpoints)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/StockServiceImpl.java` (Processes `submitAdjustment()` and `approveAdjustment()`)
* **Database**:
  * `stock_manual_adjustments` (Tracks pending and resolved adjustments)
  * `branch_stock_balance` (Updated on approval)
  * `stock_ledger` (Appends `MANUAL_CREDIT` or `MANUAL_DEBIT` entries)

### Visual Source Mapping
* **Stock Adjustments Workspace**:
  * **Page Component**: `frontend/src/pages/StockAdjustment.tsx`
  * **Child Components**: Submission Form, Pending approvals list, Adjustment logs
  * **Styling Sheet**: `frontend/src/pages/StockAdjustment.css`
  * **Data Source APIs**: `POST /api/stock/adjust` (Submit request), `POST /api/stock/adjust/{adjustmentId}/decide` (Approve/Reject request), `GET /api/stock/adjust/pending` (Pending approvals feed)

## APIs Used
* `POST /api/stock/adjust` → Submits a new adjustment request.
* `POST /api/stock/adjust/{id}/decide` → Approves or rejects an adjustment request.
* `GET /api/stock/adjust/pending` → Fetches pending adjustments for the manager's branch.
* `GET /api/stock/adjust/all` → Fetches adjustment history.

## Common Viva Questions
* **Q: Are stock adjustments scoped by department?**
  * **A:** Yes. Officers can submit adjustments only for categories mapped to their specific department, ensuring appropriate access controls.

---

# 17. Stock Ledger

*Status: **[Fully Implemented]***

## Business Purpose
Maintains an immutable, chronological, append-only transaction ledger for branch stock movements.

## User Flow
Managers, Officers, and Admins open `/stock/ledger` to inspect every single stock movement, deposit, withdrawal, or adjustment.

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/StockLedger.tsx` (Balances panel and transaction tables)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/StockController.java` (Exposes ledger endpoints)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/StockServiceImpl.java` (Fetches ledger logs)
* **Database**:
  * `stock_ledger` (Immutable transactional history table)

### Visual Source Mapping
* **Stock Ledger View**:
  * **Page Component**: `frontend/src/pages/StockLedger.tsx`
  * **Child Components**: SKU selector pills panel, Ledger logs printable table
  * **Styling Sheet**: `frontend/src/pages/StockLedger.css`
  * **Data Source API**: `GET /api/stock/ledger/{branchId}/{stockItemId}`

## APIs Used
* `GET /api/stock/ledger/{branchId}/{stockItemId}` → Fetches stock ledger logs.

## Common Viva Questions
* **Q: What details are captured in a stock ledger entry?**
  * **A:** Each entry records the branch, stock item, transaction type (`TRANSFER_OUT`, `TRANSFER_IN`, `MANUAL_ADJUSTMENT`, `REVERSAL`), quantity, actor, timestamp, and a reference to the related transfer request or adjustment.

---

# 18. Audit Logging

*Status: **[Fully Implemented]***

## Business Purpose
Maintains an immutable audit trail for compliance purposes. Records every action, status transition, actor, IP address, and comment on every transfer request.

## User Flow
Admins and managers view audit logs on the transfer details screen, tracking the progress and history of each request.

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/TransferDetails.tsx` (Displays chronological history stepper)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/TransferController.java` (Resolves logs in detail mapping)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/AuditServiceImpl.java` (Implements `logAction()` to write audit entries)
* **Database**:
  * `audit_logs` (Stores actor, actions, IP addresses, statuses, and notes)

### Visual Source Mapping
* **Transfer Audit Stepper**:
  * **Page Component**: `frontend/src/pages/TransferDetails.tsx`
  * **Child Components**: Chronological Stepper component, Complete logs table (visible to System Admins only)
  * **Data Source API**: `GET /api/transfers/{requestId}` (Returns audit logs inside detail response payload)

## Common Viva Questions
* **Q: How does the system protect audit logs from modification?**
  * **A:** The `AuditLog` JPA entity is not exposed to update or delete endpoints in the controller layer. The table is append-only, and logs can only be created as a side effect of workflow actions.

---

# 19. Branch Management

*Status: **[Fully Implemented]***

## Business Purpose
Organizational structure management. Allows administrators to manage branch details and map department relationships.

## User Flow
Admins open `/admin/branches` to add branches, edit details, map department associations, or toggle active status.

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/admin/BranchManagement.tsx` (Branches workspace form)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/OrgManagementController.java` (Exposes branch endpoints)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/ManagementServiceImpl.java` (Handles updates)
* **Database**:
  * `branches` (Stores branch code, type, and details)
  * `branch_departments` (Join table mapping departments to branches)

## APIs Used
* `GET /api/admin/org/branches` → Fetches all branches.
* `POST /api/admin/org/branches` → Creates a new branch.
* `PUT /api/admin/org/branches/{id}` → Updates branch details.

## Common Viva Questions
* **Q: What is the purpose of the branch_departments join table?**
  * **A:** It manages the many-to-many relationship between global departments and branches, determining which departments are active at each branch location.

---

# 20. Department Management

*Status: **[Fully Implemented]***

## Business Purpose
Organizational structure management. Allows administrators to define global departments and map them to branches.

## User Flow
Admins open `/admin/departments` to create departments and configure branch mappings.

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/admin/DepartmentManagement.tsx` (Departments workspace form)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/OrgManagementController.java` (Exposes department endpoints)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/ManagementServiceImpl.java` (Handles updates)
* **Database**:
  * `departments` (Stores department names and properties)
  * `branch_departments` (Join table mapping departments to branches)

## APIs Used
* `GET /api/admin/org/departments` → Fetches all departments.
* `POST /api/admin/org/departments` → Creates a new department.
* `PUT /api/admin/org/departments/{id}` → Updates department details.

---

# 21. User Management

*Status: **[Fully Implemented]***

## Business Purpose
Administrative security and access control. Allows administrators to manage user accounts, assign roles, and map users to branches and departments.

## User Flow
Admins open `/admin/users` to create user accounts, assign roles, edit details, or toggle active status.

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/admin/UserManagement.tsx` (User workspace table)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/UserManagementController.java` (Exposes user CRUD)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/ManagementServiceImpl.java` (Handles passwords and profiles updates)
* **Database**:
  * `users` (Stores employee accounts, roles, and statuses)

### Visual Source Mapping
* **User Management View**:
  * **Page Component**: `frontend/src/pages/admin/UserManagement.tsx`
  * **Child Components**: User details drawer, Account Edit forms, custom error overlay alert banner
  * **Styling Sheet**: `frontend/src/pages/admin/Admin.css`
  * **Data Source APIs**: `GET /api/admin/users`, `POST /api/admin/users`, `PUT /api/admin/users/{userId}`, `PUT /api/admin/users/{userId}/toggle-active`

## Common Viva Questions
* **Q: What happens to a deactivated user?**
  * **A:** Their `is_active` status is set to `false`, immediately blocking them from logging in, while preserving their historical audit logs and ledger records.

---

# 22. Item Category Management

*Status: **[Fully Implemented]***

## Business Purpose
Assets catalog management. Allows administrators to manage item categories, configure behavior types, and map department ownerships.

## User Flow
Admins open `/admin/items` to create categories, configure behavior types (CASH/STOCK/DOCUMENT_CASE), assign department mappings, and manage sensitivity levels.

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/admin/ItemManagement.tsx` (Item management panel)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/OrgManagementController.java` (Exposes categories CRUD)
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/ManagementServiceImpl.java` (Handles database updates)
* **Database**:
  * `item_categories` (Stores behavior configuration, sensitivity level, and department mapping)

## APIs Used
* `GET /api/admin/org/items` → Fetches item categories.
* `POST /api/admin/org/items` → Creates a new category.
* `PUT /api/admin/org/items/{categoryId}` → Updates item category details.
* `PUT /api/admin/org/items/{categoryId}/toggle-active` → Toggles category active status.

---

# 23. Stock Category Behavior System

*Status: **[Fully Implemented]***

## Business Purpose
Decouples catalog items from hard-coded workflow logic. The category behavior type dynamically triggers ledger updates, denomination checks, or stock selectors.

## User Flow
Choosing a category on the New Request form dynamically adjusts the layout (revealing cash fields for CASH, stock fields for STOCK, or standard fields for DOCUMENT_CASE).

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/NewTransfer.tsx` (Conditionally shows/hides amount/SKU fields)
  * `frontend/src/pages/TransferDetails.tsx` (Toggles denominations grid and stock level alerts)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/service/impl/TransferServiceImpl.java` (Executes behavior-based validations)
* **Backend Enums**:
  * `backend/src/main/java/com/jamunabank/branchsync/model/enums/CategoryBehavior.java` (Enum declaration: `CASH`, `STOCK`, `DOCUMENT_CASE`)
* **Database**:
  * `item_categories` (Columns: `behavior_type` storing enum string values)

## Common Viva Questions
* **Q: What are the three behavior types and what do they trigger?**
  * **A:** 
    * `CASH`: Enables cash amount inputs, denomination spreadsheets, vault updates, and cash ledger records.
    * `STOCK`: Enables SKU selection, quantity inputs, branch inventory updates, and stock ledger records.
    * `DOCUMENT_CASE`: Standard workflow tracking only; bypasses ledger and balance updates.

---

# 24. Branch Directory

*Status: **[Fully Implemented]***

## Business Purpose
Facilitates internal communication. Allows managers to look up contact details and active departments for other branches.

## User Flow
A manager opens `/branch-directory` and searches for branches by name or region to view contact info and active departments.

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/BranchDirectory.tsx` (Contact list and search filters)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/UserController.java` (Exposes `/branch-directory` endpoint)
* **Database**:
  * `branches` (Resolves contact details, district, and division)
  * `departments` (Resolves active department names)

## APIs Used
* `GET /api/users/branch-directory` → Returns details for active branches and departments.

---

# 25. Reports / Print Features

*Status: **[Fully Implemented]***

## Business Purpose
Generates physical documents and printable worksheets for audits and transfer verifications.

## User Flow
Users click "Print Slip" on a transfer details screen or "Print Ledger" on a ledger dashboard to generate a clean, print-formatted page.

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/TransferDetails.tsx` (Printable transfer slip template)
  * `frontend/src/pages/CashLedger.tsx` (Printable cash ledger template)
  * `frontend/src/pages/StockLedger.tsx` (Printable stock ledger template)
  * `frontend/src/pages/TransferHistory.tsx` (Printable history listing template)

## Common Viva Questions
* **Q: Did you use a PDF generator on the backend?**
  * **A:** No. The system uses CSS print media queries (`@media print`) and native browser window scripting. This approach generates print-optimized documents directly in the browser client without putting load on the backend.

---

# 26. Role-Based Access Control

*Status: **[Fully Implemented]***

## Business Purpose
Ensures security and operational segregation of duties, restricting actions to authorized roles.

## User Flow
The user's role determines which sidebar links and action buttons are visible in the UI. Unauthorized requests are blocked on the backend.

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/components/Layout/Sidebar.tsx` (Hides/shows menu links based on role checks)
  * `frontend/src/pages/TransferDetails.tsx` (Restricts action panels visibility)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/exception/UnauthorizedRoleException.java` (Exception class thrown on violation)
  * Service implementations (Enforce role checks on transitions)
* **Database**:
  * `roles` (System role names)

## Common Viva Questions
* **Q: Is RBAC enforced only on the frontend?**
  * **A:** No. Frontend visibility controls are for user experience. The backend strictly enforces authorization at the service layer, validating user roles against allowed roles for each transition and throwing `UnauthorizedRoleException` if unauthorized.

---

# 27. Notification / Attention Required Widgets

*Status: **[Fully Implemented]***

## Business Purpose
Highlights outstanding actions for the user, preventing workflow bottlenecks.

## User Flow
On logging in, users review the "Attention Required" widget on their dashboard to see outstanding tasks.

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/Dashboard.tsx` (Attention required widget component)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/repository/TransferRequestRepository.java` (Pulls active requests matching action states)
  * `backend/src/main/java/com/jamunabank/branchsync/repository/CashManualAdjustmentRepository.java` (Pulls pending cash adjustments)
* **Database**:
  * `transfer_requests` / `cash_manual_adjustments` (Sources for pending action counts)

---

# 28. Lookup APIs

*Status: **[Fully Implemented]***

## Business Purpose
Provides public, read-only reference data to populate dropdown selectors throughout the application.

## User Flow
Form dropdown lists are dynamically populated using lookup endpoints.

### Feature Dependency Map
* **Frontend**:
  * `frontend/src/pages/NewTransfer.tsx` (Fetches lookup selections)
  * `frontend/src/pages/TransferDetails.tsx` (Fetches lookup selections)
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/controller/LookupController.java` (Exposes lookup endpoints)
* **Database**:
  * `branches` / `departments` / `item_categories` / `users` / `stock_items` (Read lookup data)

## APIs Used
* `GET /api/lookup/branches`
* `GET /api/lookup/departments`
* `GET /api/lookup/categories`
* `GET /api/lookup/stock-items/{categoryId}`
* `GET /api/lookup/users/delivery-persons/available`

---

# 29. Database Architecture

*Status: **[Fully Implemented]***

## Business Purpose
Maintains a clean, normalized relational database to organize user profiles, branch assets, and workflow history.

### Feature Dependency Map
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/model/entity/...` (JPA mappings)
* **SQL Seeds**:
  * `backend/src/main/resources/branchsync.sql` (Creates schema and inserts seed data)

## Database Tables
The system manages 15 operational tables:
* Core: `users`, `roles`, `branches`, `departments`, `branch_departments`, `item_categories`, `transfer_requests`, `audit_logs`.
* Cash: `branch_cash_balance`, `cash_ledger`, `cash_transfer_denominations`, `cash_manual_adjustments`.
* Stock: `stock_items`, `branch_stock_balance`, `stock_ledger`, `stock_manual_adjustments`.

---

# 30. Security Configuration

*Status: **[Fully Implemented]***

## Business Purpose
Hardens the Spring Boot API, manages request authentication, enables CORS, and validates passwords.

### Feature Dependency Map
* **Backend**:
  * `backend/src/main/java/com/jamunabank/branchsync/security/SecurityConfig.java` (Configures filter chain)
  * `backend/src/main/java/com/jamunabank/branchsync/security/Sha256PasswordEncoder.java` (Validates password hashes)

## Common Viva Questions
* **Q: Why does the system configure CORS?**
  * **A:** CORS configuration allows the frontend client (running on port `5173`) to make API requests to the backend server (running on port `8080`) securely.

---

## Complete Sorting, Filtering, and Search Traceability

Use this traceability table to explain how search, sorting, filtering, and pagination are executed on different screens:

| Visual Screen | Supported Operation | Execution Layer | Frontend File | Backend Endpoint | Repository / Service Layer Responsible |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dashboard Screen** | Active Queue Filter | Client-Side JS | `frontend/src/pages/Dashboard.tsx` | `GET /api/transfers` | `TransferServiceImpl.getDashboardTransfers()` pulls security-scoped list. Client-side JS runs `isActionable()` checks to build the "Attention Required" widget. |
| **Transfer History Screen** | Multi-Parameter Search, Status/Priority/Branch/Dates Filtering, sorting, and user-action scope | Client-Side JS (Dynamic derived list) | `frontend/src/pages/TransferHistory.tsx` | `GET /api/transfers/history` | `TransferServiceImpl.getTransferHistory()` returns all historical records. Frontend dynamic list `.filter()` evaluates search parameters and `.sort()` matches sort order selections. |
| **Cash Ledger Screen** | Branch Vault Selector & consolidated overview | Database & Controller Layer | `frontend/src/pages/CashLedger.tsx` | `GET /api/cash/balances` (consolidated) & `GET /api/cash/ledger/{branchId}` (detailed history) | `CashServiceImpl.getLedger()` retrieves chronological ledger transactions. Branch selection is restricted to managers. Admins can select any branch. |
| **Stock Ledger Screen** | Item SKU pills, Branch Selector, search, and department filters | Client-Side JS & Controller Layer | `frontend/src/pages/StockLedger.tsx` | `GET /api/stock/balances/{branchId}` & `GET /api/stock/ledger/{branchId}/{stockItemId}` | `StockServiceImpl.getLedger()` loads data. Frontend client filters lists by search terms, manages selected department dropdowns, and loads item-specific stock ledgers. |
| **User Management Screen** | Search & filters (role, branch, active status) | Client-Side JS | `frontend/src/pages/admin/UserManagement.tsx` | `GET /api/admin/users` | `ManagementServiceImpl.getAllUsers()` fetches records. Frontend processes search terms and active flags client-side. |
| **Branch Management Screen** | Search branches by code or name | Client-Side JS | `frontend/src/pages/admin/BranchManagement.tsx` | `GET /api/admin/org/branches` | `ManagementServiceImpl.getAllBranches()` fetches records. Frontend processes search matches client-side. |
| **Department Management Screen** | Listing & branch mapping | Controller Layer | `frontend/src/pages/admin/DepartmentManagement.tsx` | `GET /api/admin/org/departments` | `ManagementServiceImpl.getAllDepartments()` fetches master list database rows. |
| **Item Category Management Screen** | Listing & active toggles | Controller Layer | `frontend/src/pages/admin/ItemManagement.tsx` | `GET /api/admin/org/items` | `ManagementServiceImpl.getAllItemCategories()` loads master list category rows. |

---

## Complete Database Impact Maps

Use this section to trace exactly how the database changes on a specific action:

### 1. Request Creation
* **Inserted**: Row in `transfer_requests` table (stores creator context, requested amounts or SKU mapping, codes, and timestamps).
* **Inserted**: Row in `audit_logs` table (action = `CREATED`, fromStatus = `null`, toStatus = `PENDING_INTERNAL` [or `PENDING_HQ_APPROVAL` for managers]).
* **Modified**: None.

### 2. Internal Approval
* **Inserted**: Row in `audit_logs` table (action = `APPROVED_INTERNAL`, fromStatus = `PENDING_INTERNAL`, toStatus = `PENDING_HQ_APPROVAL`).
* **Modified**: `transfer_requests` table (updates `status` to `PENDING_HQ_APPROVAL` and `internal_approver_id` column).

### 3. HQ Routing (`hqVerify` - Approved)
* **Inserted**: Row in `audit_logs` table (action = `HQ_APPROVED`, fromStatus = `PENDING_HQ_APPROVAL`, toStatus = `PENDING_ASSIGNMENT`).
* **Modified**: `transfer_requests` table (updates `status` to `PENDING_ASSIGNMENT`, `hq_approver_id`, `hq_approved_at`, `destination_branch_id`, and `destination_department_id`).

### 4. Destination Acceptance (`acceptAndAssignDriver`)
* **Inserted**: Row in `cash_transfer_denominations` table (if `CASH` request: inserts quantity count of selected notes).
* **Inserted**: Row in `audit_logs` table (action = `ASSIGNED_DRIVER`, fromStatus = `PENDING_ASSIGNMENT`, toStatus = `PENDING_FINAL_RELEASE`).
* **Modified**: `transfer_requests` table (updates `status` to `PENDING_FINAL_RELEASE`, `dept_acceptor_id`, and `delivery_person_id`).

### 5. Final Release (`releaseFinal`)
* **Inserted**: Row in `audit_logs` table (action = `RELEASED`, fromStatus = `PENDING_FINAL_RELEASE`, toStatus = `READY_FOR_PICKUP`).
* **Modified**: `transfer_requests` table (updates `status` to `READY_FOR_PICKUP` and `final_releaser_id`).

### 6. Courier Pickup (`markPickedUp`)
* **Inserted**: Row in `audit_logs` table (action = `PICKED_UP`, fromStatus = `READY_FOR_PICKUP`, toStatus = `IN_TRANSIT`).
* **Inserted**: Ledger entry row in `cash_ledger` or `stock_ledger` tables (action = `TRANSFER_OUT` for supplying branch).
* **Modified**: `transfer_requests` table (updates `status` to `IN_TRANSIT` and `picked_up_at` timestamp).
* **Modified**: `users` table (updates assigned courier `is_available` flag to `false`).
* **Modified**: `branch_cash_balance` or `branch_stock_balance` tables (debits supplying branch vault cash or SKU balance).

### 7. Courier Delivery (`markDelivered`)
* **Inserted**: Row in `audit_logs` table (action = `DELIVERED`, fromStatus = `IN_TRANSIT`, toStatus = `DELIVERED`).
* **Inserted**: Ledger entry row in `cash_ledger` or `stock_ledger` tables (action = `TRANSFER_IN` for receiving branch).
* **Modified**: `transfer_requests` table (updates `status` to `DELIVERED` and `delivered_at` timestamp).
* **Modified**: `users` table (updates courier `is_available` flag to `true`).
* **Modified**: `branch_cash_balance` or `branch_stock_balance` tables (credits receiving branch vault cash or SKU balance).

### 8. Request Completion (`closeRequest` - Accepted)
* **Inserted**: Row in `audit_logs` table (action = `COMPLETED`, fromStatus = `DELIVERED`, toStatus = `COMPLETED`).
* **Modified**: `transfer_requests` table (updates `status` to `COMPLETED`, `closed_at` timestamp, and `final_note`).

### 9. Request Rejection (`closeRequest` - Rejected)
* **Inserted**: Row in `audit_logs` table (action = `REJECTED`, fromStatus = `DELIVERED`, toStatus = `REJECTED_ON_RECEIPT`).
* **Inserted**: Two ledger entries in `cash_ledger` or `stock_ledger` tables (`REVERSAL_OUT` debits receiving branch; `REVERSAL_IN` credits supplying branch).
* **Modified**: `transfer_requests` table (updates `status` to `REJECTED_ON_RECEIPT`, `closed_at` timestamp, and `final_note`).
* **Modified**: `branch_cash_balance` or `branch_stock_balance` tables (restores balances: debits receiving branch, credits supplying branch).

### 10. Cash Adjustment Approval (`approveAdjustment` - Approved)
* **Inserted**: Row in `cash_ledger` table (action = `MANUAL_CREDIT` or `MANUAL_DEBIT`).
* **Modified**: `cash_manual_adjustments` table (updates `status` to `APPROVED`, `approved_by` and `decided_at`).
* **Modified**: `branch_cash_balance` table (adjusts branch vault cash up or down).

### 11. Stock Adjustment Approval (`approveAdjustment` - Approved)
* **Inserted**: Row in `stock_ledger` table (action = `MANUAL_CREDIT` or `MANUAL_DEBIT`).
* **Modified**: `stock_manual_adjustments` table (updates `status` to `APPROVED`, `approved_by` and `decided_at`).
* **Modified**: `branch_stock_balance` table (adjusts item SKU balance up or down).

---

## Complete Project File Map

Use this directory map to identify file responsibilities:

### Frontend Components Map (`frontend/src/`)

* `frontend/src/pages/Login.tsx`
  * *Responsibility*: Renders the Login page, manages input state, toggles password visibility, and triggers authentication requests.
* `frontend/src/pages/Dashboard.tsx`
  * *Responsibility*: Renders the landing page containing welcome cards, pending action widgets, and active transfers.
* `frontend/src/pages/NewTransfer.tsx`
  * *Responsibility*: Form to create a new inter-branch transfer request, adapting layouts based on selected behaviors.
* `frontend/src/pages/TransferDetails.tsx`
  * *Responsibility*: Core page managing transfer details, process timelines, and workflow actions.
* `frontend/src/pages/TransferHistory.tsx`
  * *Responsibility*: Searchable and filterable history grid of resolved transfers.
* `frontend/src/pages/BranchDirectory.tsx`
  * *Responsibility*: Contact directory showing branch and department details.
* `frontend/src/pages/Profile.tsx`
  * *Responsibility*: Profile manager showing user details and password modification controls.
* `frontend/src/pages/CashLedger.tsx`
  * *Responsibility*: Displays branch vaults cash balances and transaction ledger logs.
* `frontend/src/pages/ManualAdjustment.tsx`
  * *Responsibility*: Submission forms and manager approval cards for cash adjustments.
* `frontend/src/pages/StockLedger.tsx`
  * *Responsibility*: Displays branch inventory levels, SKU cards, and stock ledger logs.
* `frontend/src/pages/StockAdjustment.tsx`
  * *Responsibility*: Submission forms and manager approval cards for stock adjustments.
* `frontend/src/pages/admin/BranchManagement.tsx`
  * *Responsibility*: Branch administrative manager.
* `frontend/src/pages/admin/DepartmentManagement.tsx`
  * *Responsibility*: Department administrative manager.
* `frontend/src/pages/admin/ItemManagement.tsx`
  * *Responsibility*: Category and stock item SKU administrative manager.
* `frontend/src/pages/admin/UserManagement.tsx`
  * *Responsibility*: User profiles and permissions administrative manager.
* `frontend/src/components/ProtectedRoute.tsx`
  * *Responsibility*: Authentication guard directing unauthorized traffic to the login screen.
* `frontend/src/components/Layout/Layout.tsx`
  * *Responsibility*: Main shell component binding sidebars, topbars, and page content areas.
* `frontend/src/components/Layout/Sidebar.tsx`
  * *Responsibility*: Navigation sidebar displaying menu options based on user roles.
* `frontend/src/components/Layout/Topbar.tsx`
  * *Responsibility*: Header component rendering user details and profile menus.
* `frontend/src/context/AuthContext.tsx`
  * *Responsibility*: Maintains the global React authentication state, saving user profile data and tokens.
* `frontend/src/api/axiosConfig.ts`
  * *Responsibility*: Configures Axios clients to attach JWT Bearer tokens and intercept session expirations.
* `frontend/src/types/transfer.ts`
  * *Responsibility*: Declares TypeScript typings for API responses.
* `frontend/src/index.css`
  * *Responsibility*: Global style resets, typography rules, and utility classes.
* `frontend/src/variables.css`
  * *Responsibility*: Defines CSS custom properties for color palettes, shadow designs, and spacing scales.
* `frontend/src/App.css`
  * *Responsibility*: App-level layout resets.

### Backend Components Map (`backend/src/main/java/com/jamunabank/branchsync/`)

* `backend/src/main/java/com/jamunabank/branchsync/controller/AuthController.java`
  * *Responsibility*: Processes employee logins and returns authentication tokens.
* `backend/src/main/java/com/jamunabank/branchsync/controller/TransferController.java`
  * *Responsibility*: Manages the transfer request workflow state machine. Exposes endpoints for workflow progression and logs auditing.
* `backend/src/main/java/com/jamunabank/branchsync/controller/CashController.java`
  * *Responsibility*: Manages branch vault balances, denominations sheets, ledgers, and cash adjustments.
* `backend/src/main/java/com/jamunabank/branchsync/controller/StockController.java`
  * *Responsibility*: Manages branch inventory, SKUs, ledgers, and stock adjustments.
* `backend/src/main/java/com/jamunabank/branchsync/controller/LookupController.java`
  * *Responsibility*: Exposes reference data to populate frontend forms.
* `backend/src/main/java/com/jamunabank/branchsync/controller/OrgManagementController.java`
  * *Responsibility*: Admin endpoints managing branches, departments, categories, and stock items.
* `backend/src/main/java/com/jamunabank/branchsync/controller/UserManagementController.java`
  * *Responsibility*: Admin endpoints managing user accounts.
* `backend/src/main/java/com/jamunabank/branchsync/controller/UserController.java`
  * *Responsibility*: Processes user profile queries and branch directories.
* `backend/src/main/java/com/jamunabank/branchsync/service/TransferService.java`
  * *Responsibility*: Declares the interface for managing transfer requests.
* `backend/src/main/java/com/jamunabank/branchsync/service/impl/TransferServiceImpl.java`
  * *Responsibility*: Implements the transfer request state machine, transitions logic, and validation checks.
* `backend/src/main/java/com/jamunabank/branchsync/service/CashService.java`
  * *Responsibility*: Declares the interface for managing cash vault math, ledgers, and adjustments.
* `backend/src/main/java/com/jamunabank/branchsync/service/impl/CashServiceImpl.java`
  * *Responsibility*: Implements cash vault balance checks, note denomination validation, and manual cash adjustments.
* `backend/src/main/java/com/jamunabank/branchsync/service/StockService.java`
  * *Responsibility*: Declares the interface for managing stock quantities, SKU levels, and adjustments.
* `backend/src/main/java/com/jamunabank/branchsync/service/impl/StockServiceImpl.java`
  * *Responsibility*: Implements branch stock balance tracking, stock ledger entries, and stock adjustments.
* `backend/src/main/java/com/jamunabank/branchsync/service/AuditService.java`
  * *Responsibility*: Declares the audit logging interface.
* `backend/src/main/java/com/jamunabank/branchsync/service/impl/AuditServiceImpl.java`
  * *Responsibility*: Implements log tracking inside the database.
* `backend/src/main/java/com/jamunabank/branchsync/service/ManagementService.java`
  * *Responsibility*: Declares administrative management interfaces.
* `backend/src/main/java/com/jamunabank/branchsync/service/impl/ManagementServiceImpl.java`
  * *Responsibility*: Administrative engine for updating branches, departments, stock items, and user accounts.
* `backend/src/main/java/com/jamunabank/branchsync/repository/UserRepository.java`
  * *Responsibility*: Database access for user entities.
* `backend/src/main/java/com/jamunabank/branchsync/repository/RoleRepository.java`
  * *Responsibility*: Database access for role entities.
* `backend/src/main/java/com/jamunabank/branchsync/repository/BranchRepository.java`
  * *Responsibility*: Database access for branch entities.
* `backend/src/main/java/com/jamunabank/branchsync/repository/DepartmentRepository.java`
  * *Responsibility*: Database access for department entities.
* `backend/src/main/java/com/jamunabank/branchsync/repository/ItemCategoryRepository.java`
  * *Responsibility*: Database access for item category entities.
* `backend/src/main/java/com/jamunabank/branchsync/repository/TransferRequestRepository.java`
  * *Responsibility*: Database access for transfer request entities.
* `backend/src/main/java/com/jamunabank/branchsync/repository/AuditLogRepository.java`
  * *Responsibility*: Database access for audit log entities.
* `backend/src/main/java/com/jamunabank/branchsync/repository/BranchCashBalanceRepository.java`
  * *Responsibility*: Database access for live cash balance entities.
* `backend/src/main/java/com/jamunabank/branchsync/repository/CashLedgerRepository.java`
  * *Responsibility*: Database access for cash ledger entities.
* `backend/src/main/java/com/jamunabank/branchsync/repository/CashTransferDenominationRepository.java`
  * *Responsibility*: Database access for denomination entities.
* `backend/src/main/java/com/jamunabank/branchsync/repository/CashManualAdjustmentRepository.java`
  * *Responsibility*: Database access for cash manual adjustments.
* `backend/src/main/java/com/jamunabank/branchsync/repository/StockItemRepository.java`
  * *Responsibility*: Database access for stock SKU entities.
* `backend/src/main/java/com/jamunabank/branchsync/repository/BranchStockBalanceRepository.java`
  * *Responsibility*: Database access for branch SKU quantity balances.
* `backend/src/main/java/com/jamunabank/branchsync/repository/StockLedgerRepository.java`
  * *Responsibility*: Database access for stock ledger entities.
* `backend/src/main/java/com/jamunabank/branchsync/repository/StockManualAdjustmentRepository.java`
  * *Responsibility*: Database access for stock manual adjustments.

---

## Viva Emergency Navigation

If the examiner asks about a specific feature, use this quick checklist under pressure to navigate immediately to the source files:

### Login
* **Frontend Component**: `frontend/src/pages/Login.tsx` (Renders credentials form)
* **Backend Controller**: `backend/src/main/java/com/jamunabank/branchsync/controller/AuthController.java` (Exposes login path endpoint)
* **Backend Custom Password Encoder**: `backend/src/main/java/com/jamunabank/branchsync/security/Sha256PasswordEncoder.java` (Hashed comparisons)
* **Database Table**: `users` (User records source)

### JWT
* **Security Filter**: `backend/src/main/java/com/jamunabank/branchsync/security/JwtAuthenticationFilter.java` (Verifies headers)
* **Token Utility Component**: `backend/src/main/java/com/jamunabank/branchsync/security/JwtUtils.java` (Generates and decodes tokens)
* **Frontend Token Interceptor**: `frontend/src/api/axiosConfig.ts` (Appends JWT to headers)
* **Spring Security Config**: `backend/src/main/java/com/jamunabank/branchsync/security/SecurityConfig.java` (Declares paths permissions)

### HQ Routing
* **Frontend Routing Handler**: `frontend/src/pages/TransferDetails.tsx` (Function: `handleHqVerify()`)
* **Backend Controller Endpoint**: `backend/src/main/java/com/jamunabank/branchsync/controller/TransferController.java` (Exposes `/hq-verify` path endpoint)
* **Backend Routing Method**: `backend/src/main/java/com/jamunabank/branchsync/service/impl/TransferServiceImpl.java` (Method: `hqVerify()`)
* **Entity Relationships**: `backend/src/main/java/com/jamunabank/branchsync/model/entity/TransferRequest.java` (Fields: `destinationBranch`, `destinationDepartment`)

### Cash Transfer
* **Denominations Form UI**: `frontend/src/pages/TransferDetails.tsx` (Denomination spreadsheets grid markup)
* **Denominations Controller**: `backend/src/main/java/com/jamunabank/branchsync/controller/CashController.java` (Function: `submitDenominations()`)
* **Denominations Service Method**: `backend/src/main/java/com/jamunabank/branchsync/service/impl/CashServiceImpl.java` (Method: `submitDenominations()`)
* **Database Tables**: `cash_transfer_denominations` (Stores counts) & `branch_cash_balance` (Vault amounts)

### Stock Adjustment
* **Frontend Adjustments UI**: `frontend/src/pages/StockAdjustment.tsx` (Submission cards and pending list)
* **Backend Controller**: `backend/src/main/java/com/jamunabank/branchsync/controller/StockController.java` (Endpoint functions: `submitAdjustment()`, `decideAdjustment()`)
* **Backend Service Logic**: `backend/src/main/java/com/jamunabank/branchsync/service/impl/StockServiceImpl.java` (Methods: `submitAdjustment()`, `approveAdjustment()`)
* **Database Table**: `stock_manual_adjustments` (Tracks approvals details) & `stock_ledger` (Stores logs)

### Audit Log
* **Audit Logging Engine**: `backend/src/main/java/com/jamunabank/branchsync/service/impl/AuditServiceImpl.java` (Method: `logAction()`)
* **JPA Repository**: `backend/src/main/java/com/jamunabank/branchsync/repository/AuditLogRepository.java` (Log DB access)
* **Frontend Timeline View**: `frontend/src/pages/TransferDetails.tsx` (Renders stepper stepper)
* **Database Table**: `audit_logs` (Append-only database rows)

### Transfer Workflow
* **Frontend Timeline Component**: `frontend/src/pages/TransferDetails.tsx` (Renders stepper stages cards)
* **Workflow Service Engines**: `backend/src/main/java/com/jamunabank/branchsync/service/impl/TransferServiceImpl.java` (Method transitions: `initiateTransfer()`, `approveInternal()`, `hqVerify()`, `acceptAndAssignDriver()`, `releaseFinal()`, `markPickedUp()`, `markDelivered()`, `closeRequest()`)
* **API Endpoints Map**: `backend/src/main/java/com/jamunabank/branchsync/controller/TransferController.java` (Progress endpoints)
* **Database Table**: `transfer_requests` (Tracks the current status column)
