package com.jamunabank.branchsync.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationRequestDto {

    @NotNull(message = "isOriginConfirmation flag is required")
    private Boolean isOriginConfirmation;
}
