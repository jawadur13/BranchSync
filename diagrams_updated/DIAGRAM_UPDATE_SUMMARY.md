# DIAGRAM UPDATE SUMMARY

This document provides a comprehensive summary of all updates made to the BranchSync system architecture diagrams to align them with the **current implemented codebase** (which includes cash ledger, stock ledger, denominations, HQ routing, manual adjustments, and category behavior architecture).

All updated diagrams are located inside the `diagrams_updated/` folder. The original `diagrams/` folder remains untouched.

---

### 1. `branchsync_erd_figma.svg`
* **Status**: Updated (Critical)
* **Changes Made**:
  * Added **7 new tables** representing the full ledger and vault system: `branch_cash_balance`, `cash_ledger`, `cash_transfer_denominations`, `cash_manual_adjustments`, `stock_items`, `branch_stock_balance`, `stock_ledger`, `stock_manual_adjustments`.
  * Added missing columns on `transfer_requests`: `hq_approver_id`, `hq_approved_at`, `hq_rejection_note`, `requested_amount`, `denominations_submitted`, `stock_item_id`, `quantity`, `requested_at`.
  * Added `behavior_type` to `item_categories` to represent the run-time category mapping (CASH, STOCK, DOCUMENT_CASE).
  * Maintained high visual fidelity and exact foreign key relations.
* **Reason for Change**: Original ERD was modeled before cash and stock tracking were implemented, completely omitting the ledger tracking mechanism.

---

### 2. `branchsync_class_diagram_figma.svg`
* **Status**: Updated (Critical)
* **Changes Made**:
  * Added **7 new domain entity classes** with exact matching attributes and method signatures: `BranchCashBalance`, `CashLedgerEntry`, `CashManualAdjustment`, `CashTransferDenomination`, `StockItem`, `BranchStockBalance`, `StockLedgerEntry`, `StockManualAdjustment`.
  * Added `hqVerify()`, `releaseFinal()`, `pickup()`, and `deliver()` methods to `TransferRequest`.
  * Added behavior mapping and sensitivity parameters to matching classes.
* **Reason for Change**: Original class diagram only reflected initial core entities and lacked modern operational workflow services and tracking tables.

---

### 3. `branchsync_use_case_figma.svg`
* **Status**: Updated (High)
* **Changes Made**:
  * Added **HQ Logistics Officer** actor and their unique use cases (HQ Verify & Route Transfer).
  * Added use cases for ledger viewing: `View Cash Ledger` and `View Stock Ledger`.
  * Added use cases for manual adjustments: `Submit Cash Adjustment`, `Submit Stock Adjustment`, and `Approve/Reject Adjustment`.
  * Added use cases for denomination handling: `Submit Denominations`.
  * Added admin and core directory use cases: `Manage Stock Items (SKUs)`, `View Branch Directory`, and `Print Reports / Slips`.
* **Reason for Change**: Original use case diagram completely ignored HQ Logistics officers, vault adjustments, ledger reviews, and denomination management.

---

### 4. `branchsync_sequence_figma.svg`
* **Status**: Updated (High)
* **Changes Made**:
  * Expanded the simple sequence diagram into a highly descriptive **5-phase, 32-step trace diagram**.
  * Added two new lifelines: `Cash / Stock Service` and `Action Logger`.
  * Fully mapped:
    * **Phase 1: Login & Authentication** (JWT extraction and validation).
    * **Phase 2: Create Transfer Request** (PENDING_INTERNAL initiation).
    * **Phase 3: Internal Approval & HQ Routing** (PENDING_HQ_APPROVAL and PENDING_ASSIGNMENT).
    * **Phase 4: Acceptance, Release, Pickup & Delivery** (Driver allocation, denomination submission, debiting/crediting of vault/SKU).
    * **Phase 5: Requester Verification & Closing** (Reversal logging on rejection).
* **Reason for Change**: Original sequence diagram omitted 5 out of 8 steps in the current workflow, including HQ routing, supplier allocations, ledger updates, and rejection-reversal logic.

---

