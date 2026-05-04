-- ============================================================
-- BranchSync: Final Schema (MySQL)
-- 6-Step Restricted Workflow
-- Run on a fresh empty database.
-- ============================================================

-- ============================================================
-- 1. ROLES
-- ============================================================
CREATE TABLE roles (
  role_id   BIGINT       NOT NULL AUTO_INCREMENT,
  role_name VARCHAR(100) NOT NULL UNIQUE COMMENT 'SYSTEM_ADMIN | BRANCH_MANAGER | OPERATION_MANAGER | FIRST_EXECUTIVE_OFFICER | OFFICER | DELIVERY_PERSON',
  PRIMARY KEY (role_id)
);

-- ============================================================
-- 2. BRANCHES
-- ============================================================
CREATE TABLE branches (
  branch_id   BIGINT       NOT NULL AUTO_INCREMENT,
  branch_code VARCHAR(50)  NOT NULL UNIQUE,
  branch_name VARCHAR(255) NOT NULL,
  branch_type VARCHAR(50)  NOT NULL COMMENT 'AD_BRANCH | SUB_BRANCH | HQ',
  district    VARCHAR(100) NOT NULL,
  division    VARCHAR(100) NOT NULL,
  address     TEXT         NOT NULL,
  phone       VARCHAR(30),
  email       VARCHAR(255),
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (branch_id)
);

-- ============================================================
-- 3. DEPARTMENTS (Global Master List)
-- ============================================================
CREATE TABLE departments (
  department_id   BIGINT       NOT NULL AUTO_INCREMENT,
  department_name VARCHAR(255) NOT NULL UNIQUE,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (department_id)
);

-- ============================================================
-- 4. BRANCH_DEPARTMENTS (Which dept exists in which branch)
-- ============================================================
CREATE TABLE branch_departments (
  branch_id     BIGINT NOT NULL,
  department_id BIGINT NOT NULL,
  PRIMARY KEY (branch_id, department_id),
  FOREIGN KEY (branch_id)     REFERENCES branches(branch_id),
  FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- ============================================================
-- 5. ITEM_CATEGORIES (Each mapped to one responsible department)
-- ============================================================
CREATE TABLE item_categories (
  category_id       BIGINT       NOT NULL AUTO_INCREMENT,
  category_name     VARCHAR(255) NOT NULL UNIQUE,
  department_id     BIGINT       NULL COMMENT 'NULL = open access for all roles',
  sensitivity_level VARCHAR(50)  NOT NULL DEFAULT 'LOW' COMMENT 'LOW | MEDIUM | HIGH | CRITICAL',
  description       TEXT,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (category_id),
  FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- ============================================================
-- 6. USERS
-- ============================================================
CREATE TABLE users (
  user_id        BIGINT       NOT NULL AUTO_INCREMENT,
  employee_id    VARCHAR(50)  NOT NULL UNIQUE,
  full_name      VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  phone_number   VARCHAR(30),
  password_hash  TEXT         NOT NULL,
  role_id        BIGINT       NOT NULL,
  branch_id      BIGINT       NULL COMMENT 'NULL for SYSTEM_ADMIN and DELIVERY_PERSON (floating)',
  department_id  BIGINT       NULL COMMENT 'NULL for Manager-level roles and Delivery Person',
  is_available   BOOLEAN      NOT NULL DEFAULT TRUE COMMENT 'For DELIVERY_PERSON: TRUE=Available, FALSE=Busy',
  is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at  TIMESTAMP    NULL,
  PRIMARY KEY (user_id),
  FOREIGN KEY (role_id)       REFERENCES roles(role_id),
  FOREIGN KEY (branch_id)     REFERENCES branches(branch_id),
  FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- ============================================================
-- 7. TRANSFER_REQUESTS (Core workflow engine)
-- ============================================================
CREATE TABLE transfer_requests (
  request_id                BIGINT       NOT NULL AUTO_INCREMENT,
  request_code              VARCHAR(50)  NOT NULL UNIQUE COMMENT 'e.g. REQ-2026-001',
  title                     VARCHAR(255) NOT NULL,
  description               TEXT,
  category_id               BIGINT       NOT NULL,
  priority                  VARCHAR(50)  NOT NULL DEFAULT 'NORMAL' COMMENT 'NORMAL | HIGH | URGENT | CRITICAL',
  status                    VARCHAR(50)  NOT NULL DEFAULT 'PENDING_INTERNAL'
                            COMMENT 'PENDING_INTERNAL | PENDING_ASSIGNMENT | READY_FOR_PICKUP | IN_TRANSIT | DELIVERED | COMPLETED | REJECTED_ON_RECEIPT | CANCELLED',

  -- Source
  origin_branch_id          BIGINT       NOT NULL,
  origin_department_id      BIGINT       NULL,
  initiated_by_id           BIGINT       NOT NULL COMMENT 'Original requester — enforces Step 6 restriction',

  -- Step 1: Internal gatekeeper at source branch
  internal_approver_id      BIGINT       NULL COMMENT 'Manager/FEO who approved internally. NULL if bypassed.',

  -- Destination
  destination_branch_id     BIGINT       NOT NULL,
  destination_department_id BIGINT       NULL,

  -- Step 2: Dept staff at destination who accepts and assigns driver
  dept_acceptor_id          BIGINT       NULL,

  -- Step 3: Manager/FEO at destination who gives final green light
  final_releaser_id         BIGINT       NULL,

  -- Step 4 & 5: Logistics
  delivery_person_id        BIGINT       NULL,
  picked_up_at              TIMESTAMP    NULL,
  delivered_at              TIMESTAMP    NULL,

  -- Step 6: Closing
  final_note                TEXT         NULL COMMENT 'Required when status = REJECTED_ON_RECEIPT',
  closed_at                 TIMESTAMP    NULL,

  requested_at              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (request_id),
  FOREIGN KEY (category_id)               REFERENCES item_categories(category_id),
  FOREIGN KEY (origin_branch_id)          REFERENCES branches(branch_id),
  FOREIGN KEY (origin_department_id)      REFERENCES departments(department_id),
  FOREIGN KEY (destination_branch_id)     REFERENCES branches(branch_id),
  FOREIGN KEY (destination_department_id) REFERENCES departments(department_id),
  FOREIGN KEY (initiated_by_id)           REFERENCES users(user_id),
  FOREIGN KEY (internal_approver_id)      REFERENCES users(user_id),
  FOREIGN KEY (dept_acceptor_id)          REFERENCES users(user_id),
  FOREIGN KEY (final_releaser_id)         REFERENCES users(user_id),
  FOREIGN KEY (delivery_person_id)        REFERENCES users(user_id)
);

-- ============================================================
-- 8. AUDIT_LOGS (Immutable event trail)
-- ============================================================
CREATE TABLE audit_logs (
  audit_id    BIGINT       NOT NULL AUTO_INCREMENT,
  request_id  BIGINT       NULL,
  actor_id    BIGINT       NULL,
  action      VARCHAR(100) NOT NULL COMMENT 'CREATED | APPROVED_INTERNAL | ASSIGNED_DRIVER | RELEASED | PICKED_UP | DELIVERED | COMPLETED | REJECTED',
  from_status VARCHAR(50)  NULL,
  to_status   VARCHAR(50)  NULL,
  remarks     TEXT,
  ip_address  VARCHAR(50),
  acted_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (audit_id),
  FOREIGN KEY (request_id) REFERENCES transfer_requests(request_id),
  FOREIGN KEY (actor_id)   REFERENCES users(user_id)
);
