package com.jamunabank.branchsync.model.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "transfer_requests")
public class TransferRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Long requestId;

    @Column(name = "request_code", nullable = false, unique = true, length = 50)
    private String requestCode;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private ItemCategory category;

    @Column(nullable = false, length = 50)
    private String priority = "NORMAL";

    @Column(nullable = false, length = 50)
    private String status = "PENDING_INTERNAL";

    // Source
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "origin_branch_id", nullable = false)
    private Branch originBranch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "origin_department_id")
    private Department originDepartment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiated_by_id", nullable = false)
    private User initiatedBy;

    // Step 1
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "internal_approver_id")
    private User internalApprover;

    // Destination
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_branch_id", nullable = false)
    private Branch destinationBranch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_department_id")
    private Department destinationDepartment;

    // Step 2
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dept_acceptor_id")
    private User deptAcceptor;

    // Step 3
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "final_releaser_id")
    private User finalReleaser;

    // Step 4 & 5
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_person_id")
    private User deliveryPerson;

    @Column(name = "picked_up_at")
    private OffsetDateTime pickedUpAt;

    @Column(name = "delivered_at")
    private OffsetDateTime deliveredAt;

    // Step 6
    @Column(name = "final_note", columnDefinition = "TEXT")
    private String finalNote;

    @Column(name = "closed_at")
    private OffsetDateTime closedAt;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private OffsetDateTime requestedAt;

    public TransferRequest() {}

    // Getters and Setters
    public Long getRequestId() { return requestId; }
    public void setRequestId(Long requestId) { this.requestId = requestId; }
    public String getRequestCode() { return requestCode; }
    public void setRequestCode(String requestCode) { this.requestCode = requestCode; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public ItemCategory getCategory() { return category; }
    public void setCategory(ItemCategory category) { this.category = category; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Branch getOriginBranch() { return originBranch; }
    public void setOriginBranch(Branch originBranch) { this.originBranch = originBranch; }
    public Department getOriginDepartment() { return originDepartment; }
    public void setOriginDepartment(Department originDepartment) { this.originDepartment = originDepartment; }
    public User getInitiatedBy() { return initiatedBy; }
    public void setInitiatedBy(User initiatedBy) { this.initiatedBy = initiatedBy; }
    public User getInternalApprover() { return internalApprover; }
    public void setInternalApprover(User internalApprover) { this.internalApprover = internalApprover; }
    public Branch getDestinationBranch() { return destinationBranch; }
    public void setDestinationBranch(Branch destinationBranch) { this.destinationBranch = destinationBranch; }
    public Department getDestinationDepartment() { return destinationDepartment; }
    public void setDestinationDepartment(Department destinationDepartment) { this.destinationDepartment = destinationDepartment; }
    public User getDeptAcceptor() { return deptAcceptor; }
    public void setDeptAcceptor(User deptAcceptor) { this.deptAcceptor = deptAcceptor; }
    public User getFinalReleaser() { return finalReleaser; }
    public void setFinalReleaser(User finalReleaser) { this.finalReleaser = finalReleaser; }
    public User getDeliveryPerson() { return deliveryPerson; }
    public void setDeliveryPerson(User deliveryPerson) { this.deliveryPerson = deliveryPerson; }
    public OffsetDateTime getPickedUpAt() { return pickedUpAt; }
    public void setPickedUpAt(OffsetDateTime pickedUpAt) { this.pickedUpAt = pickedUpAt; }
    public OffsetDateTime getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(OffsetDateTime deliveredAt) { this.deliveredAt = deliveredAt; }
    public String getFinalNote() { return finalNote; }
    public void setFinalNote(String finalNote) { this.finalNote = finalNote; }
    public OffsetDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(OffsetDateTime closedAt) { this.closedAt = closedAt; }
    public OffsetDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(OffsetDateTime requestedAt) { this.requestedAt = requestedAt; }

    public static class TransferRequestBuilder {
        private TransferRequest t = new TransferRequest();
        public TransferRequestBuilder requestId(Long id) { t.requestId = id; return this; }
        public TransferRequestBuilder requestCode(String c) { t.requestCode = c; return this; }
        public TransferRequestBuilder title(String ti) { t.title = ti; return this; }
        public TransferRequestBuilder description(String d) { t.description = d; return this; }
        public TransferRequestBuilder category(ItemCategory cat) { t.category = cat; return this; }
        public TransferRequestBuilder priority(String p) { t.priority = p; return this; }
        public TransferRequestBuilder status(String s) { t.status = s; return this; }
        public TransferRequestBuilder originBranch(Branch b) { t.originBranch = b; return this; }
        public TransferRequestBuilder originDepartment(Department d) { t.originDepartment = d; return this; }
        public TransferRequestBuilder initiatedBy(User u) { t.initiatedBy = u; return this; }
        public TransferRequestBuilder internalApprover(User u) { t.internalApprover = u; return this; }
        public TransferRequestBuilder destinationBranch(Branch b) { t.destinationBranch = b; return this; }
        public TransferRequestBuilder destinationDepartment(Department d) { t.destinationDepartment = d; return this; }
        public TransferRequestBuilder deptAcceptor(User u) { t.deptAcceptor = u; return this; }
        public TransferRequestBuilder finalReleaser(User u) { t.finalReleaser = u; return this; }
        public TransferRequestBuilder deliveryPerson(User u) { t.deliveryPerson = u; return this; }
        public TransferRequestBuilder pickedUpAt(OffsetDateTime d) { t.pickedUpAt = d; return this; }
        public TransferRequestBuilder deliveredAt(OffsetDateTime d) { t.deliveredAt = d; return this; }
        public TransferRequestBuilder finalNote(String n) { t.finalNote = n; return this; }
        public TransferRequestBuilder closedAt(OffsetDateTime d) { t.closedAt = d; return this; }
        public TransferRequestBuilder requestedAt(OffsetDateTime d) { t.requestedAt = d; return this; }
        public TransferRequest build() { return t; }
    }
    public static TransferRequestBuilder builder() { return new TransferRequestBuilder(); }
}
