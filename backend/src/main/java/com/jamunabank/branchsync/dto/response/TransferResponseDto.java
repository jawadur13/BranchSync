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
    private Long deliveryPersonId;
    private String deliveryPersonFullName;
}
