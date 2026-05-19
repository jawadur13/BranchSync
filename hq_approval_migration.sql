-- ============================================================
-- BranchSync: HQ Approval Step Migration
-- MySQL / MariaDB compatible (XAMPP)
-- Run this in phpMyAdmin > branchsync database > SQL tab
-- ============================================================

-- 1. Add the new role for HQ Central Logistics Control officers
--    INSERT IGNORE skips silently if role_name already exists
INSERT IGNORE INTO roles (role_name) VALUES ('HQ_LOGISTICS_OFFICER');

-- 2. Add is_hq_only flag to departments
ALTER TABLE departments
    ADD COLUMN IF NOT EXISTS is_hq_only BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Add HQ approval columns to transfer_requests
ALTER TABLE transfer_requests
    ADD COLUMN IF NOT EXISTS hq_approver_id    BIGINT NULL,
    ADD COLUMN IF NOT EXISTS hq_approved_at    DATETIME(6) NULL,
    ADD COLUMN IF NOT EXISTS hq_rejection_note LONGTEXT NULL;

-- 4. Add foreign key from hq_approver_id to users
ALTER TABLE transfer_requests
    ADD CONSTRAINT fk_tr_hq_approver
    FOREIGN KEY (hq_approver_id) REFERENCES users(user_id);

-- 5. Create the 'Central Logistics Control' department (HQ-only)
--    INSERT IGNORE skips if department_name already exists (unique constraint)
INSERT IGNORE INTO departments (department_name, is_hq_only, created_at)
VALUES ('Central Logistics Control', TRUE, NOW());

-- 6. Make destination_branch_id nullable to support deferred HQ routing
ALTER TABLE transfer_requests
    MODIFY COLUMN destination_branch_id BIGINT NULL;

-- ============================================================
-- VERIFY: Run these SELECT statements to confirm it worked
-- ============================================================
-- SELECT role_name FROM roles WHERE role_name = 'HQ_LOGISTICS_OFFICER';
-- SELECT department_name, is_hq_only FROM departments WHERE department_name = 'Central Logistics Control';
-- SHOW COLUMNS FROM transfer_requests LIKE 'hq_%';
-- SHOW COLUMNS FROM departments LIKE 'is_hq_only';

-- ============================================================
-- AFTER RUNNING SQL - Manual steps in your app:
-- 1. Find your HQ branch:
--    SELECT branch_id, branch_name FROM branches WHERE branch_type = 'HQ';
-- 2. Assign 'Central Logistics Control' dept to HQ branch via
--    Admin > Branches > Edit HQ branch
-- 3. Create HQ officer users via Admin > User Management
--    with role = HQ_LOGISTICS_OFFICER
-- ============================================================
