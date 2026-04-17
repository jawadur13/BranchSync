-- ============================================================
--  BranchSync Database Schema
--  Jamuna Bank PLC — Inter-Branch Coordination System
--  Database: PostgreSQL (Supabase)
--  Author: Md Jawadur Rafid (22203044)
--  Semester: Spring 2026
-- ============================================================


-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE branch_type_enum AS ENUM (
    'HQ',
    'REGIONAL',
    'BRANCH',
    'SUB_BRANCH'
);

CREATE TYPE sensitivity_level_enum AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);

CREATE TYPE request_type_enum AS ENUM (
    'BRANCH_TO_BRANCH',
    'BRANCH_TO_HQ',
    'HQ_TO_BRANCH'
);

CREATE TYPE priority_enum AS ENUM (
    'NORMAL',
    'HIGH',
    'URGENT',
    'CRITICAL'
);

CREATE TYPE transfer_status_enum AS ENUM (
    'DRAFT',
    'PENDING_APPROVAL',
    'APPROVED',
    'DISPATCHED',
    'IN_TRANSIT',
    'RECEIVED',
    'CONFIRMED',
    'CLOSED',
    'REJECTED',
    'ESCALATED',
    'CANCELLED'
);

CREATE TYPE unit_enum AS ENUM (
    'PIECE',
    'KG',
    'BUNDLE',
    'SET',
    'BDT'
);

CREATE TYPE condition_enum AS ENUM (
    'GOOD',
    'DAMAGED',
    'SEALED',
    'PARTIAL'
);

CREATE TYPE carrier_type_enum AS ENUM (
    'MESSENGER',
    'CIT',
    'COURIER',
    'INTERNAL_STAFF'
);

CREATE TYPE checkpoint_status_enum AS ENUM (
    'DEPARTED',
    'IN_TRANSIT',
    'ARRIVED'
);

CREATE TYPE approval_action_enum AS ENUM (
    'APPROVED',
    'REJECTED',
    'FORWARDED',
    'ESCALATED'
);

CREATE TYPE approval_scope_enum AS ENUM (
    'ORIGIN_BRANCH',
    'DESTINATION_BRANCH',
    'HQ'
);

CREATE TYPE escalation_reason_enum AS ENUM (
    'SLA_BREACH',
    'MANUAL',
    'SYSTEM_AUTO'
);

CREATE TYPE notification_type_enum AS ENUM (
    'APPROVAL_NEEDED',
    'STATUS_UPDATE',
    'ESCALATION',
    'SLA_WARNING',
    'SYSTEM'
);

CREATE TYPE audit_action_enum AS ENUM (
    'CREATE',
    'UPDATE',
    'APPROVE',
    'REJECT',
    'DISPATCH',
    'RECEIVE',
    'CONFIRM',
    'ESCALATE',
    'LOGIN',
    'LOGOUT',
    'PERMISSION_CHANGE'
);

CREATE TYPE permission_module_enum AS ENUM (
    'WORKFLOW',
    'TRANSFER',
    'AUDIT',
    'ADMIN'
);

CREATE TYPE category_name_enum AS ENUM (
    'CASH',
    'LOAN_FILE',
    'NEGOTIABLE_INSTRUMENT',
    'SECURITY_ITEM',
    'IT_EQUIPMENT',
    'INVENTORY',
    'REPORT',
    'CARD_CHEQUEBOOK',
    'VAULT_KEY'
);


-- ============================================================
-- SECTION 1: USER & ACCESS MANAGEMENT
-- ============================================================

