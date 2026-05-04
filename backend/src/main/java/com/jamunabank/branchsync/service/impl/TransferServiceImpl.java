package com.jamunabank.branchsync.service.impl;

import com.jamunabank.branchsync.exception.ResourceNotFoundException;
import com.jamunabank.branchsync.exception.UnauthorizedRoleException;
import com.jamunabank.branchsync.model.entity.*;
import com.jamunabank.branchsync.repository.*;
import com.jamunabank.branchsync.service.AuditService;
import com.jamunabank.branchsync.service.TransferService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransferServiceImpl implements TransferService {

    private final TransferRequestRepository transferRequestRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    private static final List<String> MANAGER_ROLES = List.of(
        "BRANCH_MANAGER", "OPERATION_MANAGER", "FIRST_EXECUTIVE_OFFICER"
    );

    @Override
    @Transactional
    public TransferRequest initiateTransfer(TransferRequest request, Long actorId) {
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResourceNotFoundException("Actor not found"));

        long count = transferRequestRepository.count();
        String year = String.valueOf(OffsetDateTime.now().getYear());
        request.setRequestCode(String.format("REQ-%s-%04d", year, count + 1));
        request.setInitiatedBy(actor);
        request.setOriginBranch(actor.getBranch());
        request.setOriginDepartment(actor.getDepartment());
        request.setRequestedAt(OffsetDateTime.now());

        // Bypass Step 1 if requester is a Manager/FEO
        String role = actor.getRole().getRoleName();
        if (MANAGER_ROLES.contains(role)) {
            request.setStatus("PENDING_ASSIGNMENT");
            request.setInternalApprover(actor);
        } else {
            request.setStatus("PENDING_INTERNAL");
        }

        TransferRequest saved = transferRequestRepository.save(request);
        auditService.logAction(saved, actor, "CREATED", null, saved.getStatus(), null, "127.0.0.1");
        return saved;
    }

    @Override
    @Transactional
    public TransferRequest approveInternal(Long requestId, Long approverId) {
        TransferRequest request = getRequest(requestId);
        User approver = getUser(approverId);

        String role = approver.getRole().getRoleName();
        if (!MANAGER_ROLES.contains(role)) {
            throw new UnauthorizedRoleException("Only a Manager/FEO can perform internal approval.");
        }
        if (approver.getBranch() == null || !approver.getBranch().getBranchId().equals(request.getOriginBranch().getBranchId())) {
            throw new UnauthorizedRoleException("Approver must be from the same source branch.");
        }

        String old = request.getStatus();
        request.setStatus("PENDING_ASSIGNMENT");
        request.setInternalApprover(approver);

        TransferRequest updated = transferRequestRepository.save(request);
        auditService.logAction(updated, approver, "APPROVED_INTERNAL", old, updated.getStatus(), null, "127.0.0.1");
        return updated;
    }

    @Override
    @Transactional
    public TransferRequest acceptAndAssignDriver(Long requestId, Long acceptorId, Long deliveryPersonId) {
        TransferRequest request = getRequest(requestId);
        User acceptor = getUser(acceptorId);
        User driver = getUser(deliveryPersonId);

        if (!Boolean.TRUE.equals(driver.getIsAvailable())) {
            throw new UnauthorizedRoleException("Selected delivery person is not available.");
        }

        String old = request.getStatus();
        request.setStatus("PENDING_FINAL_RELEASE");
        request.setDeptAcceptor(acceptor);
        request.setDeliveryPerson(driver);

        TransferRequest updated = transferRequestRepository.save(request);
        auditService.logAction(updated, acceptor, "ASSIGNED_DRIVER", old, updated.getStatus(), null, "127.0.0.1");
        return updated;
    }

    @Override
    @Transactional
    public TransferRequest releaseFinal(Long requestId, Long releaserId) {
        TransferRequest request = getRequest(requestId);
        User releaser = getUser(releaserId);

        String role = releaser.getRole().getRoleName();
        if (!MANAGER_ROLES.contains(role)) {
            throw new UnauthorizedRoleException("Only a Manager/FEO can give final release.");
        }
        if (releaser.getBranch() == null || !releaser.getBranch().getBranchId().equals(request.getDestinationBranch().getBranchId())) {
            throw new UnauthorizedRoleException("Releaser must be from the destination branch.");
        }

        String old = request.getStatus();
        request.setStatus("READY_FOR_PICKUP");
        request.setFinalReleaser(releaser);

        TransferRequest updated = transferRequestRepository.save(request);
        auditService.logAction(updated, releaser, "RELEASED", old, updated.getStatus(), null, "127.0.0.1");
        return updated;
    }

    @Override
    @Transactional
    public TransferRequest markPickedUp(Long requestId, Long driverId) {
        TransferRequest request = getRequest(requestId);
        User driver = getUser(driverId);

        if (request.getDeliveryPerson() == null || !request.getDeliveryPerson().getUserId().equals(driverId)) {
            throw new UnauthorizedRoleException("Only the assigned driver can mark pickup.");
        }

        String old = request.getStatus();
        request.setStatus("IN_TRANSIT");
        request.setPickedUpAt(OffsetDateTime.now());
        driver.setIsAvailable(false);
        userRepository.save(driver);

        TransferRequest updated = transferRequestRepository.save(request);
        auditService.logAction(updated, driver, "PICKED_UP", old, updated.getStatus(), null, "127.0.0.1");
        return updated;
    }

    @Override
    @Transactional
    public TransferRequest markDelivered(Long requestId, Long driverId) {
        TransferRequest request = getRequest(requestId);
        User driver = getUser(driverId);

        if (request.getDeliveryPerson() == null || !request.getDeliveryPerson().getUserId().equals(driverId)) {
            throw new UnauthorizedRoleException("Only the assigned driver can mark delivery.");
        }

        String old = request.getStatus();
        request.setStatus("DELIVERED");
        request.setDeliveredAt(OffsetDateTime.now());
        driver.setIsAvailable(true);
        userRepository.save(driver);

        TransferRequest updated = transferRequestRepository.save(request);
        auditService.logAction(updated, driver, "DELIVERED", old, updated.getStatus(), null, "127.0.0.1");
        return updated;
    }

    @Override
    @Transactional
    public TransferRequest closeRequest(Long requestId, Long requesterId, String finalNote, boolean accepted) {
        TransferRequest request = getRequest(requestId);
        User requester = getUser(requesterId);

        if (!request.getInitiatedBy().getUserId().equals(requesterId)) {
            throw new UnauthorizedRoleException("Only the original requester can close this request.");
        }

        String old = request.getStatus();
        String newStatus = accepted ? "COMPLETED" : "REJECTED_ON_RECEIPT";
        request.setStatus(newStatus);
        request.setFinalNote(finalNote);
        request.setClosedAt(OffsetDateTime.now());

        TransferRequest updated = transferRequestRepository.save(request);
        auditService.logAction(updated, requester, accepted ? "COMPLETED" : "REJECTED", old, updated.getStatus(), finalNote, "127.0.0.1");
        return updated;
    }

    @Override
    public List<TransferRequest> getDashboardTransfers(Long actorId) {
        User actor = getUser(actorId);
        String role = actor.getRole().getRoleName();

        if ("SYSTEM_ADMIN".equals(role)) {
            return transferRequestRepository.findAllByOrderByRequestedAtDesc();
        }
        if ("DELIVERY_PERSON".equals(role)) {
            return transferRequestRepository.findByDeliveryPerson_UserIdOrderByRequestedAtDesc(actorId);
        }
        if (MANAGER_ROLES.contains(role)) {
            Long branchId = actor.getBranch() != null ? actor.getBranch().getBranchId() : null;
            if (branchId != null) {
                return transferRequestRepository.findByOriginBranch_BranchIdOrDestinationBranch_BranchIdOrderByRequestedAtDesc(branchId, branchId);
            }
        }
        // Regular officer — see requests from their branch
        Long branchId = actor.getBranch() != null ? actor.getBranch().getBranchId() : null;
        if (branchId != null) {
            return transferRequestRepository.findByOriginBranch_BranchIdOrDestinationBranch_BranchIdOrderByRequestedAtDesc(branchId, branchId);
        }
        return List.of();
    }

    private TransferRequest getRequest(Long id) {
        return transferRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer request not found: " + id));
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }
}
