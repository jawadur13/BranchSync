package com.jamunabank.branchsync.model.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

/**
 * Immutable audit trail for all stock quantity movements at a branch.
 *
 * This is the stock equivalent of CashLedgerEntry.
 * Every change to BranchStockBalance creates one StockLedgerEntry.
 *
 * Entry types:
 *   TRANSFER_OUT     - quantity reduced at sending branch (on pickup)
 *   TRANSFER_IN      - quantity increased at receiving branch (on delivery)
 *   REVERSAL_IN      - quantity returned to sending branch (rejected receipt)
 *   REVERSAL_OUT     - quantity reversed from receiving branch (rejected receipt)
 *   MANUAL_ADJUSTMENT - approved manual addition or removal by officer
 */
@Entity
@Table(name = "stock_ledger")
public class StockLedgerEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ledger_id")
    private Long ledgerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_item_id", nullable = false)
    private StockItem stockItem;

    @Column(name = "entry_type", nullable = false, length = 40)
    private String entryType;

    /**
     * The transfer request that triggered this movement, if applicable.
     * Null for manual adjustments.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id")
    private TransferRequest transferRequest;

    /**
     * Absolute quantity involved in this movement. Always positive.
     * Use entryType to determine direction.
     */
    @Column(name = "quantity", nullable = false)
    private int quantity;

    @Column(name = "balance_before", nullable = false)
    private int balanceBefore;

    @Column(name = "balance_after", nullable = false)
    private int balanceAfter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    /**
     * The manager/FEO who approved a manual adjustment. Null for transfer movements.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id")
    private User approver;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public StockLedgerEntry() {}

    public Long getLedgerId() { return ledgerId; }
    public void setLedgerId(Long ledgerId) { this.ledgerId = ledgerId; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
    public StockItem getStockItem() { return stockItem; }
    public void setStockItem(StockItem stockItem) { this.stockItem = stockItem; }
    public String getEntryType() { return entryType; }
    public void setEntryType(String entryType) { this.entryType = entryType; }
    public TransferRequest getTransferRequest() { return transferRequest; }
    public void setTransferRequest(TransferRequest transferRequest) { this.transferRequest = transferRequest; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public int getBalanceBefore() { return balanceBefore; }
    public void setBalanceBefore(int balanceBefore) { this.balanceBefore = balanceBefore; }
    public int getBalanceAfter() { return balanceAfter; }
    public void setBalanceAfter(int balanceAfter) { this.balanceAfter = balanceAfter; }
    public User getActor() { return actor; }
    public void setActor(User actor) { this.actor = actor; }
    public User getApprover() { return approver; }
    public void setApprover(User approver) { this.approver = approver; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
