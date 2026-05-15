# BranchSync — Full Project Architecture Review

## Stack
| Layer | Technology |
|---|---|
| Backend | Spring Boot 3, Spring Security (JWT), Spring Data JPA |
| Database | PostgreSQL (via Supabase) |
| Frontend | React 18 + TypeScript + Vite |
| Auth | JWT (stateless), SHA-256 password encoder |
| API | REST @ `http://localhost:8080/api` |

---

## 1. DATABASE SCHEMA (JPA Entities)

### `roles` table → `Role.java`
- `role_id` (PK), `role_name`
- **Values**: `SYSTEM_ADMIN`, `BRANCH_MANAGER`, `OPERATION_MANAGER`, `FIRST_EXECUTIVE_OFFICER`, `DEPARTMENT_STAFF` (employee), `DELIVERY_PERSON`

### `branches` table → `Branch.java`
- `branch_id`, `branch_code` (unique), `branch_name`, `branch_type` (enum: `BranchType`), `address`, `district`, `division`, `phone`, `email`, `is_active`, `created_at`
- **M2M relationship** → `branch_departments` join table (branches ↔ departments)

### `departments` table → `Department.java`
- `department_id`, `department_name` (unique globally — master list), `created_at`
- Departments are **global** and assigned to branches via the M2M join table

### `users` table → `User.java`
- `user_id`, `employee_id` (unique), `full_name`, `email`, `phone_number`, `password_hash`
- FK → `role_id`, `branch_id` (nullable for ADMIN/DELIVERY), `department_id` (nullable)
- `is_available` (boolean — tracks delivery person availability), `is_active`, `created_at`, `updated_at`, `last_login_at`

### `item_categories` table → `ItemCategory.java`
- `category_id`, `category_name` (unique), `sensitivity_level` (LOW/MEDIUM/HIGH/CRITICAL), `description`, `created_at`
- FK → `department_id` (nullable — null = "Open Access", any dept can request)

### `transfer_requests` table → `TransferRequest.java`
- `request_id`, `request_code` (REQ-YYYY-NNNN), `title`, `description`, `priority` (NORMAL/HIGH/URGENT/CRITICAL), `status` (string)
- FK source: `origin_branch_id`, `origin_department_id`, `initiated_by_id`
- FK step 1: `internal_approver_id`
- FK destination: `destination_branch_id`, `destination_department_id`
- FK step 2: `dept_acceptor_id`, `delivery_person_id`
- FK step 3: `final_releaser_id`
- Timestamps: `requested_at`, `picked_up_at`, `delivered_at`, `closed_at`
- `final_note` (text — required for rejection)

### `audit_logs` table → `AuditLog.java`
- `audit_id`, FK → `request_id`, FK → `actor_id`
- `action` (string), `from_status`, `to_status`, `remarks`, `ip_address`, `acted_at`

---

## 2. TRANSFER STATUS STATE MACHINE

```
CREATE → PENDING_INTERNAL
       ↓ (if requester is Manager/FEO → bypass → PENDING_ASSIGNMENT)
Step 1: PENDING_INTERNAL → [Source Manager approves] → PENDING_ASSIGNMENT
Step 2: PENDING_ASSIGNMENT → [Dest dept staff accepts + assigns driver] → PENDING_FINAL_RELEASE
Step 3: PENDING_FINAL_RELEASE → [Dest Manager gives green light] → READY_FOR_PICKUP
Step 4: READY_FOR_PICKUP → [Driver confirms pickup] → IN_TRANSIT
Step 5: IN_TRANSIT → [Driver confirms delivery] → DELIVERED
Step 6: DELIVERED → [Original requester accepts] → COMPLETED
                  → [Original requester rejects] → REJECTED_ON_RECEIPT
```
**Also possible**: `CANCELLED` (terminal, not yet fully implemented in service)

---

## 3. BACKEND LAYER-BY-LAYER

### 3.1 Security (`/security/`)
| File | Purpose |
|---|---|
| `SecurityConfig.java` | Spring Security config. Public: `/api/auth/**`, `/api/lookup/**`. All else: authenticated. CORS allows all origins. Uses **SHA-256** password encoder (NOT BCrypt). |
| `JwtUtils.java` | Generates & validates JWT tokens |
| `JwtAuthenticationFilter.java` | Reads `Authorization: Bearer` header per request, populates SecurityContext |
| `CustomUserDetailsService.java` | Loads user by `employeeId`, calls `CustomUserDetails.build()` |
| `CustomUserDetails.java` | Stores: `userId`, `employeeId`, `password`, `branchId`, `departmentId`, authorities |
| `Sha256PasswordEncoder.java` | SHA-256 implementation of `PasswordEncoder` |

