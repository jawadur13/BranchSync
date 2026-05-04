-- ============================================================
-- BranchSync: Test Data (MySQL)
-- Run AFTER schema_mysql.sql
-- Passwords are BCrypt hash of "password123" for all test users
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. ROLES
-- ============================================================
INSERT INTO roles (role_name) VALUES
('SYSTEM_ADMIN'),
('FIRST_EXECUTIVE_OFFICER'),
('BRANCH_MANAGER'),
('OPERATION_MANAGER'),
('OFFICER'),
('DELIVERY_PERSON');

-- ============================================================
-- 2. BRANCHES (5 branches across Bangladesh)
-- ============================================================
INSERT INTO branches (branch_code, branch_name, branch_type, district, division, address, phone, email) VALUES
('HQ-001',    'Head Office - Motijheel',       'HQ',         'Dhaka',      'Dhaka',     'Dilkusha C/A, Motijheel, Dhaka-1000',              '02-9550123', 'hq@jamunabank.com'),
('BR-DHK-001','Dhaka Main Branch',             'AD_BRANCH',  'Dhaka',      'Dhaka',     'Mirpur Road, Dhanmondi, Dhaka-1205',               '02-8120456', 'dhaka.main@jamunabank.com'),
('BR-CTG-001','Chittagong Agrabad Branch',     'AD_BRANCH',  'Chattogram', 'Chattogram','Agrabad Commercial Area, Chattogram-4100',         '031-714552', 'ctg.agrabad@jamunabank.com'),
('BR-SYL-001','Sylhet Zindabazar Branch',      'AD_BRANCH',  'Sylhet',     'Sylhet',    'Zindabazar, Sylhet-3100',                          '0821-718920','sylhet@jamunabank.com'),
('BR-RAJ-001','Rajshahi Station Road Branch',  'SUB_BRANCH', 'Rajshahi',   'Rajshahi',  'Station Road, Rajshahi-6000',                      '0721-812345','rajshahi@jamunabank.com'),
('BR-KHL-001','Khulna KDA Branch',             'SUB_BRANCH', 'Khulna',     'Khulna',    'KDA Avenue, Khulna-9100',                          '041-723456', 'khulna@jamunabank.com');

-- ============================================================
-- 3. DEPARTMENTS (Global Master List)
-- ============================================================
INSERT INTO departments (department_name) VALUES
('Cash Operations'),
('IT Department'),
('General Administration'),
('Security & Compliance'),
('Human Resources'),
('Customer Service');

-- ============================================================
-- 4. BRANCH_DEPARTMENTS
-- HQ (1) gets all departments
-- Dhaka Main (2) gets all departments
-- Chittagong (3) gets: Cash Ops, IT, General Admin, Customer Service
-- Sylhet (4) gets: Cash Ops, General Admin, Customer Service
-- Rajshahi (5) gets: Cash Ops, General Admin
-- Khulna (6) gets: Cash Ops, General Admin
-- ============================================================
INSERT INTO branch_departments (branch_id, department_id) VALUES
-- HQ (branch_id = 1)
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6),
-- Dhaka Main (branch_id = 2)
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6),
-- Chittagong (branch_id = 3)
(3, 1), (3, 2), (3, 3), (3, 6),
-- Sylhet (branch_id = 4)
(4, 1), (4, 3), (4, 6),
-- Rajshahi (branch_id = 5)
(5, 1), (5, 3),
-- Khulna (branch_id = 6)
(6, 1), (6, 3);

-- ============================================================
-- 5. ITEM_CATEGORIES (Mapped to departments)
-- dept_id: 1=Cash Ops, 2=IT, 3=General Admin, 4=Security
-- ============================================================
INSERT INTO item_categories (category_name, department_id, sensitivity_level, description) VALUES
('Cash Bundle',            1, 'CRITICAL', 'Physical cash in sealed bags for branch settlement'),
('Cheque Books',           1, 'HIGH',     'Blank cheque books for customer issuance'),
('Demand Draft',           1, 'HIGH',     'Demand draft documents for inter-branch transfer'),
('Laptop',                 2, 'HIGH',     'Employee laptops and workstations'),
('Network Equipment',      2, 'MEDIUM',   'Routers, switches, and network accessories'),
('Office Printer',         2, 'MEDIUM',   'Laser and inkjet printers'),
('Stationery Pack',        3, 'LOW',      'General office stationery bundle'),
('Printed Forms',          3, 'LOW',      'Pre-printed official bank forms'),
('Office Furniture',       3, 'LOW',      'Chairs, desks, and minor office items'),
('Security Badge',         4, 'HIGH',     'Access control badges for staff'),
('CCTV Equipment',         4, 'CRITICAL', 'Surveillance cameras and recording equipment'),
('First Aid Kit',          NULL, 'LOW',   'Medical first aid supplies, open access');

