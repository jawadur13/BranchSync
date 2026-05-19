package com.jamunabank.branchsync.model.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "cash_transfer_denominations")
public class CashTransferDenomination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "denomination_id")
    private Long denominationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private TransferRequest transferRequest;

    @Column(nullable = false)
    private Integer denomination; // e.g. 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal subtotal; // denomination * quantity

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by_id")
    private User submittedBy;

    @Column(name = "submitted_at")
    private OffsetDateTime submittedAt;

    public CashTransferDenomination() {}

    public Long getDenominationId() { return denominationId; }
    public void setDenominationId(Long denominationId) { this.denominationId = denominationId; }
    public TransferRequest getTransferRequest() { return transferRequest; }
    public void setTransferRequest(TransferRequest transferRequest) { this.transferRequest = transferRequest; }
    public Integer getDenomination() { return denomination; }
    public void setDenomination(Integer denomination) { this.denomination = denomination; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    public User getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(User submittedBy) { this.submittedBy = submittedBy; }
    public OffsetDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(OffsetDateTime submittedAt) { this.submittedAt = submittedAt; }
}
