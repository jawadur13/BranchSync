package com.jamunabank.branchsync.model.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

/**
 * Tracks the current operational stock quantity of a specific StockItem at a specific Branch.
 *
 * This is the stock equivalent of BranchCashBalance.
 * One record exists per (branch, stockItem) pair, created on first movement if absent.
 *
 * currentQuantity is the live, approved stock count.
 * Pending manual adjustments do NOT affect this value until approved.
 */
@Entity
@Table(
    name = "branch_stock_balance",
    uniqueConstraints = @UniqueConstraint(columnNames = {"branch_id", "stock_item_id"})
)
public class BranchStockBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "balance_id")
    private Long balanceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_item_id", nullable = false)
    private StockItem stockItem;

    @Column(name = "current_quantity", nullable = false)
    private int currentQuantity = 0;

    @Column(name = "last_updated_at")
    private OffsetDateTime lastUpdatedAt;

    public BranchStockBalance() {}

    public Long getBalanceId() { return balanceId; }
    public void setBalanceId(Long balanceId) { this.balanceId = balanceId; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
    public StockItem getStockItem() { return stockItem; }
    public void setStockItem(StockItem stockItem) { this.stockItem = stockItem; }
    public int getCurrentQuantity() { return currentQuantity; }
    public void setCurrentQuantity(int currentQuantity) { this.currentQuantity = currentQuantity; }
    public OffsetDateTime getLastUpdatedAt() { return lastUpdatedAt; }
    public void setLastUpdatedAt(OffsetDateTime lastUpdatedAt) { this.lastUpdatedAt = lastUpdatedAt; }
}
