package com.jamunabank.branchsync.model.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

/**
 * Pending approval request for a manual stock quantity correction.
 *
 * This is the stock equivalent of CashManualAdjustment.
 *
 * Flow:
 *   1. An OFFICER of the relevant department submits an adjustment (quantity > 0 = add, < 0 = remove).
 *   2. A BRANCH_MANAGER or FIRST_EXECUTIVE_OFFICER at the same branch approves or rejects.
 *   3. On approval, BranchStockBalance is updated and a StockLedgerEntry is recorded.
 *   4. On rejection, no stock balance changes.
 *
 * A debit (negative quantity) is validated against current stock at submission and again at approval.
 */
@Entity
@Table(name = "stock_manual_adjustments")
public class StockManualAdjustment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "adjustment_id")
    private Long adjustmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_item_id", nullable = false)
    private StockItem stockItem;

    /**
     * Signed quantity. Positive = add stock, Negative = remove stock.
     */
    @Column(name = "quantity", nullable = false)
    private int quantity;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    /**
     * PENDING → APPROVED or REJECTED
     */
    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by_id")
    private User submittedBy;

    @Column(name = "submitted_at")
    private OffsetDateTime submittedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    @Column(name = "decided_at")
    private OffsetDateTime decidedAt;

    @Column(name = "decision_note", columnDefinition = "TEXT")
    private String decisionNote;

    public StockManualAdjustment() {}

    public Long getAdjustmentId() { return adjustmentId; }
    public void setAdjustmentId(Long adjustmentId) { this.adjustmentId = adjustmentId; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
    public StockItem getStockItem() { return stockItem; }
    public void setStockItem(StockItem stockItem) { this.stockItem = stockItem; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public User getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(User submittedBy) { this.submittedBy = submittedBy; }
    public OffsetDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(OffsetDateTime submittedAt) { this.submittedAt = submittedAt; }
    public User getApprovedBy() { return approvedBy; }
    public void setApprovedBy(User approvedBy) { this.approvedBy = approvedBy; }
    public OffsetDateTime getDecidedAt() { return decidedAt; }
    public void setDecidedAt(OffsetDateTime decidedAt) { this.decidedAt = decidedAt; }
    public String getDecisionNote() { return decisionNote; }
    public void setDecisionNote(String decisionNote) { this.decisionNote = decisionNote; }
}
