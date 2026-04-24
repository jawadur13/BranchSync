package com.jamunabank.branchsync.mapper;

import com.jamunabank.branchsync.dto.request.InitiateTransferRequestDto;
import com.jamunabank.branchsync.dto.response.TransferResponseDto;
import com.jamunabank.branchsync.model.entity.Branch;
import com.jamunabank.branchsync.model.entity.ItemCategory;
import com.jamunabank.branchsync.model.entity.TransferRequest;
import org.springframework.stereotype.Component;

@Component
public class TransferMapper {

    public TransferRequest toEntity(InitiateTransferRequestDto dto) {
        if (dto == null) {
            return null;
        }

        return TransferRequest.builder()
                .title(dto.getTitle())
                .priority(dto.getPriority())
                .requestType(dto.getRequestType())
                // Use proxy-like entity instances for relationships
                .originBranch(Branch.builder().branchId(dto.getOriginBranchId()).build())
                .destinationBranch(Branch.builder().branchId(dto.getDestinationBranchId()).build())
                .category(ItemCategory.builder().categoryId(dto.getCategoryId()).build())
                .build();
    }

    public TransferResponseDto toResponseDto(TransferRequest entity) {
        if (entity == null) {
            return null;
        }

        return TransferResponseDto.builder()
                .requestId(entity.getRequestId())
                .requestCode(entity.getRequestCode())
                .status(entity.getStatus())
                .title(entity.getTitle())
                .priority(entity.getPriority())
                .requestType(entity.getRequestType())
                .requestedAt(entity.getRequestedAt())
                .originBranchName(entity.getOriginBranch() != null ? entity.getOriginBranch().getBranchName() : null)
                .destinationBranchName(entity.getDestinationBranch() != null ? entity.getDestinationBranch().getBranchName() : null)
                .categoryName(entity.getCategory() != null && entity.getCategory().getCategoryName() != null ? entity.getCategory().getCategoryName().name() : null)
                .initiatedByFullName(entity.getInitiatedBy() != null ? entity.getInitiatedBy().getFullName() : null)
                .build();
    }
}
