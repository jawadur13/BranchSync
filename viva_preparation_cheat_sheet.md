# 🎓 Jamuna Bank BranchSync — Viva Defense & Presentation Cheat Sheet

This guide provides a comprehensive individual breakdown of all critical project files and lists five highly probable, high-scoring technical viva questions along with clear, robust answers that reference the actual implementation logic of your project.

---

## 📂 Section 1: Backend Files Guide (Core Business & Security Logic)

### ⚙️ 1. Service Layer Implementation (`service/impl/*`)
This folder houses the core business logic of BranchSync. It is decoupled from the controllers via interfaces to support clean architectural boundaries (dependency inversion).

* **`TransferServiceImpl.java` (The State Machine):**
  * **Role:** Manages the entire multi-step transfer workflow lifecycle for both cash and inventory (requisitions).
  * **Core Tasks:** Defines state transitions: `initiateTransfer` ➔ `approveInternal` ➔ `hqVerify` ➔ `acceptAndAssignDriver` ➔ `releaseFinal` ➔ `markPickedUp` (debits the sender) ➔ `markDelivered` (credits the receiver) ➔ `closeRequest` (commits completion or triggers reversal if rejected).
* **`StockServiceImpl.java` (Inventory Tracker):**
  * **Role:** Performs double-entry inventory ledger logging and tracks current asset levels.
  * **Core Tasks:** Tracks balances inside `StockBalance` tables, handles item level modifications via manual adjustments, and writes transaction logs using the audit trail mechanism.
* **`CashServiceImpl.java` (Vault & Cash Ledger):**
  * **Role:** Controls physical vault cash balances and safe levels with custom Bangladesh Bank denomination breakdowns (e.g., ৳1000, ৳500, ৳100).
  * **Core Tasks:** Records incoming (`recordTransferIn`) and outgoing (`recordTransferOut`) physical cash movements, validates vault limits, and stores active denominations.
* **`AuditServiceImpl.java` (Operational Transparency):**
  * **Role:** Automatically tracks actions taken on transfer requests for audit trails.
  * **Core Tasks:** Captures the actor's name, timestamp, action type (e.g., APPROVED, REJECTED), old status, new status, and IP address, saving it to `TransferAuditLog`.
* **`ManagementServiceImpl.java` (User & Organization Admin):**
  * **Role:** Admin administrative operations.
  * **Core Tasks:** Oversees user creation, roles assignment, department configurations, and branch creation.

---

### 🛡️ 2. Security Layer (`security/*`)
Secures all API endpoints and enforces Role-Based Access Control (RBAC).

* **`SecurityConfig.java`:**
  * **Role:** Central Spring Security Configuration.
  * **Core Tasks:** Configures CORS, disables CSRF (since we use stateless JWT), declares endpoint path access parameters (e.g., admin-only vs public routes), and inserts the custom JWT filter into the Spring Security filter chain.
* **`JwtAuthenticationFilter.java`:**
  * **Role:** Stateless HTTP Request Interceptor.
  * **Core Tasks:** Inspects the `Authorization` header of every incoming request, extracts the JWT Bearer token, validates it against `JwtUtils`, loads user authorities, and binds them to the security context holder.
* **`JwtUtils.java`:**
  * **Role:** Cryptographic JWT Utility helper.
  * **Core Tasks:** Generates tokens with custom claims (User roles, Branch ID, Department ID) upon successful login, and parses/verifies tokens using a HMAC-SHA signing key.
* **`Sha256PasswordEncoder.java`:**
  * **Role:** Secure hashing utility.
  * **Core Tasks:** Hashes plaintext user passwords using SHA-256 algorithm with a Salt before database insertion.
* **`PasswordEncodingRunner.java`:**
  * **Role:** Utility runner executed at application startup to encrypt legacy plaintext credentials in the database.

---

## 📂 Section 2: Frontend Pages Guide (`frontend/src/pages/*`)
Defines the visual user experience, built with React and TypeScript.

* **`TransferDetails.tsx` (Your Active File — The Operations Hub):**
  * **Role:** Displays a single transfer request's details, dynamic progress visualizers, and state-specific action buttons.
  * **Core Tasks:** Houses sub-modules for denomination breakdown logging, status tracking, approval buttons, and driver assignments.
* **`StockLedger.tsx`:**
  * **Role:** Shows current balances of branch items and lists their chronological transactional logs.
  * **Core Tasks:** Allows users to filter inventory by department, search items, and generate formatted PDF receipts.
* **`Dashboard.tsx`:**
  * **Role:** The starting page displaying system summaries and active request counts.
  * **Core Tasks:** Displays quick-glance visual widgets (e.g., items in transit, pending approvals) tailored to the logged-in user's role.
* **`NewTransfer.tsx`:**
  * **Role:** Interactive form to request assets or cash from another branch.
  * **Core Tasks:** Dynamically validates quantities against remote balances and requests approvals.
* **`Login.tsx`:**
  * **Role:** Secures entry point.
  * **Core Tasks:** Authenticates user credentials, sets the received JWT in headers, and logs users in using `AuthContext`.
