package com.jamunabank.branchsync.model.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "branch_cash_balance")
public class BranchCashBalance {

    @Id
    @Column(name = "branch_id")
    private Long branchId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @Column(name = "current_balance", nullable = false, precision = 18, scale = 2)
    private BigDecimal currentBalance = BigDecimal.ZERO;

    @Column(name = "last_updated_at")
    private OffsetDateTime lastUpdatedAt;

    public BranchCashBalance() {}

    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
    public BigDecimal getCurrentBalance() { return currentBalance; }
    public void setCurrentBalance(BigDecimal currentBalance) { this.currentBalance = currentBalance; }
    public OffsetDateTime getLastUpdatedAt() { return lastUpdatedAt; }
    public void setLastUpdatedAt(OffsetDateTime lastUpdatedAt) { this.lastUpdatedAt = lastUpdatedAt; }
}
