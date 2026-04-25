package com.jamunabank.branchsync.dto.response;

import com.jamunabank.branchsync.model.enums.Priority;
import com.jamunabank.branchsync.model.enums.RequestType;
import com.jamunabank.branchsync.model.enums.TransferStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferDetailDto {

    private Long requestId;
    private String requestCode;
    private TransferStatus status;
    private String title;
    private String description;
    
    // Branch info
    private Long originBranchId;
    private String originBranchName;
    private String originBranchCode;
    private Long destinationBranchId;
    private String destinationBranchName;
    private String destinationBranchCode;
    
    // Category info
    private String categoryName;
    private Boolean requiresDualVerification;
    private Boolean requiresHqApproval;
    private String sensitivityLevel;
    
    // Priority & Type
    private Priority priority;
    private RequestType requestType;
    
    // People
    private String initiatedByFullName;
    private String initiatedByEmployeeId;
    private Long initiatedByBranchId;
    
    // Timestamps
    private OffsetDateTime requestedAt;
    private LocalDate expectedDeliveryDate;
    private OffsetDateTime closedAt;
}
