package com.jamunabank.branchsync.mapper;

import com.jamunabank.branchsync.dto.request.InitiateTransferRequestDto;
import com.jamunabank.branchsync.dto.response.TransferDetailDto;
import com.jamunabank.branchsync.dto.response.TransferResponseDto;
import com.jamunabank.branchsync.model.entity.Branch;
import com.jamunabank.branchsync.model.entity.Department;
import com.jamunabank.branchsync.model.entity.ItemCategory;
import com.jamunabank.branchsync.model.entity.StockItem;
import com.jamunabank.branchsync.model.entity.TransferRequest;
import org.springframework.stereotype.Component;

@Component
public class TransferMapper {

    public TransferRequest toEntity(InitiateTransferRequestDto dto) {
        if (dto == null) return null;
        return TransferRequest.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .priority(dto.getPriority() != null ? dto.getPriority() : "NORMAL")
                .destinationBranch(dto.getDestinationBranchId() != null
                        ? Branch.builder().branchId(dto.getDestinationBranchId()).build() : null)
                .destinationDepartment(dto.getDestinationDepartmentId() != null
                        ? Department.builder().departmentId(dto.getDestinationDepartmentId()).build() : null)
                .category(ItemCategory.builder().categoryId(dto.getCategoryId()).build())
                .requestedAmount(dto.getRequestedAmount())
                .stockItem(dto.getStockItemId() != null
                        ? StockItem.builder().stockItemId(dto.getStockItemId()).build() : null)
                .quantity(dto.getQuantity())
                .build();
    }

    public TransferResponseDto toResponseDto(TransferRequest e) {
        if (e == null) return null;
        return TransferResponseDto.builder()
                .requestId(e.getRequestId())
                .requestCode(e.getRequestCode())
                .status(e.getStatus())
                .title(e.getTitle())
                .priority(e.getPriority())
                .requestedAt(e.getRequestedAt())
                .originBranchName(e.getOriginBranch() != null ? e.getOriginBranch().getBranchName() : null)
                .destinationBranchName(e.getDestinationBranch() != null ? e.getDestinationBranch().getBranchName() : null)
                .categoryName(e.getCategory() != null ? e.getCategory().getCategoryName() : null)
                .initiatedByFullName(e.getInitiatedBy() != null ? e.getInitiatedBy().getFullName() : null)
                .deliveryPersonId(e.getDeliveryPerson() != null ? e.getDeliveryPerson().getUserId() : null)
                .deliveryPersonFullName(e.getDeliveryPerson() != null ? e.getDeliveryPerson().getFullName() : null)
                .behaviorType(e.getCategory() != null && e.getCategory().getBehaviorType() != null ? e.getCategory().getBehaviorType().name() : null)
                .stockItemName(e.getStockItem() != null ? e.getStockItem().getItemName() : null)
                .quantity(e.getQuantity())
                .build();
    }

    public TransferDetailDto toDetailDto(TransferRequest e) {
        if (e == null) return null;
        TransferDetailDto.TransferDetailDtoBuilder b = TransferDetailDto.builder()
                .requestId(e.getRequestId())
                .requestCode(e.getRequestCode())
                .status(e.getStatus())
                .title(e.getTitle())
                .description(e.getDescription())
                .priority(e.getPriority())
                .requestedAt(e.getRequestedAt())
                .closedAt(e.getClosedAt())
                .pickedUpAt(e.getPickedUpAt())
                .deliveredAt(e.getDeliveredAt())
                .finalNote(e.getFinalNote());

        if (e.getOriginBranch() != null) {
            b.originBranchId(e.getOriginBranch().getBranchId())
             .originBranchName(e.getOriginBranch().getBranchName())
             .originBranchCode(e.getOriginBranch().getBranchCode());
        }
        if (e.getDestinationBranch() != null) {
            b.destinationBranchId(e.getDestinationBranch().getBranchId())
             .destinationBranchName(e.getDestinationBranch().getBranchName())
             .destinationBranchCode(e.getDestinationBranch().getBranchCode());
        }
        if (e.getOriginDepartment() != null) {
            b.originDepartmentId(e.getOriginDepartment().getDepartmentId())
             .originDepartmentName(e.getOriginDepartment().getDepartmentName());
        }
        if (e.getDestinationDepartment() != null) {
            b.destinationDepartmentId(e.getDestinationDepartment().getDepartmentId())
             .destinationDepartmentName(e.getDestinationDepartment().getDepartmentName());
        }
        if (e.getCategory() != null) {
            b.categoryName(e.getCategory().getCategoryName())
             .sensitivityLevel(e.getCategory().getSensitivityLevel())
             .behaviorType(e.getCategory().getBehaviorType() != null ? e.getCategory().getBehaviorType().name() : null);
        }
        if (e.getInitiatedBy() != null) {
            b.initiatedByUserId(e.getInitiatedBy().getUserId())
             .initiatedByFullName(e.getInitiatedBy().getFullName())
             .initiatedByEmployeeId(e.getInitiatedBy().getEmployeeId())
             .initiatedByBranchId(e.getInitiatedBy().getBranch() != null ? e.getInitiatedBy().getBranch().getBranchId() : null);
        }
        if (e.getDeliveryPerson() != null) {
            b.deliveryPersonId(e.getDeliveryPerson().getUserId())
             .deliveryPersonFullName(e.getDeliveryPerson().getFullName());
        }
        if (e.getHqApprover() != null) {
            b.hqApproverId(e.getHqApprover().getUserId())
             .hqApproverFullName(e.getHqApprover().getFullName());
        }
        if (e.getStockItem() != null) {
            b.stockItemId(e.getStockItem().getStockItemId())
             .stockItemName(e.getStockItem().getItemName());
        }
        b.hqApprovedAt(e.getHqApprovedAt())
          .hqRejectionNote(e.getHqRejectionNote())
          .requestedAmount(e.getRequestedAmount())
          .denominationsSubmitted(e.getDenominationsSubmitted())
          .quantity(e.getQuantity());
        return b.build();
    }
}
