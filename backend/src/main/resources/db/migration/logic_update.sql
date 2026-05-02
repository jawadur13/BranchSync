SET FOREIGN_KEY_CHECKS = 0;

-- 1. MAKE DEPARTMENTS GLOBAL
-- Drop the existing foreign key linking departments directly to a branch
-- Note: MySQL usually names the first foreign key 'departments_ibfk_1'.
ALTER TABLE departments DROP FOREIGN KEY departments_ibfk_1;
ALTER TABLE departments DROP COLUMN branch_id;

-- 2. CREATE BRANCH-DEPARTMENTS MAPPING
-- This allows the Admin to assign master departments to specific branches
CREATE TABLE branch_departments (
    branch_id BIGINT NOT NULL,
    department_id BIGINT NOT NULL,
    PRIMARY KEY (branch_id, department_id),
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE
);

-- 3. CREATE DEPARTMENT-ITEMS MAPPING
-- This maps your item_categories (the master list of items) to specific departments
CREATE TABLE department_item_categories (
    department_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    PRIMARY KEY (department_id, category_id),
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES item_categories(category_id) ON DELETE CASCADE
);

-- 4. ALLOW FLOATING USERS (DELIVERY STAFF)
-- By allowing branch_id to be NULL, Delivery Persons don't have to belong to a branch
ALTER TABLE users MODIFY branch_id BIGINT NULL;

-- 5. UPDATE TRANSFER REQUESTS FOR NEW WORKFLOW
-- Add a column to assign a specific Delivery Person
-- Add a column for the final accept/reject note from the requestor
ALTER TABLE transfer_requests
ADD COLUMN delivery_person_id BIGINT NULL,
ADD COLUMN final_note TEXT NULL,
ADD FOREIGN KEY (delivery_person_id) REFERENCES users(user_id);

SET FOREIGN_KEY_CHECKS = 1;