### 5. `branchsync_swimlane_figma.svg`
* **Status**: Updated (High)
* **Changes Made**:
  * Added **HQ Logistics Officer** lane as the 6th workflow lane.
  * Added the mandatory `PENDING_HQ_APPROVAL` and `PENDING_ASSIGNMENT` states.
  * Added debit/credit vault/SKU audit triggers during driver pickup and delivery steps.
  * Added rejection-handling logic with mandatory note requirement and reversal log entries (`REVERSAL_IN`, `REVERSAL_OUT`).
* **Reason for Change**: Original swimlane diagram was missing the HQ Routing stage and the ledger balancing triggers.

---

### 6. `activity_diagram_transfer_workflow.svg`
* **Status**: Updated (High)
* **Changes Made**:
  * Added HQ Logistics lane and HQ routing decisions.
  * Corrected all 8 lifecycle statuses: `PENDING_INTERNAL`, `PENDING_HQ_APPROVAL`, `PENDING_ASSIGNMENT`, `PENDING_FINAL_RELEASE`, `READY_FOR_PICKUP`, `IN_TRANSIT`, `DELIVERED`, and terminal states `COMPLETED` / `REJECTED_ON_RECEIPT`.
  * Added ledger balance updating annotations at pickup/delivery and reversal entries at rejection.
  * Removed fictional "Cancelled" state.
* **Reason for Change**: Original activity diagram used incorrect states and failed to represent ledger actions and the HQ verification step.

---

### 7. `activity_diagram_system_admin.svg`
* **Status**: Updated (Medium)
* **Changes Made**:
  * Added parallel branch for **Stock Item (SKU) Management** under item category mapping.
  * Added Category Behavior type configuration (CASH/STOCK/DOCUMENT_CASE) to category creation.
  * Removed fictional "Update Audit Logs" step (since admin configurations are not recorded in user audit logs).
* **Reason for Change**: Original diagram lacked Stock Item catalog management and the Category Behavior Type selection.

---

### 8. `dfd_level_0.svg`
* **Status**: Updated (Medium)
* **Changes Made**:
  * Added **HQ Logistics Officer** as a 5th external entity.
  * Mapped "Routing Decisions & Branch Assignments" and "Pending HQ Queue & Vault Balance Info" data flows.
  * Labeled manual adjustment flows on the Branch Manager entity.
* **Reason for Change**: The context diagram was missing the HQ Logistics actor and their corresponding data flows.

---

### 9. `dfd_level_1.svg`
* **Status**: Updated (High)
* **Changes Made**:
  * Added processes **5.0 Cash Vault Management** and **6.0 Stock Inventory Management**.
  * Added data stores **D5: Cash Vault DB** and **D6: Stock Inventory DB**.
  * Connected HQ Logistics routing and balance checks to central processes.
* **Reason for Change**: Original DFD Level 1 completely ignored vault and inventory tracking, representing only basic users and generic transfers.

---

### 10. `dfd_level_2_admin.svg`
* **Status**: Updated (Medium)
* **Changes Made**:
  * Added process **2.5 Stock Item (SKU) Management**.
  * Added **D6: Stock Items Catalog** data store.
  * Added Category Behavior Configuration markers on item category management.
  * Removed fictional "Integrity Check" process.
* **Reason for Change**: Failed to capture catalog definition of SKUs under STOCK categories.

---

### 11. `dfd_level_2_transfer.svg`
* **Status**: Updated (High)
* **Changes Made**:
  * Added process **3.3 HQ Verify & Route** between internal approval and destination acceptance.
  * Connected **D5: Cash Vault DB** and **D6: Stock Inventory DB** to pickup, delivery, and rejection-reversal steps.
  * Corrected transfer statuses in processing nodes to match backend enums.
* **Reason for Change**: Completely missed HQ verify phase and ledger database updates.

---

### 12. `activity_diagram_user_security.svg`
* **Status**: Copied Unchanged
* **Changes Made**: None (Copied from original `diagrams/` folder).
* **Reason for Change**: Already represents the current JWT + SHA-256 password hash security implementation with absolute accuracy.
