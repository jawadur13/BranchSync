-- 1. Add the DELIVERY_PERSON role
INSERT IGNORE INTO roles (role_name, role_level, description)
VALUES ('DELIVERY_PERSON', 1, 'Floating staff responsible for moving items between branches. Not tied to any specific branch.');

-- 2. Add some test Delivery Persons (Floating)
-- branch_id and department_id are NULL
INSERT IGNORE INTO users (employee_id, full_name, email, password_hash, role_id, branch_id, department_id, is_active)
VALUES 
('DEL-001', 'Delivery Agent Kamal', 'kamal.del@jamunabank.com', 'jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=', (SELECT role_id FROM roles WHERE role_name = 'DELIVERY_PERSON'), NULL, NULL, 1),
('DEL-002', 'Delivery Agent Sumon', 'sumon.del@jamunabank.com', 'jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=', (SELECT role_id FROM roles WHERE role_name = 'DELIVERY_PERSON'), NULL, NULL, 1),
('DEL-003', 'Delivery Agent Rahim', 'rahim.del@jamunabank.com', 'jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=', (SELECT role_id FROM roles WHERE role_name = 'DELIVERY_PERSON'), NULL, NULL, 1);
