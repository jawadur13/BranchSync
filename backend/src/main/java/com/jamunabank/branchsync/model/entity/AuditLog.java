package com.jamunabank.branchsync.model.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_id")
    private Long auditId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id")
    private TransferRequest transferRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @Column(name = "from_status", length = 50)
    private String fromStatus;

    @Column(name = "to_status", length = 50)
    private String toStatus;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "acted_at", nullable = false, updatable = false)
    private OffsetDateTime actedAt;

    public AuditLog() {}

    public Long getAuditId() { return auditId; }
    public void setAuditId(Long auditId) { this.auditId = auditId; }
    public TransferRequest getTransferRequest() { return transferRequest; }
    public void setTransferRequest(TransferRequest transferRequest) { this.transferRequest = transferRequest; }
    public User getActor() { return actor; }
    public void setActor(User actor) { this.actor = actor; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getFromStatus() { return fromStatus; }
    public void setFromStatus(String fromStatus) { this.fromStatus = fromStatus; }
    public String getToStatus() { return toStatus; }
    public void setToStatus(String toStatus) { this.toStatus = toStatus; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public OffsetDateTime getActedAt() { return actedAt; }
    public void setActedAt(OffsetDateTime actedAt) { this.actedAt = actedAt; }

    public static class AuditLogBuilder {
        private AuditLog a = new AuditLog();
        public AuditLogBuilder transferRequest(TransferRequest t) { a.transferRequest = t; return this; }
        public AuditLogBuilder actor(User u) { a.actor = u; return this; }
        public AuditLogBuilder action(String action) { a.action = action; return this; }
        public AuditLogBuilder fromStatus(String s) { a.fromStatus = s; return this; }
        public AuditLogBuilder toStatus(String s) { a.toStatus = s; return this; }
        public AuditLogBuilder remarks(String r) { a.remarks = r; return this; }
        public AuditLogBuilder ipAddress(String ip) { a.ipAddress = ip; return this; }
        public AuditLogBuilder actedAt(OffsetDateTime t) { a.actedAt = t; return this; }
        public AuditLog build() { return a; }
    }
    public static AuditLogBuilder builder() { return new AuditLogBuilder(); }
}
