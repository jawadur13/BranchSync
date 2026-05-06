# BranchSync - Jamuna Bank PLC

BranchSync is an internal inter-branch transfer and requisition tracking system for Jamuna Bank PLC. It manages the movement of sensitive operational assets between branches, including cash bundles, cheque books, demand drafts, IT equipment, stationery, security items, and other branch resources.

The current project is a monorepo with a Spring Boot backend, a React/Vite frontend, MySQL schema and seed data, JWT authentication, role-aware transfer workflow screens, user profile support, transfer history, and admin tools for users, branches, departments, and item categories.

## Current Project Status

The project currently has a working end-to-end transfer workflow across backend and frontend.

Implemented areas:

- Employee ID/password login with JWT authentication.
- Protected frontend routes with persisted auth state.
- User profile page backed by `/api/users/profile`.
- Dashboard for role/branch-scoped active transfers.
- New transfer request form.
- Transfer details page with role-aware workflow actions.
- Transfer history page for completed, rejected, and cancelled transfers.
- Admin user management with create, edit, profile view, filtering, and activation toggling.
- Admin branch management with branch create/update and department assignment.
- Admin department management with global department create/update.
- Admin item category management with create/update, sensitivity level, description, and responsible department mapping.
- MySQL schema and seed/test data scripts.
- Transactional audit logging for transfer status changes.
- Backend service and repository tests.
- Custom BranchSync logo/favicon assets in the frontend.

Known rough or incomplete areas:

- Some frontend source text still contains encoding/mojibake artifacts for icons and special characters.
- Method-level `@PreAuthorize` is enabled but not consistently used; most business authorization is currently enforced in service logic and route authentication.
- Docker Compose exists, but Dockerfiles were not present during review, so the Docker path may need more setup.
- `application.properties` still contains Supabase reference values, but the Java app is currently configured to use local MySQL.
- The backend uses a custom SHA-256 password encoder, while some older comments still mention BCrypt.

## Core Purpose

BranchSync is a controlled banking workflow system. It is meant to:

- Request assets from one branch to another.
- Enforce source branch approval before destination processing.
- Let destination staff accept requests and assign available delivery personnel.
- Require destination manager-level release before pickup.
- Track pickup, transit, delivery, and final requester verification.
- Keep an audit trail of workflow actions.
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
   - Destination branch staff accepts the request.
   - An available delivery person is assigned.
   - Status changes to `PENDING_FINAL_RELEASE`.

4. Final destination release
   - A manager-level user from the destination branch gives final approval.
   - Status changes to `READY_FOR_PICKUP`.

5. Pickup and delivery
   - The assigned delivery person marks pickup.
   - Status changes to `IN_TRANSIT`, and the delivery person becomes unavailable.
   - The same delivery person marks delivery.
   - Status changes to `DELIVERED`, and the delivery person becomes available again.

6. Final requester verification
   - The original requester accepts or rejects the delivered item.
   - Accepted requests become `COMPLETED`.
   - Rejected requests become `REJECTED_ON_RECEIPT`.

## Status Values

Transfer requests currently use string status values:

- `PENDING_INTERNAL`
- `PENDING_ASSIGNMENT`
- `PENDING_FINAL_RELEASE`
- `READY_FOR_PICKUP`
- `IN_TRANSIT`
- `DELIVERED`
- `COMPLETED`
- `REJECTED_ON_RECEIPT`
- `CANCELLED`

The history view shows terminal records:

- `COMPLETED`
- `REJECTED_ON_RECEIPT`
- `CANCELLED`

## Roles

The current seed data and backend logic use these roles:

- `SYSTEM_ADMIN`
- `FIRST_EXECUTIVE_OFFICER`
- `BRANCH_MANAGER`
- `OPERATION_MANAGER`
- `OFFICER`
- `DELIVERY_PERSON`

Manager-level workflow permissions are grouped in backend service logic as:

- `BRANCH_MANAGER`
- `OPERATION_MANAGER`
- `FIRST_EXECUTIVE_OFFICER`

## Branch Types

The current `BranchType` enum supports:

- `HQ`
- `AD_BRANCH`
- `SUB_BRANCH`

