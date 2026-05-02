-- Extended Test Data Script for Jamuna Bank
-- Run this in phpMyAdmin in your branchsync database to generate a massive amount of realistic data.

-- 1. ADD NEW BRANCHES (Across the nation, all types)
INSERT IGNORE INTO branches (branch_code, branch_name, branch_type, district, division, address, phone, email) VALUES
('SYL005', 'Sylhet Regional Office', 'REGIONAL', 'Sylhet', 'Sylhet', 'Zindabazar', '0821-711', 'sylhet.reg@jamunabank.com'),
('RAJ006', 'Rajshahi Regional Office', 'REGIONAL', 'Rajshahi', 'Rajshahi', 'Saheb Bazar', '0721-772', 'raj.reg@jamunabank.com'),
('KHU007', 'Khulna Regional Office', 'REGIONAL', 'Khulna', 'Khulna', 'Shib Bari More', '041-723', 'khulna.reg@jamunabank.com'),
('MIR008', 'Mirpur Branch', 'BRANCH', 'Dhaka', 'Dhaka', 'Mirpur 10', '02-901', 'mirpur@jamunabank.com'),
('BAN009', 'Banani Branch', 'BRANCH', 'Dhaka', 'Dhaka', 'Banani 11', '02-987', 'banani@jamunabank.com'),
('SAV010', 'Savar Sub-Branch', 'SUB_BRANCH', 'Dhaka', 'Dhaka', 'Savar Bazar', '02-774', 'savar@jamunabank.com'),
('UTT011', 'Uttara Sub-Branch', 'SUB_BRANCH', 'Dhaka', 'Dhaka', 'Sector 7', '02-895', 'uttara@jamunabank.com'),
('COX012', 'Coxs Bazar Branch', 'BRANCH', 'Coxs Bazar', 'Chittagong', 'Kolatoli', '0341-632', 'cox@jamunabank.com'),
('BOG013', 'Bogra Sub-Branch', 'SUB_BRANCH', 'Bogra', 'Rajshahi', 'Sathmatha', '051-662', 'bogra@jamunabank.com');

-- 2. ADD NEW DEPARTMENTS TO NEW BRANCHES
-- REGIONAL and BRANCH types get 5 departments each
INSERT IGNORE INTO departments (department_name, branch_id) 
SELECT dept_name, branch_id 
FROM branches 
CROSS JOIN (
    SELECT 'Cash Department' AS dept_name UNION ALL 
    SELECT 'Operations' UNION ALL 
    SELECT 'Customer Service' UNION ALL 
    SELECT 'Clearing Department' UNION ALL 
    SELECT 'Loan Department'
) AS depts
WHERE branch_code IN ('SYL005', 'RAJ006', 'KHU007', 'MIR008', 'BAN009', 'COX012');

-- SUB_BRANCH types get limited departments (Only Cash and Customer Service)
INSERT IGNORE INTO departments (department_name, branch_id) 
SELECT dept_name, branch_id 
FROM branches 
CROSS JOIN (
    SELECT 'Cash Department' AS dept_name UNION ALL 
    SELECT 'Customer Service'
) AS depts
WHERE branch_code IN ('SAV010', 'UTT011', 'BOG013');

-- 3. POPULATE USERS (Password '123456' for all)
-- A) Adding Managers to each new regular & regional branch
INSERT IGNORE INTO users (employee_id, full_name, email, password_hash, role_id, branch_id, department_id)
SELECT CONCAT('MGR-', branch_code), CONCAT('Manager of ', branch_name), email, 'jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=',
  (SELECT role_id FROM roles WHERE role_name = 'BRANCH_MANAGER'),
  branch_id,
  (SELECT department_id FROM departments WHERE branch_id = branches.branch_id AND department_name = 'Operations' LIMIT 1)
FROM branches WHERE branch_code IN ('SYL005', 'RAJ006', 'KHU007', 'MIR008', 'BAN009', 'COX012');

