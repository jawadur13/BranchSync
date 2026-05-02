-- Script to remove department associations for branch leadership roles
-- Run this in phpMyAdmin to update your existing data

UPDATE users 
SET department_id = NULL 
WHERE role_id IN (
    SELECT role_id FROM roles WHERE role_name IN ('BRANCH_MANAGER', 'FIRST_EXECUTIVE_OFFICER', 'OPERATION_MANAGER')
);
