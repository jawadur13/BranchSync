-- ============================================================
-- BranchSync: Behavior-Based Item Handling & Stock Tracking Migration
-- MySQL / MariaDB compatible (XAMPP / phpMyAdmin)
-- Run this in phpMyAdmin > branchsync database > SQL tab
-- ============================================================

-- 1. Add behavior_type column to item_categories
ALTER TABLE item_categories
    ADD COLUMN IF NOT EXISTS behavior_type VARCHAR(20) NOT NULL DEFAULT 'DOCUMENT_CASE';

-- 2. Initialize behavior_type for existing categories
UPDATE item_categories 
SET behavior_type = 'CASH' 
WHERE category_name = 'Cash Bundle';

UPDATE item_categories 
SET behavior_type = 'DOCUMENT_CASE' 
WHERE behavior_type IS NULL OR behavior_type = '';

-- 3. Create stock_items table
CREATE TABLE IF NOT EXISTS stock_items (
    stock_item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT NOT NULL,
    item_code VARCHAR(100) NOT NULL UNIQUE,
    item_name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
    description TEXT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_si_category FOREIGN KEY (category_id) REFERENCES item_categories(category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. Create branch_stock_balances table
CREATE TABLE IF NOT EXISTS branch_stock_balances (
    branch_stock_balance_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    stock_item_id BIGINT NOT NULL,
    current_quantity INT NOT NULL DEFAULT 0,
    last_updated_at DATETIME(6) NULL,
    CONSTRAINT fk_bsb_branch FOREIGN KEY (branch_id) REFERENCES branches(branch_id),
    CONSTRAINT fk_bsb_stock_item FOREIGN KEY (stock_item_id) REFERENCES stock_items(stock_item_id),
    CONSTRAINT uq_branch_stock_item UNIQUE (branch_id, stock_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 5. Add stock fields to transfer_requests
ALTER TABLE transfer_requests
    ADD COLUMN IF NOT EXISTS stock_item_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS quantity INT NULL;

ALTER TABLE transfer_requests
    ADD CONSTRAINT fk_tr_stock_item FOREIGN KEY (stock_item_id) REFERENCES stock_items(stock_item_id);

-- 6. Create stock_ledger_entries table
CREATE TABLE IF NOT EXISTS stock_ledger_entries (
    ledger_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    stock_item_id BIGINT NOT NULL,
    entry_type VARCHAR(40) NOT NULL COMMENT 'TRANSFER_OUT | TRANSFER_IN | REVERSAL_IN | REVERSAL_OUT | MANUAL_ADJUSTMENT',
    request_id BIGINT NULL,
    quantity INT NOT NULL,
    balance_before INT NOT NULL,
    balance_after INT NOT NULL,
    actor_id BIGINT NULL,
    approver_id BIGINT NULL,
    reason TEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_sle_branch FOREIGN KEY (branch_id) REFERENCES branches(branch_id),
    CONSTRAINT fk_sle_stock_item FOREIGN KEY (stock_item_id) REFERENCES stock_items(stock_item_id),
    CONSTRAINT fk_sle_request FOREIGN KEY (request_id) REFERENCES transfer_requests(request_id) ON DELETE SET NULL,
    CONSTRAINT fk_sle_actor FOREIGN KEY (actor_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_sle_approver FOREIGN KEY (approver_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 7. Create stock_manual_adjustments table
CREATE TABLE IF NOT EXISTS stock_manual_adjustments (
    adjustment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    stock_item_id BIGINT NOT NULL,
    quantity INT NOT NULL COMMENT 'Positive = credit, negative = debit',
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING | APPROVED | REJECTED',
    submitted_by_id BIGINT NULL,
    submitted_at DATETIME(6) NULL,
    approved_by_id BIGINT NULL,
    decided_at DATETIME(6) NULL,
    decision_note TEXT NULL,
    CONSTRAINT fk_sma_branch FOREIGN KEY (branch_id) REFERENCES branches(branch_id),
    CONSTRAINT fk_sma_stock_item FOREIGN KEY (stock_item_id) REFERENCES stock_items(stock_item_id),
    CONSTRAINT fk_sma_submitter FOREIGN KEY (submitted_by_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_sma_approver FOREIGN KEY (approved_by_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- VERIFY: Run these statements to confirm schema alterations
-- ============================================================
-- SHOW COLUMNS FROM item_categories LIKE 'behavior_type';
-- SELECT category_name, behavior_type FROM item_categories;
-- SHOW COLUMNS FROM transfer_requests LIKE 'stock_item_id';
-- SHOW COLUMNS FROM transfer_requests LIKE 'quantity';
-- SHOW TABLES LIKE 'stock%';
