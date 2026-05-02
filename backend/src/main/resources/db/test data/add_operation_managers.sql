-- 1. Add the OPERATION_MANAGER role to the system
INSERT IGNORE INTO roles (role_name, role_level, description)
VALUES ('OPERATION_MANAGER', 2, 'Manages operations at the branch level, not tied to a specific department.');

-- 2. Add one Operation Manager user to every single branch (except HQ)
-- Their department_id is intentionally left as NULL.
-- The default password is '123456'
INSERT IGNORE INTO users (employee_id, full_name, email, password_hash, role_id, branch_id, department_id, is_active)
SELECT 
    CONCAT('OM-', branch_code),
    CONCAT('Operation Manager ', branch_code),
    CONCAT('om.', email),
    'jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=',
    (SELECT role_id FROM roles WHERE role_name = 'OPERATION_MANAGER'),
    branch_id,
    NULL, -- No department association
    TRUE
FROM branches 
WHERE branch_type != 'HQ';
