# BranchSync - Jamuna Bank PLC

**BranchSync** is an inter-branch coordination and requisition tracking system designed specifically for **Jamuna Bank PLC**. It manages the flow of sensitive items (Cash, Loan Files, IT Equipment, etc.) across the banking network with strict oversight and dual-verification security.

## 🚀 Current Project Status: **Phase 1 Complete (Backend Core)**

### Core Architecture
- **Backend:** Java 21, Spring Boot 3.4.0, PostgreSQL (via Supabase).
- **Frontend:** React.js, Vite, TypeScript, Premium Vanilla CSS Design.
- **Infrastructure:** Monorepo structure with Docker Compose.

### Key Milestones Achieved
1.  **Comprehensive Data Layer:**
    *   Implemented **19 JPA Entities** covering IAM, Logistics, Workflow, and Auditing.
    *   Mapped 16 custom PostgreSQL Enums to type-safe Java Enums.
    *   Created **20 Spring Data JPA Repositories** with advanced pagination and supervisor-specific filters.
2.  **Robust Business Logic:**
    *   **Transfer Workflow:** Automated request code generation (`REQ-YYYY-XXXX`).
    *   **Conditional Approvals:** Specialized routing for CRITICAL/CASH categories.
    *   **Dual-Verification Module:** Secure two-sided confirmation logic (Origin & Destination) required for successful transfers.
    *   **Supervisor Roles:** Fully integrated **First Executive Officer (FEO)** and **Branch Manager** approval tiers.
3.  **Auditing & Security:**
    *   **Transactional Audit Log:** Every status change is automatically logged in an immutable audit table within the same transaction.
    *   **Integrity:** Automatic rollback of business actions if auditing fails.

---

## 🛠️ Local Development Setup

### Prerequisites
- Docker & Docker Compose
- Java 21 (LTS)
- Node.js 22+ (LTS)
- Maven 3.9+

### Running the Project
1.  **Clone the Repository**
2.  **Environment Variables:** Configure placeholders in `application.properties` or `.env`.
3.  **Docker Up:**
    ```bash
    docker-compose up --build
    ```

## 📈 Roadmap
- [x] Database Schema & JPA Entities
- [x] Repository Layer with Pagination
- [x] Service Layer & Business Workflow
- [ ] REST API Controllers
- [ ] Global Exception Handling
- [ ] Spring Security & JWT Integration
- [ ] Frontend Development (React Dashboards)

---
*Created by Md Jawadur Rafid (22203044) for Practicum Spring 2026*