* **`TransferHistory.tsx`:**
  * **Role:** Searchable datatable listing past transactions.
* **`BranchDirectory.tsx`:**
  * **Role:** Network-wide overview showing branches, addresses, and contacts.
* **`ManualAdjustment.tsx` & `StockAdjustment.tsx`:**
  * **Role:** System admin controls to manually rectify inventory count anomalies.
* **`CashLedger.tsx`:**
  * **Role:** View vault and safe reserves.

---

## 🎯 Section 3: High-Scoring Viva Questions & Code References

Use these structured answers to demonstrate deep mastery of your project code.

### ❓ Question 1: "Where does the transfer workflow logic live, and how do you ensure integrity during transitions?"
> **💡 Key Answer:**
> "The core workflow transitions are implemented in **`TransferServiceImpl.java`** using Spring's **`@Transactional`** annotation on methods like `initiateTransfer()`, `markPickedUp()`, and `markDelivered()`. 
> 
> Using `@Transactional` guarantees **ACID compliance**. If any step fails (e.g., a database connection drops while updating stock counts), the entire transaction rolls back, preventing double-debits or orphaned transfers. 
> 
> *Code Location Reference:* [TransferServiceImpl.java](file:///d:/Projects/BranchSync/backend/src/main/java/com/jamunabank/branchsync/service/impl/TransferServiceImpl.java#L38-L68)."

---

### ❓ Question 2: "How is security configured in your system, and how do you protect API endpoints?"
> **💡 Key Answer:**
> "Our security architecture is built on a custom stateless implementation using **Spring Security** and **JWT (JSON Web Tokens)**.
> 1. In **`SecurityConfig.java`**, we define which endpoints are public (like `/auth/login`) and which require authorization, and inject our custom filter.
> 2. On every incoming request, **`JwtAuthenticationFilter.java`** intercepts the HTTP call, extracts the token from the `Authorization: Bearer <token>` header, parses the user's role and branch details via **`JwtUtils.java`**, and establishes the security context if valid.
> 
> *Code Location Reference:* [SecurityConfig.java](file:///d:/Projects/BranchSync/backend/src/main/java/com/jamunabank/branchsync/security/SecurityConfig.java) and [JwtAuthenticationFilter.java](file:///d:/Projects/BranchSync/backend/src/main/java/com/jamunabank/branchsync/security/JwtAuthenticationFilter.java)."

---

### ❓ Question 3: "What is 'double-entry ledger logic' in your project, and how are quantities modified when items move?"
> **💡 Key Answer:**
> "To prevent discrepancies, inventory is never just 'incremented' or 'decremented' in isolation. When an item is marked as **Picked Up** or **Delivered** in `TransferServiceImpl.java`:
> 1. During **Pickup** (`markPickedUp`), the sending branch is debited via `stockService.recordTransferOut()` which logs a negative ledger balance entry.
> 2. During **Delivery** (`markDelivered`), the receiving branch is credited via `stockService.recordTransferIn()` which logs a positive ledger balance entry.
> 
> *Code Location Reference:* Inside [TransferServiceImpl.java](file:///d:/Projects/BranchSync/backend/src/main/java/com/jamunabank/branchsync/service/impl/TransferServiceImpl.java#L344-L364) (for outgoing debit) and [TransferServiceImpl.java](file:///d:/Projects/BranchSync/backend/src/main/java/com/jamunabank/branchsync/service/impl/TransferServiceImpl.java#L389-L408) (for incoming credit)."

---

### ❓ Question 4: "What happens if a driver delivers the items, but the receiving branch rejects the transfer on receipt? how does your code handle this?"
> **💡 Key Answer:**
> "This is handled by our **Reversal Logic** inside the `closeRequest()` method of `TransferServiceImpl.java` when the `accepted` flag is passed as `false` (status becomes `REJECTED_ON_RECEIPT`). 
> 
> The system automatically triggers opposite double-entry corrections:
> 1. The receiving branch (origin branch) loses the items back via `stockService.recordReversal(..., "OUT")`.
> 2. The sending branch (destination branch) receives its items back via `stockService.recordReversal(..., "IN")`.
> 
> This ensures that physical assets are never lost in transit or mathematically unaccounted for if a delivery is declined at the destination.
> 
> *Code Location Reference:* [TransferServiceImpl.java](file:///d:/Projects/BranchSync/backend/src/main/java/com/jamunabank/branchsync/service/impl/TransferServiceImpl.java#L445-L467)."

---

### ❓ Question 5: "On the frontend, how do you handle routing security and ensure that users cannot bypass login?"
> **💡 Key Answer:**
> "We protect frontend routes using a React higher-order wrapper component called **`ProtectedRoute.tsx`**. 
> 
> It checks if a valid authenticated user object exists in our React context (`useAuth()`). If the user is authenticated, it renders the page; otherwise, it redirects the browser back to `/login` using the `<Navigate />` element from `react-router-dom`, preserving the intended destination for seamless re-routing post-login.
> 
> *Code Location Reference:* [ProtectedRoute.tsx](file:///d:/Projects/BranchSync/frontend/src/components/ProtectedRoute.tsx)."
