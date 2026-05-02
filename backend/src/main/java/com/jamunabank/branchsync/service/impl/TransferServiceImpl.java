package com.jamunabank.branchsync.service.impl;

import com.jamunabank.branchsync.exception.ResourceNotFoundException;
import com.jamunabank.branchsync.exception.UnauthorizedRoleException;

import com.jamunabank.branchsync.model.entity.*;
import com.jamunabank.branchsync.model.enums.AuditAction;
import com.jamunabank.branchsync.model.enums.CategoryName;
import com.jamunabank.branchsync.model.enums.Priority;
import com.jamunabank.branchsync.model.enums.TransferStatus;
import com.jamunabank.branchsync.repository.*;
import com.jamunabank.branchsync.service.AuditService;
import com.jamunabank.branchsync.service.TransferService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransferServiceImpl implements TransferService {

    private final TransferRequestRepository transferRequestRepository;
    private final UserRepository userRepository;
    private final ReceiptRecordRepository receiptRecordRepository;
    private final AuditService auditService;

    @Override
    @Transactional
    public TransferRequest initiateTransfer(TransferRequest request, Long actorId) {
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResourceNotFoundException("Actor not found"));

        // 1. Generate Request Code
        long count = transferRequestRepository.count();
        String year = String.valueOf(OffsetDateTime.now().getYear());
        String requestCode = String.format("REQ-%s-%04d", year, count + 1);
        request.setRequestCode(requestCode);

        // 2. Set Status (Initial status is always PENDING_APPROVAL)
        request.setStatus(TransferStatus.PENDING_APPROVAL);
        request.setInitiatedBy(actor);
        request.setRequestedAt(OffsetDateTime.now());
        
        // Auto-assign origin from actor session
        request.setOriginBranch(actor.getBranch());
        request.setOriginDepartment(actor.getDepartment());

        TransferRequest savedRequest = transferRequestRepository.save(request);

        auditService.logAction(savedRequest, actor, AuditAction.CREATE, "transfer_requests", savedRequest.getRequestId(), null, savedRequest.getStatus().name(), "127.0.0.1", "System");
        return savedRequest;
    }

    @Override
    @Transactional
    public TransferRequest approveAndAssignDelivery(Long requestId, Long approverId, Long deliveryPersonId) {
        TransferRequest request = transferRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException("Approver not found"));
        User deliveryPerson = userRepository.findById(deliveryPersonId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery person not found"));

        // Security: Approver must be Manager/FEO of Source Branch
        String role = approver.getRole().getRoleName();
        boolean isAuthorizedRole = role.equals("BRANCH_MANAGER") || role.equals("OPERATION_MANAGER") || role.equals("FIRST_EXECUTIVE_OFFICER");
        
        if (!isAuthorizedRole || (approver.getBranch() != null && !approver.getBranch().getBranchId().equals(request.getOriginBranch().getBranchId()))) {
            throw new UnauthorizedRoleException("Only Manager/FEO of Source Branch can approve and assign delivery.");
        }

        String oldStatus = request.getStatus().name();
        request.setStatus(TransferStatus.PENDING_DELIVERY);
        request.setDeliveryPerson(deliveryPerson);
        
        TransferRequest updated = transferRequestRepository.save(request);
        auditService.logAction(updated, approver, AuditAction.APPROVE, "transfer_requests", updated.getRequestId(), oldStatus, updated.getStatus().name(), "127.0.0.1", "System");
        return updated;
    }

    @Override
    @Transactional
    public TransferRequest markAsInTransit(Long requestId, Long actorId) {
        TransferRequest request = transferRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
        
        if (request.getDeliveryPerson() == null || !request.getDeliveryPerson().getUserId().equals(actorId)) {
            throw new UnauthorizedRoleException("Only the assigned delivery person can mark this as In Transit.");
        }

        String oldStatus = request.getStatus().name();
        request.setStatus(TransferStatus.IN_TRANSIT);
        
        TransferRequest updated = transferRequestRepository.save(request);
        auditService.logAction(updated, request.getDeliveryPerson(), AuditAction.UPDATE, "transfer_requests", updated.getRequestId(), oldStatus, updated.getStatus().name(), "127.0.0.1", "System");
        return updated;
    }

    @Override
    @Transactional
    public TransferRequest markAsArrived(Long requestId, Long actorId) {
        TransferRequest request = transferRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
        
        if (request.getDeliveryPerson() == null || !request.getDeliveryPerson().getUserId().equals(actorId)) {
            throw new UnauthorizedRoleException("Only the assigned delivery person can mark this as Arrived.");
        }

        String oldStatus = request.getStatus().name();
        request.setStatus(TransferStatus.ARRIVED);
        
        TransferRequest updated = transferRequestRepository.save(request);
        auditService.logAction(updated, request.getDeliveryPerson(), AuditAction.UPDATE, "transfer_requests", updated.getRequestId(), oldStatus, updated.getStatus().name(), "127.0.0.1", "System");
        return updated;
    }

    @Override
    @Transactional
    public TransferRequest confirmReceipt(Long requestId, Long actorId, String finalNote) {
        TransferRequest request = transferRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResourceNotFoundException("Actor not found"));

        // Security: Actor must be Manager/FEO of Destination Branch
        String role = actor.getRole().getRoleName();
        boolean isAuthorizedRole = role.equals("BRANCH_MANAGER") || role.equals("OPERATION_MANAGER") || role.equals("FIRST_EXECUTIVE_OFFICER");
        
        if (!isAuthorizedRole || (actor.getBranch() != null && !actor.getBranch().getBranchId().equals(request.getDestinationBranch().getBranchId()))) {
            throw new UnauthorizedRoleException("Only Manager/FEO of Destination Branch can confirm receipt.");
        }

        String oldStatus = request.getStatus().name();
        request.setStatus(TransferStatus.COMPLETED);
        request.setFinalNote(finalNote);
        request.setClosedAt(OffsetDateTime.now());
        
        TransferRequest updated = transferRequestRepository.save(request);
        auditService.logAction(updated, actor, AuditAction.CONFIRM, "transfer_requests", updated.getRequestId(), oldStatus, updated.getStatus().name(), "127.0.0.1", "System");
        return updated;
    }

    @Override
    public List<TransferRequest> getDashboardTransfers(Long actorId) {
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResourceNotFoundException("Actor not found"));

        String role = actor.getRole().getRoleName();

        // 1. God Mode Admin
        if ("SYSTEM_ADMIN".equals(role)) {
            return transferRequestRepository.findAllByOrderByRequestedAtDesc();
        }

        // 2. Delivery Person Mode
        if ("DELIVERY_PERSON".equals(role)) {
            // See tasks assigned to me or unassigned tasks?
            // User requirement: "can watch all activity" - actually Admin can watch.
            // Delivery Person should see their assigned tasks.
            return transferRequestRepository.findByDeliveryPerson_UserIdOrderByRequestedAtDesc(actorId);
        }

        // 3. Manager and FEO (Branch Level Access)
        if ("BRANCH_MANAGER".equals(role) || "OPERATION_MANAGER".equals(role) || "FIRST_EXECUTIVE_OFFICER".equals(role)) {
            Long branchId = actor.getBranch() != null ? actor.getBranch().getBranchId() : null;
            if (branchId != null) {
                return transferRequestRepository.findByOriginBranch_BranchIdOrDestinationBranch_BranchIdOrderByRequestedAtDesc(branchId, branchId);
            }
        }

        // 4. Regular Staff (Origin Branch OR Destination Branch + Specific Department)
        Long branchId = actor.getBranch() != null ? actor.getBranch().getBranchId() : null;
        Long deptId = actor.getDepartment() != null ? actor.getDepartment().getDepartmentId() : null;

        if (branchId != null) {
            return transferRequestRepository.findDashboardTransfersForStaff(branchId, deptId);
        }
        
        return List.of();
    }
}
}
