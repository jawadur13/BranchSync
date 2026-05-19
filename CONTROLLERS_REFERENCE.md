# BranchSync — Backend Controllers Reference
### Detailed breakdown of every controller in the system

**Location:** `backend/src/main/java/com/jamunabank/branchsync/controller/`

All controllers are annotated with `@RestController` and operate under the base URL `/api/`.
Every endpoint except `/api/auth/login` requires a valid **JWT token** in the `Authorization: Bearer <token>` header.

---

## 1. `AuthController.java`
**Base URL:** `/api/auth`

The **entry point** of the entire application. This is the only controller that is publicly accessible without authentication. It handles employee login and issues the JWT token that every other request depends on.

### How Login Works (Step by Step)
1. The frontend sends a `POST` request with `{ "employeeId": "EMP001", "password": "..." }`
2. Spring Security's `AuthenticationManager` checks the credentials against the database
3. If valid, `JwtUtils.generateJwtToken()` creates a signed JWT token
4. The controller then fetches the full `User` entity to also return the employee's **full name**
5. Returns the token + all user identity info in a single `JwtResponseDto`

### Endpoints

| Method | URL | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate an employee and receive a JWT token |

### What gets returned on successful login
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "type": "Bearer",
  "userId": 4,
  "employeeId": "EMP007",
  "fullName": "Jawad Rahman",
  "role": "BRANCH_MANAGER",
  "branchId": 2,
  "departmentId": 5
}
```
The frontend stores this response in `AuthContext` and attaches the token to every future API call automatically via the Axios interceptor.

### Classes Used
- `AuthenticationManager` — Spring Security's credential validator
- `JwtUtils` — Custom class that signs and generates JWT tokens
- `CustomUserDetails` — Wraps the authenticated user's identity (userId, branchId, departmentId, role)
- `UserRepository` — Used to fetch the full name, which is not stored in the security principal
- `LoginRequestDto` — Input DTO: `{ employeeId, password }`
- `JwtResponseDto` — Output DTO: `{ token, type, userId, employeeId, fullName, role, branchId, departmentId }`

---

## 2. `TransferController.java`
**Base URL:** `/api/transfers`

This is the **largest and most critical controller** in the system. It manages the entire lifecycle of a transfer request — from creation through every approval step to final closure. It also enforces **role-based data scoping** on every response.

### Architecture Note
The controller delegates all business logic to `TransferService` / `TransferServiceImpl`. The controller itself only: extracts the authenticated user's ID from the JWT context, calls the appropriate service method, and maps the returned entity to a DTO for the response.

---

### GET `/api/transfers` — Dashboard Transfers
- **Who calls it:** Every logged-in user when they open the Dashboard
- **What it does:** Returns a list of **active (not yet completed)** transfer requests scoped to the logged-in user's context
- **Scoping:** The `TransferService.getDashboardTransfers()` method applies role-based filtering:
  - `OFFICER` → only their own initiated transfers
  - `BRANCH_MANAGER` → all transfers involving their branch
  - `HQ_LOGISTICS_OFFICER` → all transfers awaiting HQ approval
  - `DELIVERY_PERSON` → transfers assigned to them
  - `SYSTEM_ADMIN` → all transfers
- **Returns:** `List<TransferResponseDto>`

---

### GET `/api/transfers/history` — Transfer History
- **Who calls it:** Every logged-in user from the History page
- **What it does:** Returns **completed/closed** transfers scoped to the user's role
- **Difference from Dashboard:** Returns finished transfers (COMPLETED, REJECTED, CANCELLED) instead of active ones
- **Returns:** `List<TransferResponseDto>`

---

### GET `/api/transfers/{requestId}` — Single Transfer Detail
- **Who calls it:** Any user clicking "View" on a transfer
- **What it does:** Returns the **full detail** of one transfer, including all metadata and the audit log trail
- **Key Feature — Audit Log Scoping:** This endpoint contains complex role-based logic that controls which audit log entries each role is allowed to see:

| Role | Audit Logs Visible |
|---|---|
| `SYSTEM_ADMIN` | ✅ All audit log entries |
| `HQ_LOGISTICS_OFFICER` | ✅ All audit log entries |
| `BRANCH_MANAGER` / `OPERATION_MANAGER` / `FIRST_EXECUTIVE_OFFICER` | ✅ All entries — **only if the transfer involves their branch** (origin or destination) |
| `OFFICER` | ✅ All entries — **only if the transfer's origin or destination matches their branch AND department** |
| `DELIVERY_PERSON` | ⚠️ Only 5 specific log actions: `ASSIGNED_DRIVER`, `PICKED_UP`, `DELIVERED`, `COMPLETED`, `REJECTED` — and only if they are the assigned driver |

- **Returns:** `TransferDetailDto` (full object including `auditLogs[]`)

---

### POST `/api/transfers` — Create New Transfer (Step 0)
- **Who calls it:** Officers, Managers (anyone who can initiate)
- **What it does:** Creates a brand-new transfer request in `PENDING_INTERNAL` status
- **Request Body** (`InitiateTransferRequestDto`):
  ```json
  {
    "title": "Monthly Cash Settlement",
    "description": "...",
    "categoryId": 3,
    "priority": "HIGH",
    "destinationBranchId": 5,
    "destinationDepartmentId": 2
  }
  ```
- **What the service does behind the scenes:**
  - Auto-assigns `originBranchId` from the logged-in user's session (cannot be faked)
  - Auto-generates a unique `requestCode` (e.g., `REQ-00042`)
  - Sets initial status to `PENDING_INTERNAL`
  - Writes the first audit log entry: `INITIATED`
- **Returns:** `TransferResponseDto` with HTTP `201 Created`

---

### POST `/api/transfers/{requestId}/approve-internal` — Branch Manager Approves (Step 1)
- **Who calls it:** `BRANCH_MANAGER`, `OPERATION_MANAGER`, `FIRST_EXECUTIVE_OFFICER`
- **What it does:** The origin branch manager reviews and approves the transfer internally
- **Status transition:** `PENDING_INTERNAL` → `PENDING_HQ_APPROVAL`
- **Audit log written:** `APPROVED_BY_MANAGER`
- **Returns:** Updated `TransferResponseDto`

---

### POST `/api/transfers/{requestId}/reject-internal` — Branch Manager Rejects (Step 1 Reject)
- **Who calls it:** `BRANCH_MANAGER`, `OPERATION_MANAGER`, `FIRST_EXECUTIVE_OFFICER`
- **What it does:** The origin branch manager rejects the transfer request locally before it goes to HQ
- **Request Body:**
  ```json
  { "rejectionNote": "Required documents are missing from this package." }
  ```
- **Status transition:** `PENDING_INTERNAL` → `REJECTED_BY_MANAGER` (Terminated state)
- **Audit log written:** `REJECTED_INTERNAL`
- **Returns:** Updated `TransferResponseDto`

---

### POST `/api/transfers/{requestId}/hq-verify` — HQ Officer Decision & Destination Allocation (HQ Step)
- **Who calls it:** `HQ_LOGISTICS_OFFICER`
- **What it does:** The Central Logistics Control officer at HQ reviews the transfer, allocates the final destination branch and department, and either approves or rejects it.
- **Request Body (Approved):**
  ```json
  {
    "approved": true,
    "rejectionNote": null,
    "destinationBranchId": 5,
    "destinationDepartmentId": 2
  }
  ```
- **Request Body (Rejected):**
  ```json
  {
    "approved": false,
    "rejectionNote": "Items exceed weight limit policy",
    "destinationBranchId": null,
    "destinationDepartmentId": null
  }
  ```
- **Status transitions:**
  - Approved → `PENDING_ASSIGNMENT` (with destination branch & department assigned to the request)
  - Rejected → `REJECTED_BY_HQ`
- **Audit logs written:** `APPROVED_BY_HQ` or `REJECTED_BY_HQ`
- **Returns:** Updated `TransferResponseDto`

---

### POST `/api/transfers/{requestId}/accept` — Assign Delivery Person (Step 2)
- **Who calls it:** Branch Manager (destination side)
- **What it does:** Accepts the incoming transfer and assigns a specific delivery person to it
- **Request Body:**
  ```json
  { "deliveryPersonId": 12 }
  ```
- **Status transition:** `PENDING_ASSIGNMENT` → `READY_FOR_PICKUP`
- **Audit log written:** `ASSIGNED_DRIVER`
- **Returns:** Updated `TransferResponseDto`

---

### POST `/api/transfers/{requestId}/reject-destination` — Destination Branch Rejects/Declines Routing (Step 2 Decline)
- **Who calls it:** Branch Manager / Operations Staff at the destination branch
- **What it does:** Rejects/declines routing to this branch, clearing the routing and sending the request back to HQ for re-routing.
- **Request Body:**
  ```json
  { "rejectionNote": "This department doesn't have the storage capacity for these items right now." }
  ```
- **Status transition:** `PENDING_ASSIGNMENT` → `PENDING_HQ_APPROVAL` (resets destinationBranch & destinationDepartment to null)
- **Audit log written:** `DESTINATION_REJECTED`
- **Returns:** Updated `TransferResponseDto`

---

### POST `/api/transfers/{requestId}/release` — Final Release (Step 3)
- **Who calls it:** Branch Manager (gives the green light for physical pickup)
- **What it does:** Authorizes the physical release of the item for the courier to collect
- **Status transition:** `PENDING_FINAL_RELEASE` → `READY_FOR_PICKUP`
- **Audit log written:** `RELEASED`
- **Returns:** Updated `TransferResponseDto`

---

### POST `/api/transfers/{requestId}/reject-release` — Destination Manager Rejects Final Release (Step 3 Decline)
- **Who calls it:** Branch Manager / Operations Staff at the destination branch
- **What it does:** Rejects/declines routing at the final release stage, clearing the routing/department/acceptor/courier assignments and sending the request back to HQ for re-routing.
- **Request Body:**
  ```json
  { "rejectionNote": "Incorrect package type received for storage." }
  ```
- **Status transition:** `PENDING_FINAL_RELEASE` → `PENDING_HQ_APPROVAL` (resets destinationBranch, destinationDepartment, deptAcceptor, and deliveryPerson to null)
- **Audit log written:** `RELEASE_REJECTED`
- **Returns:** Updated `TransferResponseDto`

---

### POST `/api/transfers/{requestId}/pickup` — Driver Picks Up (Step 4)
- **Who calls it:** `DELIVERY_PERSON` assigned to this transfer
- **What it does:** The delivery person confirms they have physically collected the item from the branch
- **Status transition:** `READY_FOR_PICKUP` → `IN_TRANSIT`
- **Sets:** `pickedUpAt` timestamp on the record
- **Audit log written:** `PICKED_UP`
- **Returns:** Updated `TransferResponseDto`

---

### POST `/api/transfers/{requestId}/deliver` — Driver Delivers (Step 5)
- **Who calls it:** `DELIVERY_PERSON` assigned to this transfer
- **What it does:** The delivery person confirms successful delivery to the destination branch
- **Status transition:** `IN_TRANSIT` → `DELIVERED`
- **Sets:** `deliveredAt` timestamp on the record
- **Audit log written:** `DELIVERED`
- **Returns:** Updated `TransferResponseDto`

---

### POST `/api/transfers/{requestId}/close` — Final Confirmation (Step 6)
- **Who calls it:** The original requester (the `OFFICER` who created the transfer)
- **What it does:** The requester confirms they received the delivery (or rejects it if something is wrong)
- **Request Body:**
  ```json
  { "accepted": true, "finalNote": "Received in good condition" }
  ```
  or
  ```json
  { "accepted": false, "finalNote": "Package was damaged on arrival" }
  ```
- **Status transitions:**
  - Accepted → `COMPLETED`
  - Rejected → `REJECTED_ON_RECEIPT`
- **Sets:** `closedAt` timestamp, `finalNote` on the record
- **Audit logs written:** `COMPLETED` or `REJECTED_ON_RECEIPT`
- **Returns:** Updated `TransferResponseDto`

### Private Helper Method
```java
private Long getUserId(Authentication auth) {
    return ((CustomUserDetails) auth.getPrincipal()).getUserId();
}
```
This is called at the start of every endpoint to safely extract the currently authenticated user's database ID from the JWT context, without needing to query the database again.

---

## 3. `UserController.java`
**Base URL:** `/api/users`

Handles personal user-facing features — viewing one's own profile and fetching the branch staff directory for managers.

### Endpoints

#### GET `/api/users/profile` — View My Profile
- **Who calls it:** Any authenticated user from the Profile page
- **What it does:** Fetches the full `User` entity from the database using the authenticated user's ID and returns it as a flat map
- **Returns:**
  ```json
  {
    "userId": 4,
    "employeeId": "EMP007",
    "fullName": "Jawad Rahman",
    "email": "jawad@jamunabank.com",
    "phoneNumber": "01711-000000",
    "roleName": "BRANCH_MANAGER",
    "branchName": "Gulshan Branch",
    "branchCode": "GLB-001",
    "departmentName": "Operations",
    "isActive": true,
    "createdAt": "2025-01-15T10:30:00"
  }
  ```

#### GET `/api/users/branch-directory` — Branch Staff Directory
- **Who calls it:** `BRANCH_MANAGER`, `OPERATION_MANAGER`, `FIRST_EXECUTIVE_OFFICER` from the Branch Directory page
- **What it does:**
  1. Identifies the logged-in user's `branchId` from their session
  2. Calls `userRepository.findAll()` and **filters in Java** to only return users whose `branch.branchId` matches
  3. If the user has no branch assigned, returns an empty list safely
- **Security:** Scoping is done server-side — a manager cannot manipulate this to see another branch's staff
- **Returns:** List of staff objects: `userId, employeeId, fullName, email, phoneNumber, roleName, departmentName, isActive`

---

## 4. `UserManagementController.java`
**Base URL:** `/api/admin/users`

The SYSTEM_ADMIN's control panel for managing all user accounts in the system. This is a protected admin-only resource.

### Endpoints

#### GET `/api/admin/users` — List All Users
- **Who calls it:** `SYSTEM_ADMIN` from the User Management admin page
- **What it does:** Fetches all users from the database via `ManagementService.getAllUsers()`
- **Returns:** Full list of all users with: `userId, employeeId, fullName, email, phoneNumber, roleName, roleId, branchName, branchId, departmentName, departmentId, isActive, createdAt`

#### POST `/api/admin/users` — Create New User
- **Who calls it:** `SYSTEM_ADMIN`
- **What it does:** Creates a brand-new employee account in the system
- **Input** (`CreateUserDto`): `employeeId, fullName, email, phoneNumber, password, roleId, branchId, departmentId`
- **Behind the scenes:** The `ManagementService` hashes the password with BCrypt before saving
- **Returns:** `{ "message": "User created successfully", "userId": 15 }` with HTTP `201 Created`

#### PUT `/api/admin/users/{userId}` — Update Existing User
- **Who calls it:** `SYSTEM_ADMIN`
- **What it does:** Updates any field of an existing user account (name, email, role, branch, department)
- **Returns:** `{ "message": "User updated successfully", "userId": 15 }`

#### PUT `/api/admin/users/{userId}/toggle-active` — Activate / Deactivate User
- **Who calls it:** `SYSTEM_ADMIN`
- **What it does:** Toggles the `isActive` boolean on a user record — this is a **soft delete**. Deactivated users cannot log in, but their data and history is preserved in the database
- **Returns:** `{ "message": "User deactivated", "isActive": false }`

### Private Helper
```java
private Map<String, Object> mapUserToResponse(User u) { ... }
```
A private utility method that converts a `User` entity into a clean flat `Map` for the JSON response, avoiding direct entity exposure.

---

## 5. `OrgManagementController.java`
**Base URL:** `/api/admin/org`

The SYSTEM_ADMIN's control panel for all **organizational master data** — Branches, Departments, Item Categories, and Roles. This controller powers all three tabs of the Admin Panel in the frontend.

### Branch Endpoints

#### GET `/api/admin/org/branches` — List All Branches
- Returns all branches with full details: `branchId, branchCode, branchName, branchType, district, division, address, phone, isActive`
- Also includes a `departments` array (names) and `departmentIds` array for each branch

#### POST `/api/admin/org/branches` — Create Branch
- **Input** (`CreateBranchDto`): `branchCode, branchName, branchType (MAIN/REGIONAL/SUB), district, division, address, phone`
- Returns `{ "message": "Branch created successfully", "branchId": 8 }`
- Has try-catch to return a descriptive error message if creation fails (e.g., duplicate code)

#### PUT `/api/admin/org/branches/{id}` — Update Branch
- Updates any field of an existing branch record
- Returns `{ "message": "Branch updated successfully", "branchId": 8 }`

---

### Department Endpoints

#### GET `/api/admin/org/departments` — List All Departments
- Returns all departments with: `departmentId, departmentName, isHqOnly`
- Also returns a computed `branchName` field: `"HQ Only"` or `"Global (Master List)"` based on the `isHqOnly` flag

#### POST `/api/admin/org/departments` — Create Department
- **Input** (`CreateDepartmentDto`): `departmentName, isHqOnly`
- Returns `{ "message": "Department created successfully", "departmentId": 7 }`

#### PUT `/api/admin/org/departments/{id}` — Update Department
- Updates an existing department record

---

### Item Category Endpoints

#### GET `/api/admin/org/items` — List All Item Categories
- Returns all transferable item/document types with: `categoryId, categoryName, sensitivityLevel, description, departmentId, departmentName`
- If a category has no department restriction, `departmentName` returns `"Open Access"`

#### POST `/api/admin/org/items` — Create Item Category
- **Input** (`CreateItemCategoryDto`): `categoryName, sensitivityLevel (NORMAL/CONFIDENTIAL/HIGHLY_CONFIDENTIAL), description, departmentId (optional)`
- Returns `{ "message": "Item category created successfully", "categoryId": 5 }`

#### PUT `/api/admin/org/items/{categoryId}` — Update Item Category
- Updates an existing item category

#### PUT `/api/admin/org/items/{categoryId}/map` — Map Item to Department
- **Input:** `{ "departmentId": 3 }`
- Links an item category to a specific department, restricting which employees can request it

---

### Role Endpoint

#### GET `/api/admin/org/roles` — List All Roles
- **Note:** Roles are read-only — they cannot be created or deleted through the API. They are seeded into the database at setup
- Returns all 7 roles: `roleId, roleName`
- Used by the Admin panel dropdowns when creating or editing users

---

## 6. `LookupController.java`
**Base URL:** `/api/lookup`

A **lightweight, read-only** controller that provides dropdown/select data to the frontend forms. It does not manage any data — only reads it. This is called when the New Transfer form loads, the Admin panel opens, or any form needs to populate its dropdowns.

### Endpoints

#### GET `/api/lookup/branches` — All Branches (Simplified)
- **Who calls it:** New Transfer form (destination branch dropdown), Admin User form (branch assignment)
- **Returns:** Simplified branch list: `id, code, name, type, district`
- **Difference from org endpoint:** Returns fewer fields, optimized for dropdowns

#### GET `/api/lookup/departments` — All Departments (Simplified)
- **Who calls it:** New Transfer form (destination department dropdown), Admin User form (department assignment)
- **Returns:** `departmentId, departmentName`

#### GET `/api/lookup/branches/{branchId}/departments` — Scoped Branch Departments
- **Who calls it:** HQ review allocation panel when picking the target department
- **What it does:** Fetches only the departments associated with the specified branch ID (mapped via the `branch_departments` join table)
- **Returns:** List of department objects: `departmentId, departmentName`

#### GET `/api/lookup/roles` — All Roles (Simplified)
- **Who calls it:** Admin User Management form (role assignment dropdown)
- **Returns:** `roleId, roleName`

#### GET `/api/lookup/categories` — All Item Categories
- **Who calls it:** New Transfer form (category dropdown)
- **Returns:** `id, name, sensitivityLevel, departmentId`
- **Used for filtering:** The frontend uses `departmentId` to filter categories — regular Officers only see categories assigned to their department, while Managers see all

#### GET `/api/lookup/users/delivery-persons/available` — Available Delivery Persons
- **Who calls it:** Branch Manager when assigning a delivery person to an accepted transfer
- **What it does:** Calls `userRepository.findAvailableDeliveryPersons()` — a custom repository query that returns only `DELIVERY_PERSON` role users who are currently available (not already assigned to an active in-transit delivery)
- **Returns:** `userId, fullName, employeeId`

---

## Summary Table

| Controller | Base URL | # Endpoints | Primary Purpose | Who Uses It |
|---|---|---|---|---|
| `AuthController` | `/api/auth` | 1 | Login & JWT issuance | Everyone (public) |
| `TransferController` | `/api/transfers` | 9 | Full transfer lifecycle | All roles |
| `UserController` | `/api/users` | 2 | Profile & branch directory | All / Managers |
| `UserManagementController` | `/api/admin/users` | 4 | User CRUD | SYSTEM_ADMIN only |
| `OrgManagementController` | `/api/admin/org` | 10 | Branch/Dept/Category CRUD | SYSTEM_ADMIN only |
| `LookupController` | `/api/lookup` | 6 | Dropdown/form data | All authenticated |

**Total backend endpoints: 32**

---

## How Controllers Interact with Each Other

```
Frontend Request
      │
      ▼
Controller  ──── extracts userId from JWT (CustomUserDetails)
      │
      ▼
Service Layer  ──── business logic, state machine, validation
      │
      ▼
Repository (JPA) ──── database read/write
      │
      ▼
AuditService ──── writes audit log entry after every state change
      │
      ▼
Controller returns DTO (never raw Entity)
```

---

*Controllers Reference — BranchSync v1.0 | Jamuna Bank PLC*
