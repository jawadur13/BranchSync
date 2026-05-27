package com.jamunabank.branchsync.dto.response;

import lombok.*;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferResponseDto {
    private Long requestId;
    private String requestCode;
    private String status;
    private String title;
    private String priority;
    private String originBranchName;
    private String destinationBranchName;
    private String categoryName;
    private String initiatedByFullName;
    private OffsetDateTime requestedAt;
    private Long initiatedById;
    private Long internalApproverId;
    private Long hqApproverId;
    private Long deptAcceptorId;
    private Long finalReleaserId;
    private Long deliveryPersonId;
    private String deliveryPersonFullName;
    private String behaviorType;
    private String stockItemName;
    private Integer quantity;
}
