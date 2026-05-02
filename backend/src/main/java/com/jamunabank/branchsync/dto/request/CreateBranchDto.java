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
public class CreateBranchDto {

    @NotBlank(message = "Branch code is required")
    private String branchCode;

    @NotBlank(message = "Branch name is required")
    private String branchName;

    @NotNull(message = "Branch type is required")
    private String branchType;

    @NotBlank(message = "District is required")
    private String district;

    @NotBlank(message = "Division is required")
    private String division;

    @NotBlank(message = "Address is required")
    private String address;

    private String phone;
    
    private java.util.List<Long> departmentIds;
}