-- ============================================================
-- 6. USERS
-- All passwords = BCrypt("password123")
-- role_id: 1=ADMIN, 2=FEO, 3=BRANCH_MANAGER, 4=OP_MANAGER, 5=OFFICER, 6=DELIVERY
-- ============================================================

-- System Admin (no branch, no dept)
INSERT INTO users (employee_id, full_name, email, phone_number, password_hash, role_id, branch_id, department_id, is_available) VALUES
('EMP-000', 'System Administrator', 'admin@jamunabank.com', '01700000000', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 1, NULL, NULL, TRUE);

-- FEO at HQ (branch 1, no dept)
INSERT INTO users (employee_id, full_name, email, phone_number, password_hash, role_id, branch_id, department_id, is_available) VALUES
('EMP-001', 'Ahmed Karim FEO',    'feo1@jamunabank.com',  '01711111111', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 2, 1, NULL, TRUE),
('EMP-002', 'Nasrin Akter FEO',   'feo2@jamunabank.com',  '01711111122', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 2, 2, NULL, TRUE);

-- Branch Managers (branch managers per branch, no dept)
INSERT INTO users (employee_id, full_name, email, phone_number, password_hash, role_id, branch_id, department_id, is_available) VALUES
('EMP-101', 'Rafiqul Islam',      'mgr.hq@jamunabank.com',  '01722221101', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 3, 1, NULL, TRUE),
('EMP-102', 'Fatema Khanam',      'mgr.dhk@jamunabank.com', '01722221102', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 3, 2, NULL, TRUE),
('EMP-103', 'Shafiqul Hassan',    'mgr.ctg@jamunabank.com', '01722221103', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 3, 3, NULL, TRUE),
('EMP-104', 'Momena Begum',       'mgr.syl@jamunabank.com', '01722221104', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 3, 4, NULL, TRUE),
('EMP-105', 'Jahangir Alam',      'mgr.raj@jamunabank.com', '01722221105', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 3, 5, NULL, TRUE),
('EMP-106', 'Shahida Parvin',     'mgr.khl@jamunabank.com', '01722221106', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 3, 6, NULL, TRUE);

-- Operation Managers (one per major branch, no dept)
INSERT INTO users (employee_id, full_name, email, phone_number, password_hash, role_id, branch_id, department_id, is_available) VALUES
('EMP-201', 'Mizanur Rahman',     'om.hq@jamunabank.com',   '01733331201', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 4, 1, NULL, TRUE),
('EMP-202', 'Khaleda Akter',      'om.dhk@jamunabank.com',  '01733331202', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 4, 2, NULL, TRUE),
('EMP-203', 'Nurul Huda',         'om.ctg@jamunabank.com',  '01733331203', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 4, 3, NULL, TRUE),
('EMP-204', 'Saleha Begum',       'om.syl@jamunabank.com',  '01733331204', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 4, 4, NULL, TRUE);

-- Officers / Dept Staff
-- HQ Branch (branch 1) - Cash Ops (dept 1), IT (dept 2), General Admin (dept 3)
INSERT INTO users (employee_id, full_name, email, phone_number, password_hash, role_id, branch_id, department_id, is_available) VALUES
('EMP-301', 'Karim Hossain',      'karim.hq@jamunabank.com',   '01744440301', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 5, 1, 1, TRUE),
('EMP-302', 'Rina Begum',         'rina.hq@jamunabank.com',    '01744440302', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 5, 1, 2, TRUE),
('EMP-303', 'Tanvir Ahmed',       'tanvir.hq@jamunabank.com',  '01744440303', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 5, 1, 3, TRUE),
('EMP-304', 'Sabrina Islam',      'sabrina.hq@jamunabank.com', '01744440304', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 5, 1, 1, TRUE),
('EMP-305', 'Rashed Khan',        'rashed.hq@jamunabank.com',  '01744440305', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 5, 1, 4, TRUE);

