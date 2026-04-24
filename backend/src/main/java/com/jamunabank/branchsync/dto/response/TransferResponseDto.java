package com.jamunabank.branchsync.dto.response;

import com.jamunabank.branchsync.model.enums.Priority;
import com.jamunabank.branchsync.model.enums.RequestType;
import com.jamunabank.branchsync.model.enums.TransferStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferResponseDto {

    private Long requestId;
    private String requestCode;
    private TransferStatus status;
    private String title;
    
    private String originBranchName;
    private String destinationBranchName;
    private String categoryName;
    
    private Priority priority;
    private RequestType requestType;
    
    private String initiatedByFullName;
    private OffsetDateTime requestedAt;
}