-- 2. roles (created before users because users references it)
CREATE TABLE roles (
    role_id         SERIAL PRIMARY KEY,
    role_name       VARCHAR(100) NOT NULL UNIQUE,    -- e.g. BRANCH_MANAGER, CASH_OFFICER
    role_level      INT NOT NULL CHECK (role_level >= 1), -- 1 = highest authority
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. permissions
CREATE TABLE permissions (
    permission_id   SERIAL PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL UNIQUE,    -- e.g. INITIATE_TRANSFER
    module          permission_module_enum NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. role_permissions (junction table)
CREATE TABLE role_permissions (
    role_permission_id  SERIAL PRIMARY KEY,
    role_id             INT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id       INT NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
    UNIQUE (role_id, permission_id)
);

-- 5. branches (created before users because users references it)
CREATE TABLE branches (
    branch_id       SERIAL PRIMARY KEY,
    branch_code     VARCHAR(20) NOT NULL UNIQUE,     -- e.g. JBL-DHK-001
    branch_name     VARCHAR(150) NOT NULL,
    branch_type     branch_type_enum NOT NULL,
    district        VARCHAR(100) NOT NULL,
    division        VARCHAR(100) NOT NULL,
    address         TEXT NOT NULL,
    phone           VARCHAR(20),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1. users
CREATE TABLE users (
    user_id         SERIAL PRIMARY KEY,
    employee_id     VARCHAR(50) NOT NULL UNIQUE,     -- HR-assigned ID
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    phone_number    VARCHAR(20),
    password_hash   TEXT NOT NULL,
    role_id         INT NOT NULL REFERENCES roles(role_id) ON DELETE RESTRICT,
    branch_id       INT NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    department_id   INT,                             -- FK added after departments table
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ
);

-- 6. departments
CREATE TABLE departments (
    department_id   SERIAL PRIMARY KEY,
    department_name VARCHAR(150) NOT NULL,
    branch_id       INT REFERENCES branches(branch_id) ON DELETE RESTRICT,  -- NULL = HQ-level dept
    head_user_id    INT REFERENCES users(user_id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Now add the FK from users → departments
ALTER TABLE users
    ADD CONSTRAINT fk_users_department
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL;


-- ============================================================
-- SECTION 2: ITEM CATEGORIES
-- ============================================================

-- 7. item_categories
CREATE TABLE item_categories (
    category_id                 SERIAL PRIMARY KEY,
    category_name               category_name_enum NOT NULL UNIQUE,
    requires_dual_verification  BOOLEAN NOT NULL DEFAULT FALSE,
    requires_hq_approval        BOOLEAN NOT NULL DEFAULT FALSE,
    sensitivity_level           sensitivity_level_enum NOT NULL DEFAULT 'LOW',
    description                 TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- SECTION 3: TRANSFER CORE
-- ============================================================

-- 8. transfer_requests
CREATE TABLE transfer_requests (
    request_id              SERIAL PRIMARY KEY,
    request_code            VARCHAR(30) NOT NULL UNIQUE,     -- e.g. TRF-2026-00145
    category_id             INT NOT NULL REFERENCES item_categories(category_id) ON DELETE RESTRICT,
    request_type            request_type_enum NOT NULL,
    origin_branch_id        INT NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    destination_branch_id   INT NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    initiated_by            INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    priority                priority_enum NOT NULL DEFAULT 'NORMAL',
    status                  transfer_status_enum NOT NULL DEFAULT 'DRAFT',
    title                   VARCHAR(255) NOT NULL,
    description             TEXT,
    requested_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expected_delivery_date  DATE,
    closed_at               TIMESTAMPTZ,
    CONSTRAINT chk_different_branches CHECK (origin_branch_id <> destination_branch_id)
);

-- 9. transfer_items
CREATE TABLE transfer_items (
    item_id             SERIAL PRIMARY KEY,
    request_id          INT NOT NULL REFERENCES transfer_requests(request_id) ON DELETE CASCADE,
    item_name           VARCHAR(255) NOT NULL,
    item_description    TEXT,
    quantity            NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    unit                unit_enum NOT NULL,
    serial_number       VARCHAR(100),                -- for IT equipment, instruments
    condition_on_send   condition_enum NOT NULL DEFAULT 'GOOD',
    condition_on_receive condition_enum,             -- filled on receipt
    notes               TEXT
);


-- ============================================================
-- SECTION 4: CASH SPECIFIC
-- ============================================================

-- 10. cash_transfer_details
CREATE TABLE cash_transfer_details (
    cash_detail_id      SERIAL PRIMARY KEY,
    request_id          INT NOT NULL UNIQUE REFERENCES transfer_requests(request_id) ON DELETE CASCADE,
    total_amount_bdt    NUMERIC(18, 2) NOT NULL CHECK (total_amount_bdt > 0),

    -- Denomination breakdown (Bangladesh Taka)
    denomination_1000   INT NOT NULL DEFAULT 0 CHECK (denomination_1000 >= 0),
    denomination_500    INT NOT NULL DEFAULT 0 CHECK (denomination_500 >= 0),
    denomination_200    INT NOT NULL DEFAULT 0 CHECK (denomination_200 >= 0),
    denomination_100    INT NOT NULL DEFAULT 0 CHECK (denomination_100 >= 0),
    denomination_50     INT NOT NULL DEFAULT 0 CHECK (denomination_50 >= 0),
    denomination_20     INT NOT NULL DEFAULT 0 CHECK (denomination_20 >= 0),
    denomination_10     INT NOT NULL DEFAULT 0 CHECK (denomination_10 >= 0),
    denomination_5      INT NOT NULL DEFAULT 0 CHECK (denomination_5 >= 0),
    denomination_2      INT NOT NULL DEFAULT 0 CHECK (denomination_2 >= 0),
    denomination_1      INT NOT NULL DEFAULT 0 CHECK (denomination_1 >= 0),

    sealed_bag_count    INT NOT NULL DEFAULT 0 CHECK (sealed_bag_count >= 0),
    bag_serial_numbers  TEXT,                        -- comma-separated or JSON
    cit_agent_name      VARCHAR(150),
    cit_company         VARCHAR(150),

    -- Ensure denominations sum matches total
    CONSTRAINT chk_denomination_sum CHECK (
        (denomination_1000 * 1000 +
         denomination_500  * 500  +
         denomination_200  * 200  +
         denomination_100  * 100  +
         denomination_50   * 50   +
         denomination_20   * 20   +
         denomination_10   * 10   +
         denomination_5    * 5    +
         denomination_2    * 2    +
         denomination_1    * 1) = total_amount_bdt
    )
);


-- ============================================================
-- SECTION 5: APPROVAL & WORKFLOW
-- ============================================================

-- 11. approval_chains
CREATE TABLE approval_chains (
    chain_id            SERIAL PRIMARY KEY,
    category_id         INT NOT NULL REFERENCES item_categories(category_id) ON DELETE CASCADE,
    priority_level      priority_enum NOT NULL DEFAULT 'NORMAL',
    step_number         INT NOT NULL CHECK (step_number >= 1),
    required_role_id    INT NOT NULL REFERENCES roles(role_id) ON DELETE RESTRICT,
    approval_scope      approval_scope_enum NOT NULL,
    description         TEXT,
    UNIQUE (category_id, priority_level, step_number)  -- no duplicate steps per category+priority
);

-- 12. approval_logs
CREATE TABLE approval_logs (
    approval_log_id SERIAL PRIMARY KEY,
    request_id      INT NOT NULL REFERENCES transfer_requests(request_id) ON DELETE CASCADE,
    step_number     INT NOT NULL CHECK (step_number >= 1),
    approver_id     INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    action          approval_action_enum NOT NULL,
    comments        TEXT,
    acted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address      INET                                -- security: record IP
);


-- ============================================================
-- SECTION 6: DISPATCH & TRANSIT
-- ============================================================

-- 13. dispatch_records
CREATE TABLE dispatch_records (
    dispatch_id     SERIAL PRIMARY KEY,
    request_id      INT NOT NULL UNIQUE REFERENCES transfer_requests(request_id) ON DELETE CASCADE,
    dispatched_by   INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    dispatched_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    carrier_type    carrier_type_enum NOT NULL,
    carrier_name    VARCHAR(150) NOT NULL,
    carrier_phone   VARCHAR(20),
    vehicle_number  VARCHAR(50),                     -- nullable, for CIT vehicles
    estimated_arrival TIMESTAMPTZ,
    dispatch_notes  TEXT,
    witness_user_id INT REFERENCES users(user_id) ON DELETE SET NULL  -- Security Guard
);

-- 14. transit_checkpoints
CREATE TABLE transit_checkpoints (
    checkpoint_id       SERIAL PRIMARY KEY,
    dispatch_id         INT NOT NULL REFERENCES dispatch_records(dispatch_id) ON DELETE CASCADE,
    checked_by          INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    checkpoint_location VARCHAR(255) NOT NULL,
    status              checkpoint_status_enum NOT NULL,
    checked_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes               TEXT
);


-- ============================================================
-- SECTION 7: RECEIPT & DUAL VERIFICATION
-- ============================================================

-- 15. receipt_records
CREATE TABLE receipt_records (
    receipt_id                      SERIAL PRIMARY KEY,
    request_id                      INT NOT NULL UNIQUE REFERENCES transfer_requests(request_id) ON DELETE CASCADE,
    received_by                     INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    received_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    condition_noted                 condition_enum NOT NULL,
    receiver_notes                  TEXT,

    -- Dual Verification: Origin side (sender confirms they sent)
    origin_confirmation_by          INT REFERENCES users(user_id) ON DELETE SET NULL,
    origin_confirmed_at             TIMESTAMPTZ,

    -- Dual Verification: Destination side (receiver confirms they got it)
    destination_confirmation_by     INT REFERENCES users(user_id) ON DELETE SET NULL,
    destination_confirmed_at        TIMESTAMPTZ,

    -- Auto-set by trigger when both confirmations are present
    dual_verification_complete      BOOLEAN NOT NULL DEFAULT FALSE
);


-- ============================================================
-- SECTION 8: SLA & ESCALATION
-- ============================================================

-- 16. sla_policies
CREATE TABLE sla_policies (
    sla_id                  SERIAL PRIMARY KEY,
    category_id             INT NOT NULL REFERENCES item_categories(category_id) ON DELETE CASCADE,
    priority_level          priority_enum NOT NULL,
    max_approval_hours      INT NOT NULL CHECK (max_approval_hours > 0),
    max_transit_hours       INT NOT NULL CHECK (max_transit_hours > 0),
    max_confirmation_hours  INT NOT NULL CHECK (max_confirmation_hours > 0),
    escalation_role_id      INT NOT NULL REFERENCES roles(role_id) ON DELETE RESTRICT,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (category_id, priority_level)
);

-- 17. escalation_logs
CREATE TABLE escalation_logs (
    escalation_id           SERIAL PRIMARY KEY,
    request_id              INT NOT NULL REFERENCES transfer_requests(request_id) ON DELETE CASCADE,
    escalated_from_user_id  INT REFERENCES users(user_id) ON DELETE SET NULL,
    escalated_to_user_id    INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    reason                  escalation_reason_enum NOT NULL,
    escalated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at             TIMESTAMPTZ,
    resolution_notes        TEXT
);


-- ============================================================
-- SECTION 9: NOTIFICATIONS
-- ============================================================

-- 18. notifications
CREATE TABLE notifications (
    notification_id     SERIAL PRIMARY KEY,
    recipient_user_id   INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    request_id          INT REFERENCES transfer_requests(request_id) ON DELETE SET NULL,  -- nullable for system notifs
    type                notification_type_enum NOT NULL,
    title               VARCHAR(255) NOT NULL,
    message             TEXT NOT NULL,
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at             TIMESTAMPTZ
);


-- ============================================================
-- SECTION 10: AUDIT (IMMUTABLE)
-- ============================================================

-- 19. audit_logs
CREATE TABLE audit_logs (
    audit_id        BIGSERIAL PRIMARY KEY,           -- BIGSERIAL for high volume
    request_id      INT REFERENCES transfer_requests(request_id) ON DELETE SET NULL,
    actor_user_id   INT REFERENCES users(user_id) ON DELETE SET NULL,  -- NULL = system action
    action_type     audit_action_enum NOT NULL,
    entity_name     VARCHAR(100) NOT NULL,            -- which table was affected
    entity_id       INT NOT NULL,                    -- which record was affected
    old_value       JSONB,                           -- snapshot before change
    new_value       JSONB,                           -- snapshot after change
    ip_address      INET,
    user_agent      TEXT,
    acted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- INDEXES
-- ============================================================

-- users
CREATE INDEX idx_users_role_id        ON users(role_id);
CREATE INDEX idx_users_branch_id      ON users(branch_id);
CREATE INDEX idx_users_department_id  ON users(department_id);
CREATE INDEX idx_users_is_active      ON users(is_active);

-- role_permissions
CREATE INDEX idx_role_permissions_role_id        ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id  ON role_permissions(permission_id);

-- branches
CREATE INDEX idx_branches_branch_type  ON branches(branch_type);
CREATE INDEX idx_branches_division     ON branches(division);
CREATE INDEX idx_branches_district     ON branches(district);

-- departments
CREATE INDEX idx_departments_branch_id    ON departments(branch_id);
CREATE INDEX idx_departments_head_user_id ON departments(head_user_id);

-- transfer_requests
CREATE INDEX idx_transfer_requests_status           ON transfer_requests(status);
CREATE INDEX idx_transfer_requests_category_id      ON transfer_requests(category_id);
CREATE INDEX idx_transfer_requests_origin_branch    ON transfer_requests(origin_branch_id);
CREATE INDEX idx_transfer_requests_dest_branch      ON transfer_requests(destination_branch_id);
CREATE INDEX idx_transfer_requests_initiated_by     ON transfer_requests(initiated_by);
CREATE INDEX idx_transfer_requests_priority         ON transfer_requests(priority);
CREATE INDEX idx_transfer_requests_requested_at     ON transfer_requests(requested_at DESC);

-- transfer_items
CREATE INDEX idx_transfer_items_request_id ON transfer_items(request_id);

-- approval_chains
CREATE INDEX idx_approval_chains_category_id ON approval_chains(category_id);
CREATE INDEX idx_approval_chains_role_id     ON approval_chains(required_role_id);

-- approval_logs
CREATE INDEX idx_approval_logs_request_id  ON approval_logs(request_id);
CREATE INDEX idx_approval_logs_approver_id ON approval_logs(approver_id);
CREATE INDEX idx_approval_logs_acted_at    ON approval_logs(acted_at DESC);

-- dispatch_records
CREATE INDEX idx_dispatch_records_request_id    ON dispatch_records(request_id);
CREATE INDEX idx_dispatch_records_dispatched_by ON dispatch_records(dispatched_by);

-- transit_checkpoints
CREATE INDEX idx_transit_checkpoints_dispatch_id ON transit_checkpoints(dispatch_id);
CREATE INDEX idx_transit_checkpoints_checked_at  ON transit_checkpoints(checked_at DESC);

-- receipt_records
CREATE INDEX idx_receipt_records_request_id   ON receipt_records(request_id);
CREATE INDEX idx_receipt_records_received_by  ON receipt_records(received_by);

-- escalation_logs
CREATE INDEX idx_escalation_logs_request_id         ON escalation_logs(request_id);
CREATE INDEX idx_escalation_logs_escalated_to        ON escalation_logs(escalated_to_user_id);
CREATE INDEX idx_escalation_logs_escalated_at        ON escalation_logs(escalated_at DESC);

-- notifications
CREATE INDEX idx_notifications_recipient_user_id ON notifications(recipient_user_id);
CREATE INDEX idx_notifications_is_read           ON notifications(is_read);
CREATE INDEX idx_notifications_sent_at           ON notifications(sent_at DESC);

-- audit_logs
CREATE INDEX idx_audit_logs_request_id    ON audit_logs(request_id);
CREATE INDEX idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_action_type   ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_entity_name   ON audit_logs(entity_name);
CREATE INDEX idx_audit_logs_acted_at      ON audit_logs(acted_at DESC);


-- ============================================================
-- TRIGGERS
-- ============================================================

-- TRIGGER 1: Prevent UPDATE and DELETE on audit_logs (immutable)
CREATE OR REPLACE FUNCTION fn_prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs is immutable. UPDATE and DELETE operations are not permitted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_logs_no_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION fn_prevent_audit_log_modification();

CREATE TRIGGER trg_audit_logs_no_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION fn_prevent_audit_log_modification();


-- TRIGGER 2: Auto-set dual_verification_complete when both confirmations are present
CREATE OR REPLACE FUNCTION fn_check_dual_verification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.origin_confirmation_by IS NOT NULL AND
       NEW.origin_confirmed_at IS NOT NULL AND
       NEW.destination_confirmation_by IS NOT NULL AND
       NEW.destination_confirmed_at IS NOT NULL THEN
        NEW.dual_verification_complete := TRUE;
    ELSE
        NEW.dual_verification_complete := FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_receipt_dual_verification
    BEFORE INSERT OR UPDATE ON receipt_records
    FOR EACH ROW EXECUTE FUNCTION fn_check_dual_verification();


-- TRIGGER 3: Auto-update updated_at on users table
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ============================================================
-- SEED DATA: Roles
-- ============================================================

INSERT INTO roles (role_name, role_level, description) VALUES
('SYSTEM_ADMIN',            1, 'Full system access, user and role management'),
('HEAD_OF_OPERATIONS',      2, 'HQ top-level approver, receives escalations'),
('COMPLIANCE_OFFICER',      2, 'Audit log access, compliance review'),
('INTERNAL_AUDITOR',        2, 'Read-only access to audit and transfer history'),
('IT_DEPARTMENT',           3, 'IT equipment management, user provisioning'),
('BRANCH_MANAGER',          3, 'Branch-level approvals and monitoring'),
('FIRST_EXECUTIVE_OFFICER', 3, 'Supervisor role, branch-level operations and approvals'),
('OPERATION_MANAGER',       4, 'Day-to-day workflow supervision, dispatch'),
('CASH_OFFICER',            5, 'Cash requisition initiation and confirmation'),
('LOAN_OFFICER',            5, 'Loan file transfer initiation and tracking'),
('GENERAL_BANKING_OFFICER', 5, 'Document and general request handling'),
('FOREIGN_EXCHANGE_OFFICER',5, 'Forex-related inter-branch coordination'),
('CSO',                     6, 'Customer service, limited request initiation'),
('MESSENGER',               7, 'Dispatch confirmation, physical carrier'),
('SECURITY_GUARD',          7, 'Witness role for high-sensitivity transfers');


-- ============================================================
-- SEED DATA: Item Categories
-- ============================================================

INSERT INTO item_categories (category_name, requires_dual_verification, requires_hq_approval, sensitivity_level, description) VALUES
('CASH',                    TRUE,  TRUE,  'CRITICAL', 'Physical Taka cash transfers between branches or HQ'),
('LOAN_FILE',               TRUE,  FALSE, 'HIGH',     'Physical loan application folders and credit documents'),
('NEGOTIABLE_INSTRUMENT',   TRUE,  TRUE,  'HIGH',     'Pay Orders, Demand Drafts, FDR certificates'),
('SECURITY_ITEM',           TRUE,  TRUE,  'CRITICAL', 'Blank cheque leaves, stamps, security seals'),
('IT_EQUIPMENT',            FALSE, TRUE,  'MEDIUM',   'Laptops, modems, POS machines, tokens'),
('INVENTORY',               FALSE, FALSE, 'LOW',      'Stationery, toner, printed forms, office supplies'),
('REPORT',                  FALSE, FALSE, 'MEDIUM',   'Statutory and compliance reports for submission'),
('CARD_CHEQUEBOOK',         TRUE,  FALSE, 'HIGH',     'Printed cheque books and debit/credit cards'),
('VAULT_KEY',               TRUE,  TRUE,  'CRITICAL', 'Vault keys and dual-control items, emergency only');


-- ============================================================
-- END OF SCHEMA
-- ============================================================