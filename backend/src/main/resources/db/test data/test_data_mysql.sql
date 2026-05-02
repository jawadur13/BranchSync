-- MySQL Test Data Script
-- Run this in phpMyAdmin AFTER the schema is created

-- 1. POPULATE ROLES
INSERT IGNORE INTO roles (role_name, role_level, description) VALUES
('SYSTEM_ADMIN', 100, 'Global System Administrator with God Mode access'),
('FIRST_EXECUTIVE_OFFICER', 80, 'HQ Level Officer for approvals and oversight'),
('BRANCH_MANAGER', 60, 'Branch Head with local approval authority'),
('BRANCH_STAFF', 20, 'Regular branch employee');

-- 2. POPULATE ITEM CATEGORIES
INSERT IGNORE INTO item_categories (category_name, requires_dual_verification, requires_hq_approval, sensitivity_level) VALUES
('CASH', true, true, 'CRITICAL'),
('DOCUMENTS', false, false, 'NORMAL'),
('IT_ASSETS', true, false, 'HIGH'),
('STATIONERY', false, false, 'LOW');

-- 3. POPULATE BRANCHES
INSERT IGNORE INTO branches (branch_code, branch_name, branch_type, district, division, address, phone, email) VALUES
('MAIN001', 'Jamuna Bank Head Office', 'HQ', 'Dhaka', 'Dhaka', 'Dilkusha C/A', '02-955', 'hq@jamunabank.com.bd'),
('GUL002', 'Gulshan Branch', 'AD_BRANCH', 'Dhaka', 'Dhaka', 'Gulshan Circle 1', '02-882', 'gulshan@jamunabank.com.bd'),
('MOT003', 'Motijheel Branch', 'URBAN_BRANCH', 'Dhaka', 'Dhaka', 'Motijheel C/A', '02-956', 'motijheel@jamunabank.com.bd'),
('CTG004', 'Agrabad Branch', 'AD_BRANCH', 'Chittagong', 'Chittagong', 'Agrabad C/A', '031-711', 'agrabad@jamunabank.com.bd');

-- 4. POPULATE DEPARTMENTS
INSERT IGNORE INTO departments (department_name, branch_id) 
SELECT 'Cash Department', branch_id FROM branches WHERE branch_code IN ('MAIN001', 'GUL002', 'MOT003', 'CTG004');

INSERT IGNORE INTO departments (department_name, branch_id) 
SELECT 'IT Department', branch_id FROM branches WHERE branch_code = 'MAIN001';

INSERT IGNORE INTO departments (department_name, branch_id) 
SELECT 'Operations', branch_id FROM branches WHERE branch_code IN ('GUL002', 'CTG004');

INSERT IGNORE INTO departments (department_name, branch_id) 
SELECT 'Clearing Department', branch_id FROM branches WHERE branch_code = 'MOT003';

-- 5. POPULATE USERS (Password for all is '123456')
INSERT IGNORE INTO users (employee_id, full_name, email, password_hash, role_id, branch_id, department_id)
VALUES 
-- HQ FEO (First Executive Officer)
('FEO001', 'Md. Hasan Ali', 'hasan@jamunabank.com', 'jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=', 
  (SELECT role_id FROM roles WHERE role_name = 'FIRST_EXECUTIVE_OFFICER'), 
  (SELECT branch_id FROM branches WHERE branch_code = 'MAIN001'),
  (SELECT department_id FROM departments WHERE department_name = 'IT Department' AND branch_id = (SELECT branch_id FROM branches WHERE branch_code = 'MAIN001') LIMIT 1)),

-- Gulshan Branch Manager
('MGR002', 'Sarah Rahman', 'sarah@jamunabank.com', 'jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=', 
  (SELECT role_id FROM roles WHERE role_name = 'BRANCH_MANAGER'), 
  (SELECT branch_id FROM branches WHERE branch_code = 'GUL002'),
  (SELECT department_id FROM departments WHERE department_name = 'Cash Department' AND branch_id = (SELECT branch_id FROM branches WHERE branch_code = 'GUL002') LIMIT 1)),

-- Motijheel Cash Staff
('STF003', 'Rafiqul Islam', 'rafiq@jamunabank.com', 'jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=', 
  (SELECT role_id FROM roles WHERE role_name = 'BRANCH_STAFF'), 
  (SELECT branch_id FROM branches WHERE branch_code = 'MOT003'),
  (SELECT department_id FROM departments WHERE department_name = 'Cash Department' AND branch_id = (SELECT branch_id FROM branches WHERE branch_code = 'MOT003') LIMIT 1)),

-- System Admin
('ADMIN001', 'System Administrator', 'admin@jamunabank.com', 'jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=', 
  (SELECT role_id FROM roles WHERE role_name = 'SYSTEM_ADMIN'), 
  (SELECT branch_id FROM branches WHERE branch_code = 'MAIN001'),
  (SELECT department_id FROM departments WHERE department_name = 'IT Department' AND branch_id = (SELECT branch_id FROM branches WHERE branch_code = 'MAIN001') LIMIT 1));
