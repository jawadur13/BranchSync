package com.jamunabank.branchsync.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CompletionRequestDto {
    @NotBlank(message = "Final note is required")
    private String finalNote;
}