### 3.2 Controllers

| Controller | Base Path | Key Endpoints |
|---|---|---|
| `AuthController` | `/api/auth` | `POST /login` → returns JWT + full user profile |
| `LookupController` | `/api/lookup` | `GET /branches`, `/departments`, `/roles`, `/categories`, `/users/delivery-persons/available` — **Public** endpoints for form dropdowns |
| `TransferController` | `/api/transfers` | Full CRUD + 6-step workflow actions |
| `OrgManagementController` | `/api/admin/org` | CRUD for branches, departments, item categories; map item→dept |
| `UserManagementController` | `/api/admin/users` | List, create, update, toggle-active users |
| `UserController` | `/api/user` | Profile endpoint (assumed) |

### 3.3 Transfer Workflow Endpoints
```
GET    /api/transfers              → getDashboardTransfers (role-scoped)
GET    /api/transfers/history      → getTransferHistory (terminal statuses only)
GET    /api/transfers/{id}         → getTransferById (full TransferDetailDto)
POST   /api/transfers              → initiateTransfer (Step 1 create)
POST   /api/transfers/{id}/approve-internal  → Step 1 gate
POST   /api/transfers/{id}/accept            → Step 2 (+ body: {deliveryPersonId})
POST   /api/transfers/{id}/release           → Step 3
POST   /api/transfers/{id}/pickup            → Step 4
POST   /api/transfers/{id}/deliver           → Step 5
POST   /api/transfers/{id}/close             → Step 6 (+ body: {finalNote, accepted})
```

### 3.4 Services

**`TransferServiceImpl`** — Core workflow engine:
- `initiateTransfer()`: generates request code (`REQ-YYYY-NNNN`), sets origin from actor's branch/dept, auto-bypasses Step 1 for Managers
- `approveInternal()`: validates actor is Manager + same source branch
- `acceptAndAssignDriver()`: validates driver `isAvailable=true`, assigns driver
- `markPickedUp()`: sets driver `isAvailable=false`
- `markDelivered()`: sets driver `isAvailable=true`
- `closeRequest()`: only original requester (`initiatedBy`) can close
- `getDashboardTransfers()` / `getTransferHistory()`: role-scoped queries:
  - `SYSTEM_ADMIN` → all transfers
  - `DELIVERY_PERSON` → only their assigned transfers
  - `MANAGER_ROLES` → all from their branch (origin OR destination)
  - Regular employee → all from their branch

**`ManagementServiceImpl`** — Org & user CRUD:
- Full CRUD for Users, Branches, Departments, ItemCategories
- `createUser()`: validates role-based branch requirement, encodes password
- `mapItemCategoryToDepartment()`: maps/unmaps item to department

**`AuditServiceImpl`** — Logging:
- Every workflow action is logged to `audit_logs` table

### 3.5 Repositories

| Repo | Key Custom Queries |
|---|---|
| `UserRepository` | `findAllWithDetails()` (JOIN FETCH role+branch+dept), `findByEmployeeId()`, `findAvailableDeliveryPersons()` |
| `TransferRequestRepository` | `findAllByOrderByRequestedAtDesc()`, `findByOriginBranch_BranchIdOrDestination...()`, `findByDeliveryPerson_UserIdOrderBy...()` |
| `BranchRepository` | `findAllBranches()` |

### 3.6 Mapper
**`TransferMapper.java`**:
- `toEntity(InitiateTransferRequestDto)` → builds a partial `TransferRequest` (title, desc, priority, destination branch/dept IDs, category ID as shell objects)
- `toResponseDto()` → lightweight list view (no step actor details)
- `toDetailDto()` → full detail view (all FKs expanded: branch names, dept names, initiator info, delivery person)

### 3.7 DTOs
**Request:**
- `InitiateTransferRequestDto` → title, description, categoryId, priority, destinationBranchId, destinationDepartmentId
- `ApprovalRequestDto`, `CompletionRequestDto`, `VerificationRequestDto` (minor action DTOs)
- `CreateBranchDto`, `CreateDepartmentDto`, `CreateItemCategoryDto`, `CreateUserDto`

**Response:**
- `TransferResponseDto` → list card view (requestId, code, status, title, priority, requestedAt, branchNames, categoryName, deliveryPerson)
- `TransferDetailDto` → full detail (all fields including step actors, timestamps, department names)
- `JwtResponseDto` → token, type, id, employeeId, fullName, role, branchId, departmentId

