package com.jamunabank.branchsync.dto.response;

import lombok.*;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferDetailDto {
    private Long requestId;
    private String requestCode;
    private String status;
    private String title;
    private String description;
    private String priority;

    // Origin
    private Long originBranchId;
    private String originBranchName;
    private String originBranchCode;
    private Long originDepartmentId;
    private String originDepartmentName;

    // Destination
    private Long destinationBranchId;
    private String destinationBranchName;
    private String destinationBranchCode;
    private Long destinationDepartmentId;
    private String destinationDepartmentName;

    // Category
    private String categoryName;
    private String sensitivityLevel;

    // People
    private Long initiatedByUserId;
    private String initiatedByFullName;
    private String initiatedByEmployeeId;
    private Long initiatedByBranchId;
    private Long deliveryPersonId;
    private String deliveryPersonFullName;

    // HQ Approval
    private Long hqApproverId;
    private String hqApproverFullName;
    private OffsetDateTime hqApprovedAt;
    private String hqRejectionNote;

    // Timestamps & Closing
    private java.time.OffsetDateTime requestedAt;
    private java.time.OffsetDateTime pickedUpAt;
    private java.time.OffsetDateTime deliveredAt;
    private java.time.OffsetDateTime closedAt;
    private String finalNote;

    // Cash Bundle
    private java.math.BigDecimal requestedAmount;
    private Boolean denominationsSubmitted;

    // STOCK behavior fields
    private Long stockItemId;
    private String stockItemName;
    private Integer quantity;
    private String behaviorType;

    private java.util.List<AuditLogResponseDto> auditLogs;
}