## Architecture

### Backend

- Java 21
- Spring Boot 3.4.0
- Spring Web
- Spring Data JPA
- Spring Security
- JWT using `jjwt`
- Jakarta Bean Validation
- MySQL connector
- H2 for tests
- Lombok dependency present; many entities still use manual getters, setters, and builders

Backend root:

```text
backend/
```

Main backend packages:

```text
backend/src/main/java/com/jamunabank/branchsync/
  controller/
  dto/
  exception/
  mapper/
  model/
  repository/
  security/
  service/
```

### Frontend

- React 19
- Vite 8
- TypeScript
- React Router 7
- Axios
- Plain CSS files by page/layout
- Custom PNG logo and favicon assets

Frontend root:

```text
frontend/
```

Main frontend areas:

```text
frontend/src/
  api/
  components/
  context/
  pages/
  types/
```

## Database

The current application configuration targets local MySQL, commonly through XAMPP:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/branchsync?serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=
```

Schema and test data are located in:

```text
backend/src/main/resources/db/migration/schema_mysql.sql
backend/src/main/resources/db/test data/test_data_mysql.sql
```

Additional data/update scripts exist in:

```text
backend/src/main/resources/db/test data/
```

## Main API Areas

Authentication:

- `POST /api/auth/login`

Current login response includes token, type, user id, employee id, full name, role, branch id, and department id.

Profile:

- `GET /api/users/profile`

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

Admin organization:

- `GET /api/admin/org/branches`
- `POST /api/admin/org/branches`
- `PUT /api/admin/org/branches/{id}`
- `GET /api/admin/org/departments`
- `POST /api/admin/org/departments`
- `PUT /api/admin/org/departments/{id}`
- `GET /api/admin/org/roles`
- `GET /api/admin/org/items`
- `POST /api/admin/org/items`
- `PUT /api/admin/org/items/{categoryId}`
- `PUT /api/admin/org/items/{categoryId}/map`

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
- `/admin/users`
- `/admin/branches`
- `/admin/departments`
- `/admin/items`

## Local Development

### Prerequisites

- Java 21
- Maven 3.9+
- Node.js 22+
- MySQL, for example through XAMPP
- Docker and Docker Compose, optional and not currently the most reliable path

### Backend

Create a local MySQL database named:

```text
branchsync
```

Apply the MySQL schema and seed data:

```text
backend/src/main/resources/db/migration/schema_mysql.sql
backend/src/main/resources/db/test data/test_data_mysql.sql
```

Run the backend:

```bash
cd backend
mvn spring-boot:run
```

Default backend URL:

```text
http://localhost:8080
```

### Frontend

Install dependencies and run Vite:

```bash
cd frontend
npm install
npm run dev
```

Default frontend URL:

```text
http://localhost:5173
```

The frontend API client currently points to:

```text
http://localhost:8080/api
```

## Test Data

The main MySQL seed script creates:

- Roles for admin, manager-level users, officers, and delivery persons.
- Branches across Bangladesh.
- Global departments.
- Branch-to-department assignments.
- Item categories with sensitivity levels and responsible departments.
- Users for each role.
- Floating delivery persons with available/busy state.

The seed script comments may still mention `password123` and BCrypt. The current backend password encoder is `Sha256PasswordEncoder`, so test credentials depend on the SHA-256 hashes currently stored in the scripts.

## Testing

Backend tests are located in:

```text
backend/src/test/java/com/jamunabank/branchsync/
```

Run backend tests with:

```bash
cd backend
mvn test
```

Frontend build check:

```bash
cd frontend
npm run build
```

Frontend lint:

```bash
cd frontend
npm run lint
```

## Repository Notes

- This is a monorepo containing both backend and frontend.
- `PROJECT_OVERVIEW.md` describes the business workflow and is still useful for understanding the intended domain model.
- The current source is closer to a local MySQL development setup than the older Supabase/PostgreSQL direction.
- `docker-compose.yml` exists, but the present repo file list did not include Dockerfiles.
- The frontend has moved from the single `/admin/org` route to separate admin routes for branches, departments, and items.

---

Developed by [Jawadur Rafid](https://jawadur.pro.bd)
