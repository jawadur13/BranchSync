package com.jamunabank.branchsync.model.enums;

public enum CategoryBehavior {
    /**
     * Physical cash in sealed bundles. Uses vault balance tracking,
     * denomination breakdowns, cash ledger, and manual adjustment approvals.
     */
    CASH,

    /**
     * Countable operational assets (chairs, forms, equipment, etc.).
     * Uses branch stock balances, stock ledger, and manual adjustment approvals.
     * Stock reduces on pickup and increases on delivery, reversed on rejection.
     */
    STOCK,

    /**
     * Customer-specific documents and files (KYC, account forms, signed docs).
     * No quantity tracking. Uses the plain transfer workflow only.
     */
    DOCUMENT_CASE
}
