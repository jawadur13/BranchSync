package com.jamunabank.branchsync.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class JwtResponseDto {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String employeeId;
    private String fullName;
    private String role;
    private Long branchId;
    private Long departmentId;
    private String departmentName;
}