-- B) Adding In-Charge to each Sub-Branch
INSERT IGNORE INTO users (employee_id, full_name, email, password_hash, role_id, branch_id, department_id)
SELECT CONCAT('MGR-', branch_code), CONCAT('In-Charge of ', branch_name), email, 'jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=',
  (SELECT role_id FROM roles WHERE role_name = 'BRANCH_MANAGER'),
  branch_id,
  (SELECT department_id FROM departments WHERE branch_id = branches.branch_id AND department_name = 'Customer Service' LIMIT 1)
FROM branches WHERE branch_code IN ('SAV010', 'UTT011', 'BOG013');

-- C) Adding Staff to Cash Departments (2 Staff per branch)
INSERT IGNORE INTO users (employee_id, full_name, email, password_hash, role_id, branch_id, department_id)
SELECT CONCAT('CASH1-', branch_code), CONCAT('Senior Cashier ', branch_code), CONCAT('cash1.', email), 'jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=',
  (SELECT role_id FROM roles WHERE role_name = 'BRANCH_STAFF'),
  branch_id,
  (SELECT department_id FROM departments WHERE branch_id = branches.branch_id AND department_name = 'Cash Department' LIMIT 1)
FROM branches WHERE branch_code NOT IN ('MAIN001', 'GUL002', 'MOT003', 'CTG004');

INSERT IGNORE INTO users (employee_id, full_name, email, password_hash, role_id, branch_id, department_id)
SELECT CONCAT('CASH2-', branch_code), CONCAT('Junior Cashier ', branch_code), CONCAT('cash2.', email), 'jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=',
  (SELECT role_id FROM roles WHERE role_name = 'BRANCH_STAFF'),
  branch_id,
  (SELECT department_id FROM departments WHERE branch_id = branches.branch_id AND department_name = 'Cash Department' LIMIT 1)
FROM branches WHERE branch_code NOT IN ('MAIN001', 'GUL002', 'MOT003', 'CTG004');

-- D) Adding Staff to Operations (2 Staff per branch for branches that have Operations)
INSERT IGNORE INTO users (employee_id, full_name, email, password_hash, role_id, branch_id, department_id)
SELECT CONCAT('OPS1-', branch_code), CONCAT('Ops Officer ', branch_code), CONCAT('ops1.', email), 'jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=',
  (SELECT role_id FROM roles WHERE role_name = 'BRANCH_STAFF'),
  branch_id,
  (SELECT department_id FROM departments WHERE branch_id = branches.branch_id AND department_name = 'Operations' LIMIT 1)
FROM branches WHERE branch_code IN ('SYL005', 'RAJ006', 'KHU007', 'MIR008', 'BAN009', 'COX012');

INSERT IGNORE INTO users (employee_id, full_name, email, password_hash, role_id, branch_id, department_id)
SELECT CONCAT('OPS2-', branch_code), CONCAT('Ops Exec ', branch_code), CONCAT('ops2.', email), 'jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=',
  (SELECT role_id FROM roles WHERE role_name = 'BRANCH_STAFF'),
  branch_id,
  (SELECT department_id FROM departments WHERE branch_id = branches.branch_id AND department_name = 'Operations' LIMIT 1)
FROM branches WHERE branch_code IN ('SYL005', 'RAJ006', 'KHU007', 'MIR008', 'BAN009', 'COX012');

-- E) Adding First Executive Officers (FEOs) exclusively to Regional Branches
INSERT IGNORE INTO users (employee_id, full_name, email, password_hash, role_id, branch_id, department_id)
SELECT CONCAT('FEO-', branch_code), CONCAT('Regional FEO ', district), CONCAT('feo.', email), 'jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=',
  (SELECT role_id FROM roles WHERE role_name = 'FIRST_EXECUTIVE_OFFICER'),
  branch_id,
  (SELECT department_id FROM departments WHERE branch_id = branches.branch_id AND department_name = 'Operations' LIMIT 1)
FROM branches WHERE branch_type = 'REGIONAL';
