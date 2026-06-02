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

## 🎯 Section 3: Visual Page-to-Code Point & Answer Viva Questions

Use these structured answers when the examination board points to a specific visual element on the screen and asks, **"How is this coming, and which part of the code is handling this logic?"**

---

### ❓ Question 1 (Dashboard Page Welcome Banner)
**Examiner points to:** The greeting message (e.g., *"Good Evening, jawadur13!"*) inside the welcome banner.
> **Board asks:** *"How does the system dynamically know whether to say 'Good Morning', 'Good Afternoon', or 'Good Evening'? Where is the code logic handling this greeting message?"*
>
> **💡 How you answer:**
> "This message is determined client-side in the React component. It uses the standard JavaScript `new Date()` API inside the helper function **`getGreeting()`** to fetch the current hour of the user's system.
> 
> * **If it's before 12:00 PM**, it returns `'Good Morning'`.
> * **If it's between 12:00 PM and 5:00 PM (17:00)**, it returns `'Good Afternoon'`.
> * **Otherwise**, it defaults to `'Good Evening'`.
> 
> *Code Location Reference:* [Dashboard.tsx:L72-77](file:///d:/Projects/BranchSync/frontend/src/pages/Dashboard.tsx#L72-L77)."

---

### ❓ Question 2 (Dashboard Page Attention Widget)
**Examiner points to:** The list of items inside the "Attention Required" widget on the dashboard.
> **Board asks:** *"How does the system decide which transfers show up in this 'Attention Required' widget? Where is the code determining if a request requires immediate action?"*
>
> **💡 How you answer:**
> "The dashboard filters the retrieved list of transfers using the helper function **`isActionable()`** on the frontend. This function checks the logged-in user's role and evaluates it against the transfer's status:
> 
> 1. If the user is `HQ_LOGISTICS_OFFICER` and status is `'PENDING_HQ_APPROVAL'`.
> 2. If the user is a `BRANCH_MANAGER` / `OPERATION_MANAGER` and status is `'PENDING_INTERNAL'` or `'PENDING_FINAL_RELEASE'`.
> 3. If the user is a branch `OFFICER` and status is `'PENDING_ASSIGNMENT'`.
> 4. If the user is a `DELIVERY_PERSON` and status is `'READY_FOR_PICKUP'` or `'IN_TRANSIT'`.
> 5. If the transfer is `'DELIVERED'` and the user is the original initiator (requester) who needs to close/acknowledge receipt.
> 
> *Code Location Reference:* [Dashboard.tsx:L79-94](file:///d:/Projects/BranchSync/frontend/src/pages/Dashboard.tsx#L79-L94)."

---

### ❓ Question 3 (Stock Ledger Page Totals)
**Examiner points to:** The total count badge inside the "All Items" selection pill on the Stock Ledger page.
> **Board asks:** *"How does the system dynamically sum the total counts of all assets currently listed on this page? Where is this calculated?"*
>
> **💡 How you answer:**
> "On the frontend, rather than making a separate API call to sum the inventory, we dynamically calculate it from the loaded `balances` array using the JavaScript **`.reduce()`** array method. 
> 
> It iterates through the loaded balances and aggregates the `currentQuantity` property to display the live cumulative total count of items in the branch.
> 
> *Code Location Reference:* [StockLedger.tsx:L467](file:///d:/Projects/BranchSync/frontend/src/pages/StockLedger.tsx#L467)."

---

### ❓ Question 4 (Transfer Details Page Cash Breakdown Validation)
**Examiner points to:** The dynamic denomination breakdown panel (with inputs for ৳1000, ৳500 etc.) and the warning message: *'⚠ Must equal ৳[Amount]'*.
> **Board asks:** *"How does the system calculate the live Total sum of the entered cash denominations and validate that it matches the original requested amount? Where is this code?"*
>
> **💡 How you answer:**
> "Inside **`TransferDetails.tsx`**, the live total is calculated dynamically on every input change by mapping over our `DENOMINATION_TYPES` array and running a **`.reduce()`** accumulator over the state variables `denomQtys`:
> 
> `DENOMINATION_TYPES.reduce((sum, d) => sum + (denomQtys[d] || 0) * d, 0)`
> 
> The system then compares this dynamic sum with the `transfer.requestedAmount`. If they do not match, it conditionally renders the validation warning text in red.
> 
> *Code Location Reference:* [TransferDetails.tsx:L976-981](file:///d:/Projects/BranchSync/frontend/src/pages/TransferDetails.tsx#L976-L981)."

---

### ❓ Question 5 (Transfer Details Page Action Button Text)
**Examiner points to:** The action button under the denominations that displays either *'Save Denomination Breakdown'* or *'Update Denomination Breakdown'*.
> **Board asks:** *"How does this button know whether to say 'Save' or 'Update'? Where is this UI state toggled inside the code?"*
>
> **💡 How you answer:**
> "The text content of the button is controlled dynamically using a ternary expression that evaluates the boolean flag **`transfer.denominationsSubmitted`** returned by our backend:
> 
> `transfer.denominationsSubmitted ? '✅ Update Denomination Breakdown' : '💾 Save Denomination Breakdown'`
> 
> If the backend database confirms that a breakdown was already submitted for this requisition, the button automatically swaps its state to 'Update' mode.
> 
> *Code Location Reference:* [TransferDetails.tsx:L988](file:///d:/Projects/BranchSync/frontend/src/pages/TransferDetails.tsx#L988)."

---

### ❓ Question 6 (New Transfer Page Cash Amount Box)
**Examiner points to:** The 💵 Amount Requested (৳) input box in the New Transfer Form.
> **Board asks:** *"When we select Cash and hover over this box, we can scroll the mouse wheel up/down or press arrow keys to change the numbers. Where in the code is this scroll and arrow logic configured?"*
>
> **💡 How you answer:**
> "This up/down scrolling and keyboard arrow behavior is a **native HTML5 browser behavior** enabled by setting the input element's type attribute to **`"number"`** (`type="number"`).
> 
> The code binds this input to our React state variable `requestedAmount` via the **`onChange`** event handler, which intercepts any visual interaction (typing, scrolling, or clicking the spinner arrows) and calls `setRequestedAmount(e.target.value)`.
> 
> *Code Location Reference:* [NewTransfer.tsx:L253-263](file:///d:/Projects/BranchSync/frontend/src/pages/NewTransfer.tsx#L253-L263)."
