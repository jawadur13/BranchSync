# BranchSync - Jamuna Bank PLC

BranchSync is an internal inter-branch transfer and requisition tracking system for Jamuna Bank PLC. It is designed to manage the movement of sensitive operational assets between branches, including cash bundles, cheque books, IT equipment, stationery, security items, and other branch resources.

The current implementation is a monorepo with a Spring Boot backend, a React/Vite frontend, MySQL schema and seed data, JWT authentication, role-based workflows, and admin screens for managing users, branches, departments, and item ownership.

## Current Project Status

The project currently has a working backend workflow and a matching frontend for the main operational screens.

Implemented areas:

- Authentication with employee ID and password.
- JWT-based protected API access.
- Branch, department, role, user, item category, transfer request, and audit log data models.
- Six-step transfer workflow from request creation to final requester verification.
- Dashboard listing scoped transfer requests by user role and branch.
- Transfer request creation screen.
- Transfer detail screen with role-aware actions.
- Admin user management.
- Admin organization management for branches, departments, and item-to-department mapping.
- MySQL schema and test data scripts.
- Backend service and repository tests.

Partially implemented or rough areas:

- Transfer history route exists in the frontend but is still a placeholder.
- Some documentation still exists outside this README with older project assumptions.
- Some UI source text contains encoding/mojibake artifacts for icons and special characters.
- Method-level `@PreAuthorize` annotations are not consistently used yet; most authorization is enforced inside service logic and route authentication.
- The README previously mentioned PostgreSQL/Supabase and BCrypt, but the current code is configured for local MySQL and uses a custom SHA-256 password encoder.

## Core Purpose

BranchSync is not just a delivery tracker. It is a controlled banking workflow system for:

- Requesting assets from one branch to another.
- Ensuring the source branch approves requests before the destination branch acts.
- Letting destination staff accept requests and assign available delivery personnel.
- Requiring destination manager-level release before pickup.
- Tracking pickup, transit, delivery, and final requester confirmation.
- Recording status changes in an audit log.
- Restricting access by role, branch, department, and item ownership.

## Workflow

The current transfer lifecycle is implemented as a six-step process.

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

## Current Status Values

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

## User Roles

The current seed data and backend logic use these roles:

- `SYSTEM_ADMIN`
- `FIRST_EXECUTIVE_OFFICER`
- `BRANCH_MANAGER`
- `OPERATION_MANAGER`
- `OFFICER`
- `DELIVERY_PERSON`

Manager-level workflow permissions are currently grouped in code as:

- `BRANCH_MANAGER`
- `OPERATION_MANAGER`
- `FIRST_EXECUTIVE_OFFICER`

## Architecture

### Backend

- Java 21
- Spring Boot 3.4.0
- Spring Web
- Spring Data JPA
- Spring Security
- JWT using `jjwt`
- Jakarta Bean Validation
- Lombok dependency present, though many entities use manual getters, setters, and builders
- MySQL connector
- H2 for tests

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
- Vite
- TypeScript
- React Router
- Axios
- Plain CSS modules/files by page and layout

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

### Database

The current application configuration targets local MySQL:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/branchsync?serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=
```

Schema and seed data are located in:

```text
backend/src/main/resources/db/migration/schema_mysql.sql
backend/src/main/resources/db/test data/test_data_mysql.sql
```

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
- `PUT /api/admin/org/items/{categoryId}/map`

Admin users:

- `GET /api/admin/users`
- `POST /api/admin/users`
- `PUT /api/admin/users/{userId}`
- `PUT /api/admin/users/{userId}/toggle-active`

## Frontend Routes

- `/login`
- `/`
- `/transfers/new`
- `/transfers/:id`
- `/transfers/history` - placeholder
- `/admin/users`
- `/admin/org`

## Local Development

### Prerequisites

- Java 21
- Maven 3.9+
- Node.js 22+
- MySQL, for example through XAMPP
- Docker and Docker Compose, optional depending on how you run the app

### Backend

Create a local MySQL database named:

```text
branchsync
```

Apply the MySQL schema and test data:

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
- Item categories mapped to responsible departments.
- Users for each role.
- Floating delivery persons with available/busy state.

The seed script comments say the password is `password123`, but the stored hashes correspond to the current custom SHA-256 password encoder setup rather than BCrypt.

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

## Repository Notes

- This is a monorepo containing both backend and frontend.
- `PROJECT_OVERVIEW.md` describes the intended business workflow and is broadly aligned with the current implementation.
- `docker-compose.yml` exists, but Dockerfiles were not present in the file list during review, so Docker Compose may need further setup before it can run the full project.
- The current source is closer to a MySQL local-development setup than the older Supabase/PostgreSQL direction described previously.

---

Developed by [Jawadur Rafid](https://jawadur.pro.bd)
