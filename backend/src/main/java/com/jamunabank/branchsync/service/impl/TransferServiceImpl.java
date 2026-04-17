package com.jamunabank.branchsync.service.impl;

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
                .orElseThrow(() -> new RuntimeException("Actor not found"));

        // 1. Generate Request Code (Global Sequence Mock)
        long count = transferRequestRepository.count();
        String year = String.valueOf(OffsetDateTime.now().getYear());
        String requestCode = String.format("REQ-%s-%04d", year, count + 1);
        request.setRequestCode(requestCode);

        // 2. Set Status based on logic
        boolean needsApproval = request.getPriority() == Priority.HIGH || 
                                request.getPriority() == Priority.CRITICAL ||
                                request.getCategory().getCategoryName() == CategoryName.CASH;
        
        request.setStatus(needsApproval ? TransferStatus.PENDING_APPROVAL : TransferStatus.APPROVED);
        request.setInitiatedBy(actor);
        request.setRequestedAt(OffsetDateTime.now());

        TransferRequest savedRequest = transferRequestRepository.save(request);

        // 3. Log Audit
        auditService.logAction(
            savedRequest, actor, AuditAction.CREATE, 
            "transfer_requests", savedRequest.getRequestId(), 
            null, savedRequest.getStatus().name(), 
            "127.0.0.1", "System"
        );

        return savedRequest;
    }

    @Override
    @Transactional
    public TransferRequest approveTransfer(Long requestId, Long approverId) {
        TransferRequest request = transferRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new RuntimeException("Approver not found"));

        // 1. Role Check (FEO or Branch Manager)
        String roleName = approver.getRole().getRoleName();
        if (!"BRANCH_MANAGER".equals(roleName) && !"FIRST_EXECUTIVE_OFFICER".equals(roleName)) {
            throw new RuntimeException("Unauthorized: Only Branch Manager or FEO can approve.");
        }

        String oldStatus = request.getStatus().name();
        request.setStatus(TransferStatus.APPROVED);
        
        TransferRequest updatedRequest = transferRequestRepository.save(request);

        // 2. Log Audit
        auditService.logAction(
            updatedRequest, approver, AuditAction.APPROVE, 
            "transfer_requests", updatedRequest.getRequestId(), 
            oldStatus, updatedRequest.getStatus().name(), 
            "127.0.0.1", "System"
        );

        return updatedRequest;
    }

    @Override
    @Transactional
    public TransferRequest processDualVerification(Long requestId, Long actorId, boolean isOriginConfirmation) {
        TransferRequest request = transferRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new RuntimeException("Actor not found"));

        ReceiptRecord record = receiptRecordRepository.findByTransferRequest_RequestId(requestId)
                .orElseGet(() -> ReceiptRecord.builder()
                        .transferRequest(request)
                        .receivedBy(actor) // Default to current actor if record doesn't exist
                        .conditionNoted(com.jamunabank.branchsync.model.enums.Condition.GOOD)
                        .receivedAt(OffsetDateTime.now())
                        .build());

        // 1. Branch Check Logic
        if (isOriginConfirmation) {
            if (!actor.getBranch().getBranchId().equals(request.getOriginBranch().getBranchId())) {
                throw new RuntimeException("Unauthorized: Origin confirmation must be done by origin branch staff.");
            }
            record.setOriginConfirmationBy(actor);
            record.setOriginConfirmedAt(OffsetDateTime.now());
        } else {
            if (!actor.getBranch().getBranchId().equals(request.getDestinationBranch().getBranchId())) {
                throw new RuntimeException("Unauthorized: Destination confirmation must be done by destination branch staff.");
            }
            record.setDestinationConfirmationBy(actor);
            record.setDestinationConfirmedAt(OffsetDateTime.now());
        }

        // Trigger logic for dual_verification_complete is in DB, 
        // but let's check here to update status if complete
        if (record.getOriginConfirmationBy() != null && record.getDestinationConfirmationBy() != null) {
            record.setDualVerificationComplete(true);
            request.setStatus(TransferStatus.CONFIRMED); // Maps to 'Successful' in requirements
        }

        receiptRecordRepository.save(record);
        TransferRequest updatedRequest = transferRequestRepository.save(request);

        // 3. Log Audit
        auditService.logAction(
            updatedRequest, actor, AuditAction.CONFIRM, 
            "receipt_records", record.getReceiptId(), 
            "PENDING", record.getDualVerificationComplete() ? "COMPLETED" : "PARTIAL", 
            "127.0.0.1", "System"
        );

        return updatedRequest;
    }
}