---

## 4. FRONTEND LAYER-BY-LAYER

### 4.1 Routing (`App.tsx`)
```
/login                    → Login (public)
/ (protected + Layout)
  /                       → Dashboard
  /transfers/new          → NewTransfer
  /transfers/:id          → TransferDetails
  /transfers/history      → TransferHistory
  /profile                → Profile
  /admin/users            → UserManagement (admin only)
  /admin/branches         → OrgManagement (tab: branches)
  /admin/departments      → OrgManagement (tab: departments)
  /admin/items            → OrgManagement (tab: items)
```
**`ProtectedRoute`**: redirects to `/login` if not authenticated

### 4.2 Auth Context (`AuthContext.tsx`)
- `User` interface: `{ id, userId, employeeId, fullName, role, branchId, departmentId }`
- Persists to `localStorage` (token + user JSON)
- `isInitializing` flag prevents flash of unauthenticated state on page load

### 4.3 API Layer (`axiosConfig.ts`)
- Base URL: `http://localhost:8080/api`
- Request interceptor: auto-attaches `Authorization: Bearer {token}` from localStorage
- Response interceptor: catches 401 → clears storage → redirects to `/login`

### 4.4 Key Pages

**`Dashboard.tsx`**: Calls `GET /api/transfers`, shows role-scoped active transfers table. Has "New Request" button. Role-specific welcome message.

**`NewTransfer.tsx`**: 
- Fetches lookup data (branches, departments, categories) from `/api/lookup/*`
- Category filter: regular employees only see items belonging to their department; managers see all
- Origin branch: auto-set from `user.branchId` (readonly)
- Submits to `POST /api/transfers`

**`TransferDetails.tsx`**: 
- Fetches `GET /api/transfers/:id` → `TransferDetailDto`
- Shows all 6 action buttons based on role + status + branch/user ID checks
- Client-side role guards:
  - `canApproveInternal()`: Manager + same origin branch
  - `canAcceptAndAssign()`: any user at destination branch (in status PENDING_ASSIGNMENT)
  - `canRelease()`: Manager + destination branch
  - `canPickup()` / `canDeliver()`: only the assigned `deliveryPersonId` matches `user.userId`
  - `canClose()`: only `initiatedByUserId` matches `user.userId`
- Step 2: fetches available delivery persons from `/api/lookup/users/delivery-persons/available`

**`TransferHistory.tsx`**: `GET /api/transfers/history` → shows completed/rejected/cancelled

**`OrgManagement.tsx`** (43KB — large): 3-tab admin panel (branches, departments, items). Full CRUD modals for each.

**`UserManagement.tsx`** (22KB): Admin user list, create/edit modal, toggle active.

### 4.5 Layout
- **`Sidebar.tsx`**: Logo, nav links (Dashboard, New Request, History, admin section). Admin links shown only for `SYSTEM_ADMIN` role. Delivery person cannot see "New Request".
- **`Topbar.tsx`**: User profile info, logout button.

---

## 5. ROLE SYSTEM SUMMARY

| Role | Branch? | Dept? | Can Create Transfer | Can Approve Step 1 | Can Accept+Assign (Step 2) | Can Release (Step 3) | Can Pickup (Step 4) | Can Deliver (Step 5) | Can Close (Step 6) |
|---|---|---|---|---|---|---|---|---|---|
| SYSTEM_ADMIN | No | No | Yes | As manager | As staff | As manager | No | No | No |
| BRANCH_MANAGER | Yes | Maybe | Yes (bypass Step 1) | Yes (same src branch) | Yes (dest branch) | Yes (dest branch) | No | No | No |
| OPERATION_MANAGER | Yes | Maybe | Yes (bypass Step 1) | Yes | Yes | Yes | No | No | No |
| FIRST_EXECUTIVE_OFFICER | Yes | Maybe | Yes (bypass Step 1) | Yes | Yes | Yes | No | No | No |
| DEPARTMENT_STAFF | Yes | Yes | Yes (Step 1 required) | No | Yes (dest branch) | No | No | No | Yes (if original requester) |
| DELIVERY_PERSON | No | No | No | No | No | No | Yes (if assigned) | Yes (if assigned) | No |

---

## 6. KEY DESIGN DECISIONS & GOTCHAS

1. **Password Encoder**: Uses **SHA-256**, NOT BCrypt. `SecurityConfig` explicitly injects `Sha256PasswordEncoder`. Don't swap to BCrypt without migrating all hashes.

