package com.jamunabank.branchsync.dto.request;

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

    private String priority = "NORMAL";

    private Long destinationBranchId;

    private Long destinationDepartmentId;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;
}
