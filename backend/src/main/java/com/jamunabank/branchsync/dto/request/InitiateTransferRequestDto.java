package com.jamunabank.branchsync.dto.request;

import com.jamunabank.branchsync.model.enums.Priority;
import com.jamunabank.branchsync.model.enums.RequestType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InitiateTransferRequestDto {

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    @NotNull(message = "Priority is required")
    private Priority priority;

    @NotNull(message = "Origin Branch ID is required")
    private Long originBranchId;

    @NotNull(message = "Destination Branch ID is required")
    private Long destinationBranchId;

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Request Type is required")
    private RequestType requestType;
}
