-- ============================================================
-- Cash Stock Tracking Migration
-- Adds: branch_cash_balance, cash_transfer_denominations,
--        cash_ledger, cash_manual_adjustments
-- Also alters: transfer_requests (requested_amount, denominations_submitted)
-- ============================================================

-- 1. Add cash-specific columns to transfer_requests
ALTER TABLE transfer_requests
    ADD COLUMN requested_amount     DECIMAL(18,2)   NULL COMMENT 'Cash Bundle: amount requested by origin branch',
    ADD COLUMN denominations_submitted TINYINT(1)   NOT NULL DEFAULT 0 COMMENT 'Cash Bundle: whether dest branch submitted denomination breakdown';

-- 2. Branch cash balance (one row per branch, live running total)
CREATE TABLE branch_cash_balance (
    branch_id       BIGINT          NOT NULL,
    current_balance DECIMAL(18,2)   NOT NULL DEFAULT 0.00,
    last_updated_at DATETIME(6)     NULL,
    PRIMARY KEY (branch_id),
    CONSTRAINT fk_bcb_branch FOREIGN KEY (branch_id) REFERENCES branches (branch_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Live cash balance per branch — updated on every transfer/adjustment';

-- 3. Denomination breakdown per Cash Bundle transfer request
CREATE TABLE cash_transfer_denominations (
    denomination_id BIGINT          NOT NULL AUTO_INCREMENT,
    request_id      BIGINT          NOT NULL,
    denomination    INT             NOT NULL COMMENT 'Note face value e.g. 1000, 500, 200',
    quantity        INT             NOT NULL,
    subtotal        DECIMAL(18,2)   NOT NULL COMMENT 'denomination × quantity',
    submitted_by_id BIGINT          NULL,
    submitted_at    DATETIME(6)     NULL,
    PRIMARY KEY (denomination_id),
    CONSTRAINT fk_ctd_request   FOREIGN KEY (request_id)      REFERENCES transfer_requests (request_id) ON DELETE CASCADE,
    CONSTRAINT fk_ctd_submitter FOREIGN KEY (submitted_by_id) REFERENCES users (user_id)              ON DELETE SET NULL,
    INDEX idx_ctd_request (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Per-denomination note quantities submitted by destination branch for Cash Bundle transfers';

-- 4. Immutable cash ledger — all balance movements recorded here
CREATE TABLE cash_ledger (
    ledger_id       BIGINT          NOT NULL AUTO_INCREMENT,
    branch_id       BIGINT          NOT NULL,
    entry_type      VARCHAR(40)     NOT NULL COMMENT 'TRANSFER_OUT | TRANSFER_IN | REVERSAL_IN | REVERSAL_OUT | MANUAL_ADJUSTMENT',
    request_id      BIGINT          NULL,
    amount          DECIMAL(18,2)   NOT NULL,
    balance_before  DECIMAL(18,2)   NOT NULL,
    balance_after   DECIMAL(18,2)   NOT NULL,
    actor_id        BIGINT          NULL,
    approver_id     BIGINT          NULL,
    reason          TEXT            NULL,
    created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (ledger_id),
    CONSTRAINT fk_cl_branch   FOREIGN KEY (branch_id)   REFERENCES branches          (branch_id)  ON DELETE RESTRICT,
    CONSTRAINT fk_cl_request  FOREIGN KEY (request_id)  REFERENCES transfer_requests (request_id) ON DELETE SET NULL,
    CONSTRAINT fk_cl_actor    FOREIGN KEY (actor_id)    REFERENCES users             (user_id)    ON DELETE SET NULL,
    CONSTRAINT fk_cl_approver FOREIGN KEY (approver_id) REFERENCES users             (user_id)    ON DELETE SET NULL,
    INDEX idx_cl_branch   (branch_id),
    INDEX idx_cl_request  (request_id),
    INDEX idx_cl_created  (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable audit-ready cash ledger — no updates, only inserts';

-- 5. Manual adjustment requests — two-step flow (Officer submits → Manager approves)
CREATE TABLE cash_manual_adjustments (
    adjustment_id   BIGINT          NOT NULL AUTO_INCREMENT,
    branch_id       BIGINT          NOT NULL,
    amount          DECIMAL(18,2)   NOT NULL COMMENT 'Positive = credit, negative = debit',
    reason          TEXT            NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING | APPROVED | REJECTED',
    submitted_by_id BIGINT          NULL,
    submitted_at    DATETIME(6)     NULL,
    approved_by_id  BIGINT          NULL,
    decided_at      DATETIME(6)     NULL,
    decision_note   TEXT            NULL,
    PRIMARY KEY (adjustment_id),
    CONSTRAINT fk_cma_branch    FOREIGN KEY (branch_id)       REFERENCES branches (branch_id) ON DELETE RESTRICT,
    CONSTRAINT fk_cma_submitter FOREIGN KEY (submitted_by_id) REFERENCES users    (user_id)   ON DELETE SET NULL,
    CONSTRAINT fk_cma_approver  FOREIGN KEY (approved_by_id)  REFERENCES users    (user_id)   ON DELETE SET NULL,
    INDEX idx_cma_branch  (branch_id),
    INDEX idx_cma_status  (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Manual cash balance adjustments requiring manager approval';
