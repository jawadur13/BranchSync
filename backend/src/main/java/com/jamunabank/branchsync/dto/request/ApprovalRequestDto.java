package com.jamunabank.branchsync.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ApprovalRequestDto {
    @NotNull(message = "Delivery Person ID is required")
    private Long deliveryPersonId;
}
