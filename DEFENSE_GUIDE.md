# BranchSync — Project Defense & Viva Preparation Guide

This document is compiled specifically for project defense and viva preparation. It answers common operational and architectural questions feature-by-feature, details file responsibilities, traces process flows, and links components to their database schema and endpoints.

---

# Table of Contents
1. [Core Architecture & System Stack](#core-architecture--system-stack)
2. [Module-by-Module Defense Profiles](#module-by-module-defense-profiles)
   * [1. Authentication & Authorization](#1-authentication--authorization)
   * [2. Dashboard](#2-dashboard)
   * [3. Transfer Request Creation](#3-transfer-request-creation)
   * [4. Transfer Workflow Lifecycle](#4-transfer-workflow-lifecycle)
   * [5. HQ Routing & Assignment](#5-hq-routing--assignment)
   * [6. Destination Acceptance & Driver Assignment](#6-destination-acceptance--driver-assignment)
   * [7. Final Release Workflow](#7-final-release-workflow)
   * [8. Courier Pickup & Delivery](#8-courier-pickup--delivery)
   * [9. Request Completion & Rejection](#9-request-completion--rejection)
   * [10. Cash Vault Module](#10-cash-vault-module)
   * [11. Cash Denomination Handling](#11-cash-denomination-handling)
   * [12. Cash Adjustments](#12-cash-adjustments)
   * [13. Cash Ledger](#13-cash-ledger)
   * [14. Stock Inventory Module](#14-stock-inventory-module)
   * [15. Stock Item Management](#15-stock-item-management)
   * [16. Stock Adjustments](#16-stock-adjustments)
   * [17. Stock Ledger](#17-stock-ledger)
   * [18. Audit Logging](#18-audit-logging)
   * [19. Branch Management](#19-branch-management)
   * [20. Department Management](#20-department-management)
   * [21. User Management](#21-user-management)
   * [22. Item Category Management](#22-item-category-management)
   * [23. Stock Category Behavior System](#23-stock-category-behavior-system-cash--stock--document_case)
   * [24. Branch Directory](#24-branch-directory)
   * [25. Reports / Print Features](#25-reports--print-features)
   * [26. Role-Based Access Control](#26-role-based-access-control)
   * [27. Notification / Attention Required Widgets](#27-notification--attention-required-widgets)
   * [28. Lookup APIs](#28-lookup-apis)
   * [29. Database Architecture](#29-database-architecture)
   * [30. Security Configuration](#30-security-configuration)
3. [Complete Project File Map](#complete-project-file-map)
4. [Defense Quick Navigation Guide](#defense-quick-navigation-guide)

---

## Core Architecture & System Stack

To start any viva explanation, present a crisp summary of the system architecture:
* **Frontend**: React 18, TypeScript, Vite. Single Page Application (SPA) driven by React Router. State is held locally and scoped inside React Contexts (like `AuthContext`). Intercepted by Axios to auto-inject JWT tokens. Styling is premium, custom-written Vanilla CSS.
* **Backend**: Spring Boot 3, Java 21, Spring Data JPA, Spring Security (JWT-based stateless authentication).
* **Database**: MySQL/MariaDB.
* **Design Pattern**: Three-tier architecture. Controller Layer (REST endpoints) ⇄ Service Layer (Business logic state engine) ⇄ Repository Layer (JPA-driven queries) ⇄ Database (Relational tables).

---

## Module-by-Module Defense Profiles

---

# 1. Authentication & Authorization

## Business Purpose
Secures access to banking operations. Ensures only verified employees can log in using their unique Employee ID, and restricts actions in accordance with their designated role.

## User Flow
User submits credentials (Employee ID and password) on the login screen. On success, the API returns a stateless JWT token alongside the employee's profile metadata. This JWT is stored in `localStorage` and attached to all subsequent request headers.

## Frontend Files
* `Login.tsx` → Renders the Login page, manages input state, toggles password visibility, and triggers authentication requests.
* `AuthContext.tsx` → Maintains the global React authentication state, handles `login(token)` and `logout()` operations, and persists the payload in storage.
* `ProtectedRoute.tsx` → An authentication route guard that redirects unauthenticated attempts to the `/login` route.
* `axiosConfig.ts` → Pre-configured Axios client that intercepts outgoing calls to attach the `Authorization: Bearer <token>` header and redirects on `401 Unauthorized` responses.

## Backend Files
* `AuthController.java` → Exposes the `/api/auth/login` endpoint, processes credentials, and returns JWT tokens.
* `CustomUserDetailsService.java` → Loads the user entity from the database using their unique Employee ID.
* `CustomUserDetails.java` → Standard Principal object that contains details (employeeId, branchId, departmentId, authorities) used throughout security context.
* `JwtUtils.java` → Component handling JWT generation, parsing, and expiration validation.
* `JwtAuthenticationFilter.java` → Filter intercepting every request to extract, validate, and set the JWT in the Spring Security context.
* `Sha256PasswordEncoder.java` → Custom password encoder executing SHA-256 hashing to match seeded database records.
* `SecurityConfig.java` → Declares security policies, public paths, CORS rules, and binds the JWT authentication filter.

## Database Tables
* `users` → Stores employee accounts, hashed passwords, roles, branch mapping, department mapping, and active flags.
* `roles` → Defines administrative and operational roles (`SYSTEM_ADMIN`, `BRANCH_MANAGER`, `OFFICER`, etc.).

## APIs Used
* `POST /api/auth/login` → Handles authentication. Returns the JWT token, employee profile details, and role specifications.

## Visual Components
* Card-styled Login Box with dual-tone shadows.
* Password Show/Hide Toggle button (SVG icon inside password input).
* Error Banner Overlay showing details of authentication failures.

## Sorting / Filtering
None.

## Viva Demonstration Flow
`Login Page (UI)` ➔ `Submit Credentials` ➔ `POST /api/auth/login` ➔ `AuthController` ➔ `AuthenticationManager` ➔ `CustomUserDetailsService` ➔ `Sha256PasswordEncoder` ➔ `JwtUtils (Generates Token)` ➔ `JSON Response back to UI` ➔ `Save to localStorage & AuthContext` ➔ `Redirect to Dashboard`.

## Common Viva Questions
* **Q: Why did you choose SHA-256 instead of BCrypt?**
  * **A:** SHA-256 was chosen to preserve perfect compatibility with existing seeded database hashes and legacy bank employee data. In a typical production migration, a custom encoder is implemented to validate these standard hashes until a rolling update migrates users to BCrypt.
* **Q: Where is the JWT verified on the backend?**
  * **A:** Inside `JwtAuthenticationFilter.java` which intercepts all requests before they hit the controller. It validates the signature, extracts the user details, and registers them into Spring Security’s `SecurityContextHolder`.

---

# 2. Dashboard

## Business Purpose
Provides employees with a personalized landing zone containing immediate notifications, metric cards, and a real-time table of active inter-branch transfers relevant to their specific role.

## User Flow
Upon logging in, the user lands on the dashboard. They see a personalized greeting, a high-priority "Attention Required" action box, and a list of active transfers. Clicking any row navigates directly to the Transfer Details screen.

## Frontend Files
* `Dashboard.tsx` → Pulls active transfers from the API, organizes active queues, and displays conditional warnings.
* `Dashboard.css` → Handles layout styling, badge colors, and layout configurations.
* `Sidebar.tsx` → Sidebar navigation component displaying links based on roles.
* `Topbar.tsx` → Topbar showing profile cards, branch details, and the logout trigger.

## Backend Files
* `TransferController.java` → Handles the REST endpoint fetching active transfers.
* `TransferServiceImpl.java` → Contains the `getDashboardTransfers()` logic, applying branch-level and department-level scopes based on the actor's role.

## Database Tables
* `transfer_requests` → Fetches the transfer records.
* `item_categories` → Resolves category names and behavior types for visual badges.

## APIs Used
* `GET /api/transfers` → Fetches active transfers filtered by the user's role and branch/department context.

## Visual Components
* Role-specific welcome card.
* "Attention Required" alert list (e.g. transfers needing approval, preparations, or courier actions).
* Active transfers table with behavior badges (CASH in green, STOCK in blue, DOCUMENT_CASE in grey) and priority tags (NORMAL/HIGH/URGENT/CRITICAL).

## Sorting / Filtering
* Frontend filters search active transfers by code, title, or status.
* Pagination controls.
* Backend applies a custom filter: orders rows chronologically by `requested_at` in descending order.

## Viva Demonstration Flow
`Dashboard (UI)` ➔ `Axios Request` ➔ `TransferController.getDashboardTransfers()` ➔ `TransferServiceImpl.getDashboardTransfers()` ➔ `Applies Role Queries in SQL` ➔ `TransferRequestRepository` ➔ `TransferMapper (converts to DTO)` ➔ `Response` ➔ `Renders Tables and Badges`.

## Common Viva Questions
* **Q: What determines which active transfers are shown on a user's dashboard?**
  * **A:** Data access is scoped on the backend. `SYSTEM_ADMIN` sees all active transfers; `DELIVERY_PERSON` sees only transfers assigned specifically to them; `BRANCH_MANAGER` sees all transfers involving their branch; while `OFFICER` sees transfers involving their specific branch AND department.

---

# 3. Transfer Request Creation

## Business Purpose
Allows branch personnel to initiate an inter-branch transfer request for cash, stock inventory, or documents, without having to choose the destination supplying branch at creation.

## User Flow
The initiator clicks "New Request". The page loads, auto-detecting the user's branch as the origin. They select a category. Choosing a CASH category displays an amount field. Choosing a STOCK category loads related stock items (SKUs) and displays quantity inputs. They choose priority, enter details, and hit Submit.

## Frontend Files
* `NewTransfer.tsx` → Manages the multi-step request creation form, category behavior updates, and validation.
* `NewTransfer.css` → Styles form components, inputs, and conditional blocks.

## Backend Files
* `TransferController.java` → Exposes the request creation endpoint.
* `TransferServiceImpl.java` → Handles the `initiateTransfer()` business logic, code generation, and manager bypass.
* `TransferMapper.java` → Maps the incoming payload DTO to a persistent entity.

## Database Tables
* `transfer_requests` → Inserts a new request row.
* `item_categories` → Resolves the category details.
* `stock_items` → Resolves SKU definitions for stock selections.

## APIs Used
* `GET /api/lookup/branches` → Populates branch information (read-only for non-admins).
* `GET /api/lookup/departments` → Populates target department drop-down.
* `GET /api/lookup/categories` → Fetches categories mapped to the initiator's department.
* `GET /api/lookup/stock-items/{categoryId}` → Loads active items for STOCK requests.
* `POST /api/transfers` → Submits the DTO.

## Visual Components
* Multi-stage input fields.
* Dynamic category behavior switches (renders currency inputs for cash, SKU picker + quantity fields for stock).
* Priority selectors with color indicators.

## Sorting / Filtering
* **Category Filtering**: Regular officers are restricted client-side to seeing only categories mapping to their department, or categories marked as "Open Access" (departmentId is NULL).

## Viva Demonstration Flow
`New Request Form (UI)` ➔ `Fill Fields` ➔ `POST /api/transfers` ➔ `TransferController.initiateTransfer()` ➔ `TransferServiceImpl.initiateTransfer()` ➔ `Generates Request Code (REQ-YYYY-NNNN)` ➔ `Saves Entity` ➔ `Sets Status (PENDING_INTERNAL or PENDING_HQ_APPROVAL)` ➔ `Return Success DTO`.

## Common Viva Questions
* **Q: Why does a manager's request skip the first state (PENDING_INTERNAL)?**
  * **A:** Since the branch manager is the highest authority inside that branch, they do not require internal approval. The service layer (`TransferServiceImpl.java`) detects their manager role and automatically sets the status to `PENDING_HQ_APPROVAL`, mapping the manager as the internal approver.
* **Q: How is the request code generated?**
  * **A:** In `TransferServiceImpl.java`, the system counts current database entries, adds 1, and concatenates it with the current year (e.g. `REQ-2026-0089`).

---

# 4. Transfer Workflow Lifecycle

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

## Frontend Files
* `TransferDetails.tsx` → The main page that displays full details and renders buttons based on status, branch boundaries, and roles.
* `TransferDetails.css` → Handles state timelines, cards, buttons, and alert layouts.

## Backend Files
* `TransferController.java` → Maps the endpoints for each step of the state machine.
* `TransferServiceImpl.java` → Validates the state transition rules, checks permissions, and performs updates.
* `AuditServiceImpl.java` → Records each state transition.

## Database Tables
* `transfer_requests` → Holds the current `status` field.
* `audit_logs` → Tracks state changes chronologically.

## APIs Used
* `GET /api/transfers/{id}` → Renders current request details and states.
* `POST /api/transfers/{id}/approve-internal` (Step 1)
* `POST /api/transfers/{id}/hq-verify` (Step 2)
* `POST /api/transfers/{id}/accept` (Step 3)
* `POST /api/transfers/{id}/release` (Step 4)
* `POST /api/transfers/{id}/pickup` (Step 5)
* `POST /api/transfers/{id}/deliver` (Step 6)
* `POST /api/transfers/{id}/close` (Step 7)

## Visual Components
* Visual chevron process timeline showing past, current, and future stages.
* Status badges (colored by stage severity).
* Timestamps of step completions on the card layout.

## Sorting / Filtering
* Frontend gates visual action panels; buttons are visible only to the target actor for the current status.

## Viva Demonstration Flow
`TransferDetails (UI)` ➔ `User Clicks Action Button` ➔ `Trigger API Call` ➔ `TransferController` ➔ `TransferServiceImpl` ➔ `Validates User and Transition` ➔ `Updates DB Entity` ➔ `AuditServiceImpl Logs Entry` ➔ `Response Success` ➔ `UI Triggers Refresh`.

## Common Viva Questions
* **Q: How does the system prevent out-of-order workflow execution?**
  * **A:** The business rules are enforced on both layers. The frontend hides buttons for invalid stages, and `TransferServiceImpl.java` checks current database values before executing transitions, throwing a `BusinessRuleViolationException` if a step is out of order.

---

# 5. HQ Routing & Assignment

## Business Purpose
Maintains central control over inter-branch logistics. Decentralized branch creators do not determine which branch supplies their requested asset; HQ Logistics evaluates reserves and routes the supply order to the most appropriate branch.

## User Flow
HQ Logistics Officer views their dashboard queue (`PENDING_HQ_APPROVAL`). They select a request. The details panel presents dropdown lists of branches and departments. For CASH, the branch choices highlight live balances. HQ selects the supplier and clicks "Verify & Route".

## Frontend Files
* `TransferDetails.tsx` → Conditionally renders the HQ assignment panel for `HQ_LOGISTICS_OFFICER` when status is `PENDING_HQ_APPROVAL`.

## Backend Files
* `TransferController.java` → Processes the routing API call.
* `TransferServiceImpl.java` → Processes `hqVerify()`, registers target supplier details, and updates the status.
* `CashServiceImpl.java` / `StockServiceImpl.java` → Provides live balances for decision warnings.

## Database Tables
* `transfer_requests` → Binds `destination_branch_id` and `destination_department_id` on routing.
* `branch_cash_balance` / `branch_stock_balance` → Read-only balances used during routing decisions.

## APIs Used
* `POST /api/transfers/{id}/hq-verify` → Triggers routing (submits `VerificationRequestDto` containing destination branch and department).

## Visual Components
* Supplying branch and department selectors.
* Supply warnings indicating if the target branch vault balance is below the requested threshold.

## Sorting / Filtering
None.

## Viva Demonstration Flow
`HQ Officer opens TransferDetails` ➔ `Selects Supply Branch & Department` ➔ `Submits Routing DTO` ➔ `POST .../hq-verify` ➔ `TransferController` ➔ `TransferServiceImpl.hqVerify()` ➔ `Binds Destination to Entity` ➔ `Updates Status to PENDING_ASSIGNMENT` ➔ `Audit Logged` ➔ `Redirects/Refreshes`.

## Common Viva Questions
* **Q: Why does the system support deferred routing by HQ instead of creator choice?**
  * **A:** To prevent branch coordination issues and cash hoarding. Requisitioning branches do not know which branch has excess inventory or vault cash; HQ manages overall liquidity and makes informed routing decisions.

---

# 6. Destination Acceptance & Driver Assignment

## Business Purpose
Gives the supplying branch control over their physical inventory. They verify they have the asset, allocate specific cash denominations or physical stock, and schedule an available courier.

## User Flow
A branch officer at the supplying branch sees a routed transfer in `PENDING_ASSIGNMENT`. They open it. For CASH, they enter the cash denomination count. For STOCK, they see quantity requirements (low stock warnings appear if on-hand quantity is too low). They choose an available courier from the driver dropdown and hit "Accept & Assign".

## Frontend Files
* `TransferDetails.tsx` → Displays acceptance form, denomination calculator, driver selector, and stock alerts.

## Backend Files
* `TransferController.java` → Processes the acceptance endpoints.
* `TransferServiceImpl.java` → Validates note values and driver availability, registers coordinates, and advances status to `PENDING_FINAL_RELEASE`.
* `LookupController.java` → Supplies the list of available drivers.

## Database Tables
* `transfer_requests` → Links the assigned delivery user, acceptor user, and denominations flag.
* `users` → Filters for available delivery drivers.
* `cash_transfer_denominations` → Stores note counts for cash transfers.

## APIs Used
* `GET /api/lookup/users/delivery-persons/available` → Fetches drivers with `role = DELIVERY_PERSON` and `isAvailable = true`.
* `POST /api/cash/denominations/{id}` → Saves cash note counts.
* `POST /api/transfers/{id}/accept` → Completes acceptance (submits courier selection).

## Visual Components
* Note Denomination Grid (renders inputs for ৳1 to ৳1000, calculating the total dynamically).
* Low Stock Alert Banner (renders if destination stock is less than the requested amount).
* Courier Select Dropdown.

## Sorting / Filtering
* **Driver Lookup**: Filtered strictly on the database layer to return only users with role `DELIVERY_PERSON` and `is_available = true`.

## Viva Demonstration Flow
`Accept Form (UI)` ➔ `Note Denomination Inputs` ➔ `Driver Selected` ➔ `POST Denominations` ➔ `POST .../accept` ➔ `TransferServiceImpl.acceptAndAssignDriver()` ➔ `Validates Driver and State` ➔ `Assigns Driver` ➔ `Updates Status to PENDING_FINAL_RELEASE`.

## Common Viva Questions
* **Q: How does driver availability tracking work?**
  * **A:** The system checks the `isAvailable` boolean on `User.java`. Drivers are excluded from the drop-down selection when `isAvailable` is `false`. A driver's availability is set to `false` during courier pickup, and reset to `true` during delivery.

---

# 7. Final Release Workflow

## Business Purpose
Branch gatekeeping. Ensures that a branch manager at the supplying branch authorizes the physical release of the assets before a courier can carry them away.

## User Flow
The supplying branch manager views the request in `PENDING_FINAL_RELEASE`. They review the details (denominations, stock items, driver) and click "Approve & Release".

## Frontend Files
* `TransferDetails.tsx` → Renders the manager action panel for supplying managers.

## Backend Files
* `TransferController.java` → Processes final release calls.
* `TransferServiceImpl.java` → Validates the manager's role at the destination branch and updates the status to `READY_FOR_PICKUP`.

## Database Tables
* `transfer_requests` → Updates the status field.

## APIs Used
* `POST /api/transfers/{id}/release` → Triggers final release.

## Visual Components
* Release Control Card with confirmation buttons.

## Sorting / Filtering
None.

## Viva Demonstration Flow
`Manager Action Panel` ➔ `Click Release` ➔ `POST .../release` ➔ `TransferController` ➔ `TransferServiceImpl.releaseRequest()` ➔ `Validates Manager at Destination Branch` ➔ `Status set to READY_FOR_PICKUP` ➔ `Success Response`.

## Common Viva Questions
* **Q: Can an officer perform the final release step?**
  * **A:** No. The service layer strictly validates that the actor's role is in the `MANAGER_ROLES` set and that they belong to the supplying destination branch. If this check fails, it throws an `UnauthorizedRoleException` (returning a 403 status).

---

# 8. Courier Pickup & Delivery

## Business Purpose
Tracks the physical movement of assets. Locks driver availability while in transit, and executes automated balance and ledger updates at pickup and delivery.

## User Flow
The assigned driver logs in and views their dashboard queue (`READY_FOR_PICKUP`). They click "Confirm Pickup" upon collecting the asset. Status changes to `IN_TRANSIT` (locking the driver's availability). Upon arrival, the driver clicks "Confirm Delivery". Status changes to `DELIVERED` (restoring the driver's availability).

## Frontend Files
* `TransferDetails.tsx` → Renders the courier action panels (Confirm Pickup / Confirm Delivery).

## Backend Files
* `TransferController.java` → Processes pickup and delivery REST calls.
* `TransferServiceImpl.java` → Validates driver identity, changes status, updates driver availability, and triggers ledger updates via Cash or Stock services.
* `CashServiceImpl.java` / `StockServiceImpl.java` → Performs balance deductions and credits.

## Database Tables
* `transfer_requests` → Tracks courier actions.
* `users` → Sets driver `is_available` to `false` on pickup, and `true` on delivery.
* `branch_cash_balance` / `branch_stock_balance` → Debits/Credits.
* `cash_ledger` / `stock_ledger` → Records ledger logs.

## APIs Used
* `POST /api/transfers/{id}/pickup` → Processes pickup (debits supplier balances, logs `TRANSFER_OUT` in ledger, locks driver).
* `POST /api/transfers/{id}/deliver` → Processes delivery (credits receiver balances, logs `TRANSFER_IN` in ledger, releases driver).

## Visual Components
* Courier status alert banner.
* Large action buttons (Confirm Pickup, Confirm Delivery).

## Sorting / Filtering
* Frontend gates visual access; panels are visible only to the user whose ID matches the request's `deliveryPersonId`.

## Viva Demonstration Flow
`Driver UI` ➔ `Click Pickup` ➔ `POST .../pickup` ➔ `TransferService` ➔ `Deducts Supplying Branch Balance` ➔ `Logs TRANSFER_OUT Ledger Entry` ➔ `Sets Driver isAvailable = false` ➔ `Status set to IN_TRANSIT` ➔ `Driver Clicks Deliver` ➔ `POST .../deliver` ➔ `TransferService` ➔ `Adds Receiving Branch Balance` ➔ `Logs TRANSFER_IN Ledger Entry` ➔ `Sets Driver isAvailable = true` ➔ `Status set to DELIVERED`.

## Common Viva Questions
* **Q: Why are vault and stock balances debited on pickup, rather than on delivery?**
  * **A:** To prevent double-spending and stock out-of-sync issues. Once assets leave the supplying branch, they must be removed from that vault's balances. While in transit, they are not available at either branch, and are credited to the receiving branch only upon delivery.

---

# 9. Request Completion & Rejection

## Business Purpose
Establishes recipient verification and fallback workflows. The creator must confirm they received the assets in correct order, or reject them (triggering a reversal of ledger updates).

## User Flow
The original request initiator views the request in `DELIVERED`. They select "Accept & Close" or "Reject & Revert". If they reject, they must enter a mandatory rejection reason. The request becomes `COMPLETED` or `REJECTED_ON_RECEIPT`.

## Frontend Files
* `TransferDetails.tsx` → Displays the recipient confirmation panel.

## Backend Files
* `TransferController.java` → Processes completion calls.
* `TransferServiceImpl.java` → Handles `closeRequest()`, updates status, and triggers reversals if rejected.
* `CashServiceImpl.java` / `StockServiceImpl.java` → Reverses balance transactions.

## Database Tables
* `transfer_requests` → Updates status to `COMPLETED` or `REJECTED_ON_RECEIPT`.
* `branch_cash_balance` / `branch_stock_balance` → Reverses balances on rejection.
* `cash_ledger` / `stock_ledger` → Appends `REVERSAL_OUT` and `REVERSAL_IN` entries.

## APIs Used
* `POST /api/transfers/{id}/close` → Submits verification (payload DTO contains `accepted` flag and `finalNote` text).

## Visual Components
* Verification Form with decision selectors (Accept / Reject).
* Mandatory Rejection Note input area.

## Sorting / Filtering
* Frontend gates visual access; panel is visible only to the original `initiatedById` user.

## Viva Demonstration Flow
`Initiator Form` ➔ `Choose Decision` ➔ `POST .../close` ➔ `TransferServiceImpl.closeRequest()` ➔ `If Accepted: Status set to COMPLETED` ➔ `If Rejected: Status set to REJECTED_ON_RECEIPT` ➔ `Triggers Cash/Stock Service Reversal` ➔ `Balances Restored` ➔ `Logs REVERSAL Entries` ➔ `Returns Response`.

## Common Viva Questions
* **Q: What happens if a recipient rejects a cash transfer upon arrival?**
  * **A:** The system marks the request as `REJECTED_ON_RECEIPT` and immediately triggers ledger reversals. The receiving branch is debited, the supplying branch is credited, and `REVERSAL_IN` / `REVERSAL_OUT` transactions are logged to maintain audit records.

---

# 10. Cash Vault Module

## Business Purpose
Maintains live, real-time balances in local currencies (৳) for each bank branch, providing cash vault tracking for all locations.

## User Flow
Branch Managers and System Admins access `/cash/ledger`. Admins see a consolidated overview of balances across all branch vaults, while managers view their local branch reserves.

## Frontend Files
* `CashLedger.tsx` → Displays branch selector panels, balance hero cards, and ledger tables.
* `CashLedger.css` → Handles visual styling for currency display cards.

## Backend Files
* `CashController.java` → Handles balance queries.
* `CashServiceImpl.java` → Evaluates and returns branch balance records.

## Database Tables
* `branch_cash_balance` → Tracks live cash vault totals for each branch.

## APIs Used
* `GET /api/cash/balances` → Returns balances for all branch vaults (Admin view).
* `GET /api/cash/balance/{branchId}` → Returns balance for a single branch.

## Visual Components
* Multi-Branch Balance Overview Grid with card counters.
* Local Branch Vault Hero Card showing current balance in ৳.

## Sorting / Filtering
* Branch picker (restricted to admins; managers are locked to their own branch).

## Viva Demonstration Flow
`Open Cash Ledger Page` ➔ `Calls GET /api/cash/balances` ➔ `CashServiceImpl` ➔ `BranchCashBalanceRepository` ➔ `Renders Vault Balance Grid`.

## Common Viva Questions
* **Q: How does the system ensure the vault balance is never modified directly?**
  * **A:** The `branch_cash_balance` table is updated only through transactional operations (courier pickup/delivery, manual adjustments, or receipt rejections) handled via service layer processes.

---

# 11. Cash Denomination Handling

## Business Purpose
Ensures physical vault counts match the digital ledger. Supplying branches must break down cash transfers by exact note quantities, verifying counts before the assets leave the vault.

## User Flow
At the `PENDING_ASSIGNMENT` stage, the destination officer inputs the note count breakdown (e.g. ৳1000 × 5, ৳500 × 10). The system validates that the calculated sum matches the requested transfer amount.

## Frontend Files
* `TransferDetails.tsx` → Conditionally renders the denomination input sheet.

## Backend Files
* `CashController.java` → Processes denomination data.
* `CashServiceImpl.java` → Implements `saveDenominations()`, validating that the note breakdown matches the requested amount.

## Database Tables
* `cash_transfer_denominations` → Stores note counts (supports notes from ৳1 to ৳1000).

## APIs Used
* `POST /api/cash/denominations/{requestId}` → Saves note counts.
* `GET /api/cash/denominations/{requestId}` → Fetches note counts for read-only displays.

## Visual Components
* Note entry spreadsheet grid showing sub-totals and grand totals calculated dynamically.
* Match indicator (displays green checkmark if sum matches requested transfer amount).

## Sorting / Filtering
None.

## Viva Demonstration Flow
`Acceptance Panel` ➔ `Enter Note Counts` ➔ `Calculate Total` ➔ `POST .../denominations` ➔ `CashServiceImpl.saveDenominations()` ➔ `Validates Sum == requestedAmount` ➔ `Saves note counts` ➔ `Returns Success`.

## Common Viva Questions
* **Q: What happens if the sum of note values does not match the requested amount?**
  * **A:** The system rejects the submission with a validation error, blocking the user from proceeding with driver assignment until the counts are corrected.

---

# 12. Cash Adjustments

## Business Purpose
Provides a secure, dual-custody audit pathway to manually adjust branch vault balances for audits, cash imports, or sorting corrections.

## User Flow
An officer in the Cash Operations department submits an adjustment request (Credit or Debit, amount, and justification). The request is logged as `PENDING`. The branch manager views the request on their dashboard, reviews the justification, and approves or rejects it.

## Frontend Files
* `ManualAdjustment.tsx` → Renders adjustment submission forms (for Officers) and pending approval tables (for Managers).
* `ManualAdjustment.css` → Handles visual styling for adjustment panels.

## Backend Files
* `CashController.java` → Processes adjustment submissions and approvals.
* `CashServiceImpl.java` → Processes `submitAdjustment()` and `decideAdjustment()`, updating balances and ledgers on approval.

## Database Tables
* `cash_manual_adjustments` → Stores details of pending and resolved adjustments.

## APIs Used
* `POST /api/cash/adjust` → Submits a new adjustment request.
* `POST /api/cash/adjust/{id}/decide` → Approves or rejects a pending adjustment.
* `GET /api/cash/adjust/pending` → Fetches pending adjustments for the manager's branch.
* `GET /api/cash/adjust/all` → Fetches adjustment history.

## Visual Components
* Adjustment Submission Form (Credit/Debit selector, amount, justification text area).
* Manager pending approvals feed.
* Adjustment history table with status indicators (PENDING/APPROVED/REJECTED).

## Sorting / Filtering
* Frontend displays input controls based on role. Officers submit requests, while managers approve or reject them.

## Viva Demonstration Flow
`Officer Form` ➔ `Submit Request` ➔ `POST /api/cash/adjust` ➔ `Manager Dashboard Alert` ➔ `Manager Opens Form` ➔ `POST .../decide` ➔ `CashServiceImpl.decideAdjustment()` ➔ `If Approved: Updates BranchCashBalance` ➔ `Logs MANUAL_ADJUSTMENT Ledger Entry` ➔ `Saves State` ➔ `Success`.

## Common Viva Questions
* **Q: How does the system prevent managers from approving arbitrary cash adjustments that exceed reserves?**
  * **A:** The system validates debit adjustments on the backend. In `decideAdjustment()`, a debit adjustment is checked against the branch's live vault balance. If the adjustment would cause an overdraft, the system blocks approval and throws a `BusinessRuleViolationException`.

---

# 13. Cash Ledger

## Business Purpose
Maintains an immutable, chronological, append-only transaction ledger for branch vault movements.

## User Flow
Managers or Admins open `/cash/ledger` to inspect every single cash deposit, withdrawal, transfer, or adjustment that took place.

## Frontend Files
* `CashLedger.tsx` → Renders local vault summaries, branch grids, and ledger tables.
* `CashLedger.css` → Handles style configurations.

## Backend Files
* `CashController.java` → Exposes ledger endpoints.
* `CashServiceImpl.java` → Fetches ledger logs.

## Database Tables
* `cash_ledger` → Immutable transactions history table.

## APIs Used
* `GET /api/cash/ledger/{branchId}` → Fetches vault transactions history.

## Visual Components
* Color-coded transaction table rows (Green for credits like `TRANSFER_IN` or `MANUAL_CREDIT`, Red for debits like `TRANSFER_OUT` or `MANUAL_DEBIT`, Orange for adjustments).
* Printable Ledger Grid layout.

## Sorting / Filtering
* Filtered chronologically (newest entries first).
* Branch selector (visible to System Admins only).

## Viva Demonstration Flow
`Open Cash Ledger` ➔ `GET .../ledger/{branchId}` ➔ `CashServiceImpl.getLedger()` ➔ `CashLedgerRepository` ➔ `Populate UI Table` ➔ `Click Request Code` ➔ `Navigate to Transfer Details`.

## Common Viva Questions
* **Q: Can a ledger entry be deleted or edited if an error is made?**
  * **A:** No. The `cash_ledger` table is strictly append-only. Corrective actions are handled by submitting a new manual adjustment, ensuring a clear and complete audit trail.

---

# 14. Stock Inventory Module

## Business Purpose
Tracks physical, countable asset inventories (e.g. computers, network routers, office furniture) across multiple branches.

## User Flow
Authorized personnel access the stock dashboards to review current item quantities across all branch vaults.

## Frontend Files
* `StockLedger.tsx` → Displays system-wide branch quantities, SKU chips, and ledger tables.

## Backend Files
* `StockController.java` → Processes stock balance requests.
* `StockServiceImpl.java` → Fetches stock balance details.

## Database Tables
* `branch_stock_balance` → Tracks live quantities per stock item at each branch.

## APIs Used
* `GET /api/stock/balances` → Returns stock balances across all locations.
* `GET /api/stock/balances/{branchId}` → Returns stock balances for a single branch.

## Visual Components
* Stock Level overview grids.
* Branch item quantity list.

## Sorting / Filtering
* Filtered by Branch or Stock Item SKU.

## Viva Demonstration Flow
`View Stock Balances` ➔ `GET .../stock/balances` ➔ `StockServiceImpl` ➔ `BranchStockBalanceRepository` ➔ `Populate balance cards`.

## Common Viva Questions
* **Q: How does the stock inventory system differentiate between item types?**
  * **A:** The system uses the `ItemCategory` entity’s `behaviorType` configuration. Items under categories set to `STOCK` are routed through the stock inventory system, managing countable quantities at the branch level.

---

# 15. Stock Item Management

## Business Purpose
System catalog management. Allows administrators to define and manage individual stock items (SKUs) nested under STOCK categories.

## User Flow
The System Admin opens `/admin/items`, selects a category with STOCK behavior, and opens the stock items panel to add, edit, or toggle the active status of items (SKUs).

## Frontend Files
* `ItemManagement.tsx` → Renders categories, stock item sub-panels, and SKU forms.

## Backend Files
* `OrgManagementController.java` → Exposes CRUD endpoints for stock items.
* `ManagementServiceImpl.java` → Processes stock item database updates.

## Database Tables
* `stock_items` → Stores item details (name, code, unit, active status) nested under an `item_category`.

## APIs Used
* `GET /api/admin/org/items/{categoryId}/stock-items` → Fetches SKUs for a category.
* `POST /api/admin/org/items/{categoryId}/stock-items` → Adds a new SKU.
* `PUT /api/admin/org/stock-items/{stockItemId}` → Edits a SKU's details.
* `PUT /api/admin/org/stock-items/{stockItemId}/toggle-active` → Toggles item active status.

## Visual Components
* Nested Stock Items Overlay panel.
* Inline SKU details form.
* Status toggles.

## Sorting / Filtering
* Display is filtered by category.

## Viva Demonstration Flow
`Admin Dashboard` ➔ `Select Stock Category` ➔ `Open SKU panel` ➔ `POST new item` ➔ `ManagementServiceImpl.createStockItem()` ➔ `Saves to stock_items` ➔ `Refreshes list`.

## Common Viva Questions
* **Q: What happens if a stock item is deactivated?**
  * **A:** Setting `is_active = false` excludes the item from new transfer dropdown lists and adjustments, while preserving history and existing ledger logs.

---

# 16. Stock Adjustments

## Business Purpose
Maintains inventory accuracy. Allows officers to submit quantity adjustments (Credit/Debit) for items within their department, subject to manager approval.

## User Flow
An officer submits an adjustment request (amount, item SKU, and reason). The request is logged as `PENDING`. The branch manager reviews the request and approves or rejects it.

## Frontend Files
* `StockAdjustment.tsx` → Renders adjustment forms, manager approval views, and historical logs.
* `StockAdjustment.css` → Handles visual styling.

## Backend Files
* `StockController.java` → Processes stock adjustment requests.
* `StockServiceImpl.java` → Processes `submitAdjustment()` and `decideAdjustment()`, validating balances and logging adjustments.

## Database Tables
* `stock_manual_adjustments` → Stores stock adjustment requests and resolutions.

## APIs Used
* `POST /api/stock/adjust` → Submits a new adjustment request.
* `POST /api/stock/adjust/{id}/decide` → Approves or rejects an adjustment request.
* `GET /api/stock/adjust/pending` → Fetches pending adjustments for the manager's branch.
* `GET /api/stock/adjust/all` → Fetches adjustment history.

## Visual Components
* SKU selection drop-downs.
* Pending approvals feed.
* History logs with approval status tags.

## Sorting / Filtering
* Submission lists are filtered by department and branch boundaries.

## Viva Demonstration Flow
`Officer Form` ➔ `Select SKU` ➔ `Submit Adjustment` ➔ `POST .../adjust` ➔ `Manager Reviews Approval Feed` ➔ `POST .../decide` ➔ `StockServiceImpl.decideAdjustment()` ➔ `If Approved: Updates BranchStockBalance` ➔ `Logs STOCK Ledger Entry` ➔ `Saves State` ➔ `Success`.

## Common Viva Questions
* **Q: Are stock adjustments scoped by department?**
  * **A:** Yes. Officers can submit adjustments only for categories mapped to their specific department, ensuring appropriate access controls.

---

# 17. Stock Ledger

## Business Purpose
Maintains an immutable, chronological, append-only transaction ledger for branch stock movements.

## User Flow
Managers, Officers, and Admins open `/stock/ledger` to inspect every single stock movement, deposit, withdrawal, or adjustment.

## Frontend Files
* `StockLedger.tsx` → Renders SKU chip selectors, branch balance sheets, and transaction logs.
* `StockLedger.css` → Handles visual styling.

## Backend Files
* `StockController.java` → Exposes stock ledger endpoints.
* `StockServiceImpl.java` → Fetches stock ledger logs.

## Database Tables
* `stock_ledger` → Immutable history table for stock movements.

## APIs Used
* `GET /api/stock/ledger/{branchId}/{stockItemId}` → Fetches stock ledger logs.

## Visual Components
* SKU pills showing live quantities.
* Color-coded ledger logs.
* Landscape print layout.

## Sorting / Filtering
* Filtered by Branch or Stock Item SKU.

## Viva Demonstration Flow
`Open Stock Ledger` ➔ `Select Branch` ➔ `Click SKU Pill` ➔ `GET .../ledger/{branch}/{sku}` ➔ `StockServiceImpl` ➔ `Populate Table`.

## Common Viva Questions
* **Q: What details are captured in a stock ledger entry?**
  * **A:** Each entry records the branch, stock item, transaction type (`TRANSFER_OUT`, `TRANSFER_IN`, `MANUAL_ADJUSTMENT`, `REVERSAL`), quantity, actor, timestamp, and a reference to the related transfer request or adjustment.

---

# 18. Audit Logging

## Business Purpose
Maintains an immutable audit trail for compliance purposes. Records every action, status transition, actor, IP address, and comment on every transfer request.

## User Flow
Admins and managers view audit logs on the transfer details screen, tracking the progress and history of each request.

## Frontend Files
* `TransferDetails.tsx` → Renders the workflow stepper and audit history log.

## Backend Files
* `AuditService.java` / `AuditServiceImpl.java` → Implements `logAction()`, appending logs for workflow actions.

## Database Tables
* `audit_logs` → Immutable log table mapping actors, actions, and states.

## APIs Used
* Logs are fetched as part of the `/api/transfers/{id}` detail response payload.

## Visual Components
* Chronological stepper timeline.
* Audit trail table (visible to System Admins only).

## Sorting / Filtering
* Ordered chronologically (newest entries first).

## Viva Demonstration Flow
`Workflow Action` ➔ `Service invokes AuditService.logAction()` ➔ `Appends row to audit_logs` ➔ `Loads in details view`.

## Common Viva Questions
* **Q: How does the system protect audit logs from modification?**
  * **A:** The `AuditLog` JPA entity is not exposed to update or delete endpoints in the controller layer. The table is append-only, and logs can only be created as a side effect of workflow actions.

---

# 19. Branch Management

## Business Purpose
Organizational structure management. Allows administrators to manage branch details and map department relationships.

## User Flow
Admins open `/admin/branches` to add branches, edit details, map department associations, or toggle active status.

## Frontend Files
* `BranchManagement.tsx` → Renders the branch list cards, search filters, and edit drawers.

## Backend Files
* `OrgManagementController.java` → Exposes branch CRUD endpoints.
* `ManagementServiceImpl.java` → Handles database operations for branches.

## Database Tables
* `branches` → Stores branch details (code, name, type, active status).
* `branch_departments` → Join table mapping departments to branches.

## APIs Used
* `GET/POST/PUT /api/admin/org/branches` → Manages branch details.

## Visual Components
* Branch summary cards showing code and active departments.
* Edit Form sliding drawer.

## Sorting / Filtering
* Search bar filters branches by code or name.

## Common Viva Questions
* **Q: What is the purpose of the branch_departments join table?**
  * **A:** It manages the many-to-many relationship between global departments and branches, determining which departments are active at each branch location.

---

# 20. Department Management

## Business Purpose
Organizational structure management. Allows administrators to define global departments and map them to branches.

## User Flow
Admins open `/admin/departments` to create departments and configure branch mappings.

## Frontend Files
* `DepartmentManagement.tsx` → Renders the department list, branch mapping controls, and edit dialogs.

## Backend Files
* `OrgManagementController.java` → Exposes department CRUD endpoints.
* `ManagementServiceImpl.java` → Handles database operations for departments.

## Database Tables
* `departments` → Stores department names.
* `branch_departments` → Join table mapping departments to branches.

## APIs Used
* `GET/POST/PUT /api/admin/org/departments` → Manages department details.

## Visual Components
* Department grid.
* Branch mapping dialogs.

## Sorting / Filtering
None.

---

# 21. User Management

## Business Purpose
Administrative security and access control. Allows administrators to manage user accounts, assign roles, and map users to branches and departments.

## User Flow
Admins open `/admin/users` to create user accounts, assign roles, edit details, or toggle active status.

## Frontend Files
* `UserManagement.tsx` → Renders the user list, search filters, and account edit forms.

## Backend Files
* `UserManagementController.java` → Exposes user CRUD endpoints.
* `ManagementServiceImpl.java` → Handles user creation, password hashing, and role assignment.

## Database Tables
* `users` → Stores user accounts and profile details.

## APIs Used
* `GET/POST/PUT /api/admin/users` → Manages user accounts.
* `PUT /api/admin/users/{userId}/toggle-active` → Activates or deactivates a user account.

## Visual Components
* User directory table.
* Account Edit forms.
* Custom error overlay banners for administrative actions (added in Conversation 92d3a6cd...).

## Sorting / Filtering
* Search and filter controls by role, branch, or active status.

## Common Viva Questions
* **Q: What happens to a deactivated user?**
  * **A:** Their `is_active` status is set to `false`, immediately blocking them from logging in, while preserving their historical audit logs and ledger records.

---

# 22. Item Category Management

## Business Purpose
Assets catalog management. Allows administrators to manage item categories, configure behavior types, and map department ownerships.

## User Flow
Admins open `/admin/items` to create categories, configure behavior types (CASH/STOCK/DOCUMENT_CASE), assign department mappings, and manage sensitivity levels.

## Frontend Files
* `ItemManagement.tsx` → Renders the category list, behavior selectors, and stock item panels.

## Backend Files
* `OrgManagementController.java` → Exposes category CRUD endpoints.
* `ManagementServiceImpl.java` → Handles category database operations.

## Database Tables
* `item_categories` → Stores category details (name, behavior type, sensitivity, department mapping).

## APIs Used
* `GET/POST/PUT /api/admin/org/items` → Manages item categories.
* `PUT /api/admin/org/items/{id}/toggle-active` → Toggles category active status.

## Visual Components
* Category grid showing behavior pill badges.
* Category Form edit drawer.

## Sorting / Filtering
None.

---

# 23. Stock Category Behavior System (CASH / STOCK / DOCUMENT_CASE)

## Business Purpose
Decouples catalog items from hard-coded workflow logic. The category behavior type dynamically triggers ledger updates, denomination checks, or stock selectors.

## User Flow
Choosing a category on the New Request form dynamically adjusts the layout (revealing cash fields for CASH, stock fields for STOCK, or standard fields for DOCUMENT_CASE).

## Frontend Files
* `NewTransfer.tsx` → Conditionally renders inputs based on category behavior.
* `TransferDetails.tsx` → Renders action panels based on behavior type validations.

## Backend Files
* `TransferServiceImpl.java` → Validates and applies behavior rules at workflow steps.
* `CategoryBehavior.java` → Enum class (CASH, STOCK, DOCUMENT_CASE).

## Database Tables
* `item_categories` → Stores the `behavior_type` configuration.

## APIs Used
None (Enforced across transfer workflows).

## Visual Components
* Behavior labels (Green for CASH, Blue for STOCK, Grey for DOCUMENT_CASE).

## Common Viva Questions
* **Q: What are the three behavior types and what do they trigger?**
  * **A:** 
    * `CASH`: Enables cash amount inputs, denomination spreadsheets, vault updates, and cash ledger records.
    * `STOCK`: Enables SKU selection, quantity inputs, branch inventory updates, and stock ledger records.
    * `DOCUMENT_CASE`: Standard workflow tracking only; bypasses ledger and balance updates.

---

# 24. Branch Directory

## Business Purpose
Facilitates internal communication. Allows managers to look up contact details and active departments for other branches.

## User Flow
A manager opens `/branch-directory` and searches for branches by name or region to view contact info and active departments.

## Frontend Files
* `BranchDirectory.tsx` → Renders the directory list, search filters, and details cards.
* `BranchDirectory.css` → Handles visual styling.

## Backend Files
* `UserController.java` → Exposes the branch directory endpoint.

## Database Tables
* `branches` → Resolves branch details.
* `departments` → Resolves department details.

## APIs Used
* `GET /api/users/branch-directory` → Returns details for active branches and departments.

## Visual Components
* Branch details cards (Address, Phone, Email).
* Department badge lists.

## Sorting / Filtering
* Search filters by branch name, code, district, or division.

---

# 25. Reports / Print Features

## Business Purpose
Generates physical documents and printable worksheets for audits and transfer verifications.

## User Flow
Users click "Print Slip" on a transfer details screen or "Print Ledger" on a ledger dashboard to generate a clean, print-formatted page.

## Frontend Files
* `TransferDetails.tsx` → Renders printable transfer slips.
* `CashLedger.tsx` / `StockLedger.tsx` → Renders printable ledger sheets.

## Visual Components
* Printable templates containing branch stamps, signatures, and transaction details.

## Common Viva Questions
* **Q: Did you use a PDF generator on the backend?**
  * **A:** No. The system uses a clean client-side approach with CSS print media queries (`@media print`), which hide sidebars and layouts to render print-optimized documents directly through the browser.

---

# 26. Role-Based Access Control

## Business Purpose
Ensures security and operational segregation of duties, restricting actions to authorized roles.

## User Flow
The user's role determines which sidebar links and action buttons are visible in the UI. Unauthorized requests are blocked on the backend.

## Frontend Files
* `Sidebar.tsx` → Controls menu visibility.
* `TransferDetails.tsx` → Controls button visibility based on role checks.

## Backend Files
* `UnauthorizedRoleException.java` → Handled by the global exception resolver.
* Service implementations enforce role checks.

## Database Tables
* `roles` → Stores role definitions.

## Common Viva Questions
* **Q: Is RBAC enforced only on the frontend?**
  * **A:** No. Frontend visibility controls are for user experience. The backend strictly enforces authorization at the service layer, validating user roles against allowed roles for each transition and throwing `UnauthorizedRoleException` if unauthorized.

---

# 27. Notification / Attention Required Widgets

## Business Purpose
Highlights outstanding actions for the user, preventing workflow bottlenecks.

## User Flow
On logging in, users review the "Attention Required" widget on their dashboard to see outstanding tasks.

## Frontend Files
* `Dashboard.tsx` → Fetches and renders the pending actions feed.

## Database Tables
* `transfer_requests` → Source for pending items.

## Visual Components
* Highlighted action alerts.
* Red pending item badges.

---

# 28. Lookup APIs

## Business Purpose
Provides public, read-only reference data to populate dropdown selectors throughout the application.

## User Flow
Form dropdown lists are dynamically populated using lookup endpoints.

## Frontend Files
* Form components invoke Axios requests to lookup URLs.

## Backend Files
* `LookupController.java` → Exposes lookup endpoints.

## APIs Used
* `GET /api/lookup/branches`
* `GET /api/lookup/departments`
* `GET /api/lookup/categories`
* `GET /api/lookup/stock-items/{categoryId}`
* `GET /api/lookup/users/delivery-persons/available`

---

# 29. Database Architecture

## Business Purpose
Maintains a clean, normalized relational database to organize user profiles, branch assets, and workflow history.

## Backend Files
* JPA Entity mappings in `model/entity/` map classes to database tables.
* `branchsync.sql` contains the complete schema and seed data.

## Database Tables
The system operates 15 tables:
* Core: `users`, `roles`, `branches`, `departments`, `branch_departments`, `item_categories`, `transfer_requests`, `audit_logs`.
* Cash: `branch_cash_balance`, `cash_ledger`, `cash_transfer_denominations`, `cash_manual_adjustments`.
* Stock: `stock_items`, `branch_stock_balance`, `stock_ledger`, `stock_manual_adjustments`.

---

# 30. Security Configuration

## Business Purpose
Hardens the Spring Boot API, manages request authentication, enables CORS, and validates passwords.

## Backend Files
* `SecurityConfig.java` → Configures HTTP security, stateless sessions, JWT filter binding, and endpoint permissions.
* `Sha256PasswordEncoder.java` → Hashing validator.

## Common Viva Questions
* **Q: Why does the system configure CORS?**
  * **A:** CORS configuration allows the frontend client (running on port `5173`) to make API requests to the backend server (running on port `8080`) securely.

---

## Complete Project File Map

### Frontend Files (`frontend/src/`)

#### Pages (`pages/`)
* `Login.tsx` → Handles user credentials input, toggles password visibility, and manages login requests.
* `Dashboard.tsx` → Renders the landing page containing welcome cards, pending action widgets, and active transfers.
* `NewTransfer.tsx` → Form to create a new inter-branch transfer request, adapting layouts based on selected behaviors.
* `TransferDetails.tsx` → Core page managing transfer details, process timelines, and workflow actions.
* `TransferHistory.tsx` → Searchable and filterable history grid of resolved transfers.
* `BranchDirectory.tsx` → Contact directory showing branch and department details.
* `Profile.tsx` → Profile manager showing user details and password modification controls.
* `CashLedger.tsx` → Displays branch vaults cash balances and transaction ledger logs.
* `ManualAdjustment.tsx` → Submission forms and manager approval cards for cash adjustments.
* `StockLedger.tsx` → Displays branch inventory levels, SKU cards, and stock ledger logs.
* `StockAdjustment.tsx` → Submission forms and manager approval cards for stock adjustments.
* `admin/BranchManagement.tsx` → Branch administrative manager.
* `admin/DepartmentManagement.tsx` → Department administrative manager.
* `admin/ItemManagement.tsx` → Category and stock item SKU administrative manager.
* `admin/UserManagement.tsx` → User profiles and permissions administrative manager.

#### Components (`components/`)
* `ProtectedRoute.tsx` → Authentication guard directing unauthorized traffic to the login screen.
* `Layout/Layout.tsx` → Main shell component binding sidebars, topbars, and page content areas.
* `Layout/Sidebar.tsx` → Navigation sidebar displaying menu options based on user roles.
* `Layout/Topbar.tsx` → Header component rendering user details and profile menus.

#### Contexts (`context/`)
* `AuthContext.tsx` → Maintains the global React authentication state, saving user profile data and tokens.

#### API configurations (`api/`)
* `axiosConfig.ts` → Configures Axios clients to attach JWT Bearer tokens and intercept session expirations.

#### Typings (`types/`)
* `transfer.ts` → Declares TypeScript typings for API responses.

#### Styling (`styles/`)
* `index.css` → Global style resets, typography rules, and utility classes.
* `variables.css` → Defines CSS custom properties for color palettes, shadow designs, and spacing scales.
* `App.css` → App-level layout resets.
* Per-page CSS files (e.g. `Login.css`, `Dashboard.css`, `NewTransfer.css`) provide isolated styles for specific screens.

---

### Backend Files (`backend/src/main/java/com/jamunabank/branchsync/`)

#### Controllers (`controller/`)
* `AuthController.java` → Processes employee logins and returns authentication tokens.
* `TransferController.java` → Manages the transfer request workflow state machine.
* `CashController.java` → Manages branch vault balances, denominations sheets, ledgers, and cash adjustments.
* `StockController.java` → Manages branch inventory, SKUs, ledgers, and stock adjustments.
* `LookupController.java` → Exposes reference data to populate frontend forms.
* `OrgManagementController.java` → Admin endpoints managing branches, departments, categories, and stock items.
* `UserManagementController.java` → Admin endpoints managing user accounts.
* `UserController.java` → Processes user profile queries and branch directories.

#### Services (`service/`)
* `TransferService.java` / `TransferServiceImpl.java` → Implements the transfer request state machine and workflow transitions.
* `CashService.java` / `CashServiceImpl.java` → Manages branch vault math, ledger logs, and cash adjustments.
* `StockService.java` / `StockServiceImpl.java` → Manages branch inventory counts, ledger logs, and stock adjustments.
* `AuditService.java` / `impl/AuditServiceImpl.java` → Appends audit trails for transfer request status updates.
* `ManagementService.java` / `impl/ManagementServiceImpl.java` → Administrative engine for organization details and user accounts.

#### Repositories (`repository/`)
* `UserRepository.java` → Accesses user account tables.
* `RoleRepository.java` → Accesses user role tables.
* `BranchRepository.java` → Accesses branch tables.
* `DepartmentRepository.java` → Accesses department tables.
* `ItemCategoryRepository.java` → Accesses item category tables.
* `TransferRequestRepository.java` → Accesses transfer request tables.
* `AuditLogRepository.java` → Accesses audit log tables.
* `BranchCashBalanceRepository.java` → Accesses live cash balance tables.
* `CashLedgerRepository.java` → Accesses cash ledger tables.
* `CashTransferDenominationRepository.java` → Accesses denomination breakdown tables.
* `CashManualAdjustmentRepository.java` → Accesses cash adjustment tables.
* `StockItemRepository.java` → Accesses stock SKU tables.
* `BranchStockBalanceRepository.java` → Accesses live stock quantity tables.
* `StockLedgerRepository.java` → Accesses stock ledger tables.
* `StockManualAdjustmentRepository.java` → Accesses stock adjustment tables.

#### Entities (`model/entity/`)
* `User.java` → Represents employee accounts.
* `Role.java` → Represents system role definitions.
* `Branch.java` → Represents bank branches.
* `Department.java` → Represents departments.
* `ItemCategory.java` → Represents asset categories.
* `TransferRequest.java` → Represents transfer requests.
* `AuditLog.java` → Represents workflow audit logs.
* `BranchCashBalance.java` → Represents live branch cash vaults.
* `CashLedgerEntry.java` → Represents vault transaction records.
* `CashTransferDenomination.java` → Represents note counts for cash transfers.
* `CashManualAdjustment.java` → Represents cash adjustments.
* `StockItem.java` → Represents stock inventory items (SKUs).
* `BranchStockBalance.java` → Represents live branch stock counts.
* `StockLedgerEntry.java` → Represents stock transaction records.
* `StockManualAdjustment.java` → Represents stock adjustments.

#### Enums (`model/enums/`)
* `BranchType.java` → Declares branch classifications (`HQ`, `AD_BRANCH`, `SUB_BRANCH`).
* `CategoryBehavior.java` → Declares category behavior types (`CASH`, `STOCK`, `DOCUMENT_CASE`).

#### Security (`security/`)
* `SecurityConfig.java` → Configures HTTP security, stateless sessions, JWT filter bindings, and path permissions.
* `JwtUtils.java` → Generates, decodes, and validates JWT authentication tokens.
* `JwtAuthenticationFilter.java` → Intercepts calls to validate JWT signatures and populate the SecurityContext.
* `CustomUserDetailsService.java` → Loads user details from database by Employee ID.
* `CustomUserDetails.java` → Wraps user details for use by Spring Security.
* `Sha256PasswordEncoder.java` → Hashing validator matching credentials.

#### DTOs (`dto/`)
* `LoginRequestDto.java` & `JwtResponseDto.java` → Models authentication exchange payloads.
* `InitiateTransferRequestDto.java` → Models request creation data.
* `ApprovalRequestDto.java` → Models internal approval decisions.
* `VerificationRequestDto.java` → Models HQ verification decisions and destination mappings.
* `CompletionRequestDto.java` → Models recipient acceptance or rejection decisions.
* `CreateUserDto.java` / `CreateBranchDto.java` / `CreateDepartmentDto.java` / `CreateItemCategoryDto.java` → Models administrative creation payloads.
* `TransferResponseDto.java` → Models lightweight transfer items for dashboard tables.
* `TransferDetailDto.java` → Models complete transfer details and workflow records.
* `AuditLogResponseDto.java` → Models audit log entries.
* `ErrorResponse.java` → Models standardized error messages.

#### Exceptions & Mappers (`exception/` & `mapper/`)
* `GlobalExceptionHandler.java` → Intercepts runtime exceptions, returning standardized JSON error payloads.
* `ResourceNotFoundException.java` → 404 error handler.
* `UnauthorizedRoleException.java` → 403 error handler.
* `BusinessRuleViolationException.java` → 400 error handler.
* `TransferMapper.java` → Maps between transfer request entities and response DTOs.

---

## Defense Quick Navigation Guide

If an examiner asks about a specific feature, use this quick-reference guide to open the correct files immediately:

### 1. Cash Adjustments
* **Frontend**: `ManualAdjustment.tsx` (Line 1: submit form & pending approvals)
* **Controller**: `CashController.java` (Line 1: submit/decide endpoints)
* **Service**: `CashServiceImpl.java` (Line 1: `submitAdjustment()`, `decideAdjustment()`)
* **Entity**: `CashManualAdjustment.java` (JPA Entity class)
* **Table**: `cash_manual_adjustments` (Relational table)

### 2. HQ Routing & Destination Mapping
* **Frontend**: `TransferDetails.tsx` (Look for `VerificationRequestDto` and `handleHqVerify`)
* **Controller**: `TransferController.java` (Look for `hqVerify` mapping)
* **Service**: `TransferServiceImpl.java` (Look for `hqVerify()` method)
* **Entity**: `TransferRequest.java` (Fields: `destinationBranch`, `destinationDepartment`)
* **Table**: `transfer_requests` (Columns: `destination_branch_id`, `destination_department_id`)

### 3. Stock Category Behavior (CASH / STOCK / DOCUMENT_CASE)
* **Frontend**: `NewTransfer.tsx` (Conditionally renders cash/stock inputs)
* **Controller**: `TransferController.java` (Maps transfer CRUD)
* **Service**: `TransferServiceImpl.java` (Look for `isCashBehavior` and `isStockBehavior` helpers)
* **Entity**: `ItemCategory.java` (Field: `CategoryBehavior behaviorType`)
* **Table**: `item_categories` (Column: `behavior_type`)

### 4. Cash Vault Note Denominations
* **Frontend**: `TransferDetails.tsx` (Look for `Denomination Grid` and `POST /api/cash/denominations`)
* **Controller**: `CashController.java` (Look for `saveDenominations` mapping)
* **Service**: `CashServiceImpl.java` (Look for `saveDenominations()` method)
* **Entity**: `CashTransferDenomination.java` (JPA Entity class)
* **Table**: `cash_transfer_denominations` (Relational table)

### 5. Stock Inventory SKU Levels & Ledger
* **Frontend**: `StockLedger.tsx` (Main view)
* **Controller**: `StockController.java` (Exposes balances/ledgers)
* **Service**: `StockServiceImpl.java` (Manages stock movements and ledger logging)
* **Entity**: `StockLedgerEntry.java` & `BranchStockBalance.java` (JPA Entity classes)
* **Table**: `stock_ledger` & `branch_stock_balance` (Relational tables)

### 6. Security & JWT Validation
* **Backend Security Configuration**: `SecurityConfig.java` (Spring Security settings)
* **Request Interceptor Filter**: `JwtAuthenticationFilter.java` (Intercepts and checks tokens)
* **Credentials Encoder**: `Sha256PasswordEncoder.java` (SHA-256 validator)
* **Token Utility Component**: `JwtUtils.java` (Generates/verifies tokens)
