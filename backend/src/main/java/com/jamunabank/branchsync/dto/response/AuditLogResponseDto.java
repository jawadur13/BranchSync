package com.jamunabank.branchsync.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponseDto {
    private Long auditId;
    private String action;
    private String fromStatus;
    private String toStatus;
    private String remarks;
    private OffsetDateTime actedAt;
    private String ipAddress;

    // Actor User Information
    private Long actorUserId;
    private String actorFullName;
    private String actorEmployeeId;
    private String actorRoleName;
    private String actorBranchName;
    private String actorDepartmentName;
}
