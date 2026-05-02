-- 1. Add Department ID to Item Categories
ALTER TABLE item_categories ADD COLUMN department_id BIGINT;
ALTER TABLE item_categories ADD CONSTRAINT fk_item_categories_department FOREIGN KEY (department_id) REFERENCES departments(department_id);

-- 2. Map existing categories to logical departments
-- Note: These department names should exist in your 'departments' table
UPDATE item_categories 
SET department_id = (SELECT department_id FROM departments WHERE department_name = 'Cash Operations' LIMIT 1) 
WHERE category_name = 'CASH';

UPDATE item_categories 
SET department_id = (SELECT department_id FROM departments WHERE department_name = 'General Banking' LIMIT 1) 
WHERE category_name IN ('STATIONERY', 'MARKETING_MATERIALS');

UPDATE item_categories 
SET department_id = (SELECT department_id FROM departments WHERE department_name = 'IT Support' LIMIT 1) 
WHERE category_name = 'IT_EQUIPMENT';

UPDATE item_categories 
SET department_id = (SELECT department_id FROM departments WHERE department_name = 'Security & Vault' LIMIT 1) 
WHERE category_name = 'SECURITY_DOCUMENTS';