2. **Manager Bypass**: If the initiator's role is in `MANAGER_ROLES`, the transfer skips `PENDING_INTERNAL` and goes straight to `PENDING_ASSIGNMENT`. The `internalApprover` is set to the initiator themselves.

3. **Driver Availability**: Tracked on `User.isAvailable`. Set to `false` on pickup, `true` on delivery. Only `isAvailable=true` drivers appear in lookup endpoint.

4. **Item-Department Filtering**: In `NewTransfer.tsx`, categories are filtered client-side: regular employees only see categories where `category.departmentId === user.departmentId`. Categories with `departmentId = null` are visible to everyone ("Open Access").

5. **Auth Token Fields**: The JWT response DTO and `AuthContext.User` interface use `id` (= userId) AND `userId` — both exist. Be careful not to break either reference.

6. **Request Code Generation**: Uses `transferRequestRepository.count() + 1`. This is NOT collision-safe under concurrent load, but works for low-volume demo.

7. **Security — No Role-based Guards on Admin Endpoints**: `@PreAuthorize` is available (`@EnableMethodSecurity` is on) but NOT currently applied to `/api/admin/**`. The security config only requires `authenticated()`, not a specific role. Any authenticated user can hit admin endpoints if they know the URL.

8. **`canClose()` bug potential**: The frontend checks `user?.userId === transfer?.initiatedByUserId`. But `AuthContext.User` has both `id` and `userId` fields. The login response sets `id` from `jwtResponseDto.id`. Confirm both are populated consistently from the login flow.

9. **`LookupController` has no `@RequiredArgsConstructor`**: Uses manual constructor injection (not Lombok). This is intentional — doesn't use `@RequiredArgsConstructor`.

10. **Departments are Global**: Departments are NOT branch-specific. The `branch_departments` M2M table controls which departments exist at each branch. The frontend dropdown in NewTransfer shows ALL global departments (no branch filtering).

---

## 7. FILE MAP QUICK REFERENCE

```
backend/src/main/java/com/jamunabank/branchsync/
├── BranchSyncApplication.java
├── controller/
│   ├── AuthController.java         POST /api/auth/login
│   ├── LookupController.java       GET  /api/lookup/* (public)
│   ├── TransferController.java     /api/transfers (6-step workflow)
│   ├── OrgManagementController.java /api/admin/org (branches/depts/items)
│   ├── UserManagementController.java /api/admin/users
│   └── UserController.java         /api/user
├── dto/
│   ├── auth/  LoginRequestDto, JwtResponseDto
│   ├── request/  InitiateTransferRequestDto, CreateBranchDto, CreateDepartmentDto,
│   │             CreateItemCategoryDto, CreateUserDto, ApprovalRequestDto,
│   │             CompletionRequestDto, VerificationRequestDto
│   └── response/ TransferResponseDto, TransferDetailDto, ErrorResponse
├── exception/  ResourceNotFoundException, UnauthorizedRoleException
├── mapper/  TransferMapper.java
├── model/
│   ├── entity/  AuditLog, Branch, Department, ItemCategory, Role, TransferRequest, User
│   └── enums/   BranchType
├── repository/  AuditLog, Branch, Department, ItemCategory, Role, TransferRequest, User
├── security/   CustomUserDetails, CustomUserDetailsService, JwtAuthFilter, JwtUtils,
│              SecurityConfig, Sha256PasswordEncoder, PasswordEncodingRunner
└── service/
    ├── AuditService.java (interface)
    ├── ManagementService.java (interface)
    ├── TransferService.java (interface)
    └── impl/ AuditServiceImpl, ManagementServiceImpl, TransferServiceImpl

frontend/src/
├── App.tsx          (routing)
├── main.tsx         (React entry point)
├── api/axiosConfig.ts
├── context/AuthContext.tsx
├── types/transfer.ts
├── components/
│   ├── Layout/ (Layout.tsx, Sidebar.tsx, Topbar.tsx, Layout.css)
│   ├── Logo/   (BranchSync_Logo.png)
│   └── ProtectedRoute.tsx
└── pages/
    ├── Login.tsx + Login.css
    ├── Dashboard.tsx + Dashboard.css
    ├── NewTransfer.tsx + NewTransfer.css
    ├── TransferDetails.tsx + TransferDetails.css
    ├── TransferHistory.tsx + TransferHistory.css
    ├── Profile.tsx + Profile.css
    └── admin/
        ├── OrgManagement.tsx   (branches/depts/items 3-tab, 43KB)
        ├── UserManagement.tsx  (users CRUD, 22KB)
        └── Admin.css
```