-- Dhaka Main Branch (branch 2) - all depts
INSERT INTO users (employee_id, full_name, email, phone_number, password_hash, role_id, branch_id, department_id, is_available) VALUES
('EMP-311', 'Monira Akter',       'monira.dhk@jamunabank.com', '01744440311', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 5, 2, 1, TRUE),
('EMP-312', 'Raihan Uddin',       'raihan.dhk@jamunabank.com', '01744440312', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 5, 2, 2, TRUE),
('EMP-313', 'Popy Khatun',        'popy.dhk@jamunabank.com',   '01744440313', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 5, 2, 3, TRUE),
('EMP-314', 'Nasim Hossain',      'nasim.dhk@jamunabank.com',  '01744440314', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 5, 2, 1, TRUE),
('EMP-315', 'Sharmin Jahan',      'sharmin.dhk@jamunabank.com','01744440315', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 5, 2, 6, TRUE);

-- Chittagong Branch (branch 3)
INSERT INTO users (employee_id, full_name, email, phone_number, password_hash, role_id, branch_id, department_id, is_available) VALUES
('EMP-321', 'Arif Hossain',       'arif.ctg@jamunabank.com',   '01744440321', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 5, 3, 1, TRUE),
('EMP-322', 'Sumaiya Khatun',     'sumaiya.ctg@jamunabank.com','01744440322', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 5, 3, 2, TRUE),
('EMP-323', 'Jahirul Islam',      'jahirul.ctg@jamunabank.com','01744440323', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 5, 3, 3, TRUE);

-- Sylhet Branch (branch 4)
INSERT INTO users (employee_id, full_name, email, phone_number, password_hash, role_id, branch_id, department_id, is_available) VALUES
('EMP-331', 'Munmun Akter',       'munmun.syl@jamunabank.com', '01744440331', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 5, 4, 1, TRUE),
('EMP-332', 'Touhid Mia',         'touhid.syl@jamunabank.com', '01744440332', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 5, 4, 3, TRUE);

-- Rajshahi Branch (branch 5)
INSERT INTO users (employee_id, full_name, email, phone_number, password_hash, role_id, branch_id, department_id, is_available) VALUES
('EMP-341', 'Maksuda Begum',      'maksuda.raj@jamunabank.com','01744440341', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 5, 5, 1, TRUE),
('EMP-342', 'Selim Reza',         'selim.raj@jamunabank.com',  '01744440342', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 5, 5, 3, TRUE);

-- Khulna Branch (branch 6)
INSERT INTO users (employee_id, full_name, email, phone_number, password_hash, role_id, branch_id, department_id, is_available) VALUES
('EMP-351', 'Hafiza Khanam',      'hafiza.khl@jamunabank.com', '01744440351', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 5, 6, 1, TRUE),
('EMP-352', 'Nazmul Haq',         'nazmul.khl@jamunabank.com', '01744440352', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 5, 6, 3, TRUE);

-- Floating Delivery Persons (no branch, no dept)
INSERT INTO users (employee_id, full_name, email, phone_number, password_hash, role_id, branch_id, department_id, is_available) VALUES
('DRV-001', 'Rubel Hossain',      'drv1@jamunabank.com', '01755551001', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 6, NULL, NULL, TRUE),
('DRV-002', 'Faruk Ahmed',        'drv2@jamunabank.com', '01755551002', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 6, NULL, NULL, TRUE),
('DRV-003', 'Shamim Mia',         'drv3@jamunabank.com', '01755551003', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 6, NULL, NULL, TRUE),
('DRV-004', 'Khorshed Alam',      'drv4@jamunabank.com', '01755551004', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 6, NULL, NULL, TRUE),
('DRV-005', 'Biplob Kumar Das',   'drv5@jamunabank.com', '01755551005', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVwc6mDhm', 6, NULL, NULL, FALSE);
-- DRV-005 is intentionally set as BUSY/FALSE to test the availability filter in Step 2

SET FOREIGN_KEY_CHECKS = 1;
