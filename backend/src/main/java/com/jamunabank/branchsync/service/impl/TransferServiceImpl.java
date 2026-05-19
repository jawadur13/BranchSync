package com.jamunabank.branchsync.service.impl;

import com.jamunabank.branchsync.exception.ResourceNotFoundException;
import com.jamunabank.branchsync.exception.UnauthorizedRoleException;
import com.jamunabank.branchsync.model.entity.*;
import com.jamunabank.branchsync.repository.*;
import com.jamunabank.branchsync.service.AuditService;
import com.jamunabank.branchsync.service.CashService;
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
    private final BranchRepository branchRepository;
    private final DepartmentRepository departmentRepository;
    private final CashService cashService;

    private static final List<String> MANAGER_ROLES = List.of(
        "BRANCH_MANAGER", "OPERATION_MANAGER", "FIRST_EXECUTIVE_OFFICER"
    );

    // ── Step 1: Initiate ─────────────────────────────────────────────────────

    @Override
    @Transactional
    public TransferRequest initiateTransfer(TransferRequest request, Long actorId) {
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResourceNotFoundException("Actor not found"));

        // HQ officers are not allowed to create transfer requests
        if ("HQ_LOGISTICS_OFFICER".equals(actor.getRole().getRoleName())) {
            throw new UnauthorizedRoleException("HQ Logistics Officers cannot create transfer requests.");
        }

        long count = transferRequestRepository.count();
        String year = String.valueOf(OffsetDateTime.now().getYear());
        request.setRequestCode(String.format("REQ-%s-%04d", year, count + 1));
        request.setInitiatedBy(actor);
        request.setOriginBranch(actor.getBranch());
        request.setOriginDepartment(actor.getDepartment());
        request.setRequestedAt(OffsetDateTime.now());

        // Manager/FEO bypass: skip PENDING_INTERNAL but still go through HQ
        String role = actor.getRole().getRoleName();
        if (MANAGER_ROLES.contains(role)) {
            request.setStatus("PENDING_HQ_APPROVAL");
            request.setInternalApprover(actor);
        } else {
            request.setStatus("PENDING_INTERNAL");
        }

        TransferRequest saved = transferRequestRepository.save(request);
        auditService.logAction(saved, actor, "CREATED", null, saved.getStatus(), null, "127.0.0.1");
        return saved;
    }

    // ── Step 1 Gate: Source branch Manager/FEO internal approval → HQ ────────

    @Override
    @Transactional
    public TransferRequest approveInternal(Long requestId, Long approverId) {
        TransferRequest request = getRequest(requestId);
        User approver = getUser(approverId);

        if (!"PENDING_INTERNAL".equals(request.getStatus())) {
            throw new UnauthorizedRoleException("This request is not awaiting internal approval.");
        }

        String role = approver.getRole().getRoleName();
        if (!MANAGER_ROLES.contains(role)) {
            throw new UnauthorizedRoleException("Only a Manager/FEO can perform internal approval.");
        }
        if (approver.getBranch() == null || !approver.getBranch().getBranchId().equals(request.getOriginBranch().getBranchId())) {
            throw new UnauthorizedRoleException("Approver must be from the same source branch.");
        }

        String old = request.getStatus();
        // After source approval, route to HQ — destination branch cannot see it yet
        request.setStatus("PENDING_HQ_APPROVAL");
        request.setInternalApprover(approver);

        TransferRequest updated = transferRequestRepository.save(request);
        auditService.logAction(updated, approver, "APPROVED_INTERNAL", old, updated.getStatus(), null, "127.0.0.1");
        return updated;
    }

    @Override
    @Transactional
    public TransferRequest rejectInternal(Long requestId, Long approverId, String rejectionNote) {
        TransferRequest request = getRequest(requestId);
        User approver = getUser(approverId);

        if (!"PENDING_INTERNAL".equals(request.getStatus())) {
            throw new com.jamunabank.branchsync.exception.UnauthorizedRoleException("This request is not awaiting internal approval.");
        }

        String role = approver.getRole().getRoleName();
        if (!MANAGER_ROLES.contains(role)) {
            throw new com.jamunabank.branchsync.exception.UnauthorizedRoleException("Only a Manager/FEO can perform internal rejection.");
        }
        if (approver.getBranch() == null || !approver.getBranch().getBranchId().equals(request.getOriginBranch().getBranchId())) {
            throw new com.jamunabank.branchsync.exception.UnauthorizedRoleException("Approver must be from the same source branch.");
        }
        if (rejectionNote == null || rejectionNote.trim().isEmpty()) {
            throw new IllegalArgumentException("Rejection note is required.");
        }

        String old = request.getStatus();
        request.setStatus("REJECTED_BY_MANAGER");
        request.setInternalApprover(approver);
        request.setFinalNote(rejectionNote);
        request.setClosedAt(OffsetDateTime.now());

        TransferRequest updated = transferRequestRepository.save(request);
        auditService.logAction(updated, approver, "REJECTED_INTERNAL", old, updated.getStatus(), rejectionNote, "127.0.0.1");
        return updated;
    }

    // ── HQ Step: Central Logistics Control officer verifies or rejects ─────────

    @Override
    @Transactional
    public TransferRequest hqVerify(Long requestId, Long hqOfficerId, String rejectionNote, boolean approved, Long destinationBranchId, Long destinationDepartmentId) {
        TransferRequest request = getRequest(requestId);
        User hqOfficer = getUser(hqOfficerId);

        if (!"PENDING_HQ_APPROVAL".equals(request.getStatus())) {
            throw new UnauthorizedRoleException("This request is not awaiting HQ approval.");
        }

        if (!"HQ_LOGISTICS_OFFICER".equals(hqOfficer.getRole().getRoleName())) {
            throw new UnauthorizedRoleException("Only an HQ Logistics Officer can perform this action.");
        }

        if (!approved && (rejectionNote == null || rejectionNote.isBlank())) {
            throw new UnauthorizedRoleException("A rejection note is required when rejecting a transfer.");
        }

        String old = request.getStatus();
        request.setHqApprover(hqOfficer);
        request.setHqApprovedAt(OffsetDateTime.now());

        if (approved) {
            if (destinationBranchId == null) {
                throw new UnauthorizedRoleException("A destination branch must be assigned by HQ.");
            }
            Branch destBranch = branchRepository.findById(destinationBranchId)
                    .orElseThrow(() -> new ResourceNotFoundException("Destination branch not found: " + destinationBranchId));
            request.setDestinationBranch(destBranch);

            if (destinationDepartmentId != null) {
                Department destDept = departmentRepository.findById(destinationDepartmentId)
                        .orElseThrow(() -> new ResourceNotFoundException("Destination department not found: " + destinationDepartmentId));
                request.setDestinationDepartment(destDept);
            }

            // Forward to destination branch
            request.setStatus("PENDING_ASSIGNMENT");
            TransferRequest updated = transferRequestRepository.save(request);
            auditService.logAction(updated, hqOfficer, "HQ_APPROVED", old, updated.getStatus(), null, "127.0.0.1");
            return updated;
        } else {
            // Reject — requester is informed via hqRejectionNote
            request.setStatus("REJECTED_BY_HQ");
            request.setHqRejectionNote(rejectionNote);
            request.setClosedAt(OffsetDateTime.now());
            TransferRequest updated = transferRequestRepository.save(request);
            auditService.logAction(updated, hqOfficer, "HQ_REJECTED", old, updated.getStatus(), rejectionNote, "127.0.0.1");
            return updated;
        }
    }

    // ── Step 2: Dest dept staff accepts and assigns driver ────────────────────

    @Override
    @Transactional
    public TransferRequest acceptAndAssignDriver(Long requestId, Long acceptorId, Long deliveryPersonId) {
        TransferRequest request = getRequest(requestId);
        User acceptor = getUser(acceptorId);
        User driver = getUser(deliveryPersonId);

        if (!"PENDING_ASSIGNMENT".equals(request.getStatus())) {
            throw new UnauthorizedRoleException("This request is not awaiting assignment.");
        }

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
    public TransferRequest rejectDestination(Long requestId, Long rejectorId, String rejectionNote) {
        TransferRequest request = getRequest(requestId);
        User rejector = getUser(rejectorId);

        if (!"PENDING_ASSIGNMENT".equals(request.getStatus())) {
            throw new UnauthorizedRoleException("This request is not awaiting destination acceptance.");
        }

        // Verify that the rejector is from the destination branch
        if (rejector.getBranch() == null || !rejector.getBranch().getBranchId().equals(request.getDestinationBranch().getBranchId())) {
            throw new UnauthorizedRoleException("You must belong to the destination branch to decline this request.");
        }

        if (rejectionNote == null || rejectionNote.trim().isEmpty()) {
            throw new IllegalArgumentException("Rejection note is required.");
        }

        String old = request.getStatus();
        
        // Reset destination assignments
        request.setDestinationBranch(null);
        request.setDestinationDepartment(null);
        
        // Route back to HQ for re-routing / selection
        request.setStatus("PENDING_HQ_APPROVAL");
        
        // Set rejection reason
        request.setFinalNote(rejectionNote);
        
        // Clear previous HQ approval details since it has been returned
        request.setHqApprover(null);
        request.setHqApprovedAt(null);

        TransferRequest updated = transferRequestRepository.save(request);
        auditService.logAction(updated, rejector, "DESTINATION_REJECTED", old, updated.getStatus(), rejectionNote, "127.0.0.1");
        return updated;
    }

    // ── Step 3: Dest Manager/FEO gives final green light ─────────────────────

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
    public TransferRequest rejectRelease(Long requestId, Long releaserId, String rejectionNote) {
        TransferRequest request = getRequest(requestId);
        User releaser = getUser(releaserId);

        if (!"PENDING_FINAL_RELEASE".equals(request.getStatus())) {
            throw new UnauthorizedRoleException("This request is not awaiting final release.");
        }

        String role = releaser.getRole().getRoleName();
        if (!MANAGER_ROLES.contains(role)) {
            throw new UnauthorizedRoleException("Only a Manager/FEO can decline final release.");
        }
        if (releaser.getBranch() == null || !releaser.getBranch().getBranchId().equals(request.getDestinationBranch().getBranchId())) {
            throw new UnauthorizedRoleException("Releaser must be from the destination branch.");
        }

        if (rejectionNote == null || rejectionNote.trim().isEmpty()) {
            throw new IllegalArgumentException("Rejection note is required.");
        }

        String old = request.getStatus();

        // Reset destination assignments & driver & acceptor
        request.setDestinationBranch(null);
        request.setDestinationDepartment(null);
        request.setDeptAcceptor(null);
        request.setDeliveryPerson(null);

        // Route back to HQ for routing review
        request.setStatus("PENDING_HQ_APPROVAL");

        // Set rejection reason
        request.setFinalNote(rejectionNote);

        // Clear previous HQ approval details
        request.setHqApprover(null);
        request.setHqApprovedAt(null);

        TransferRequest updated = transferRequestRepository.save(request);
        auditService.logAction(updated, releaser, "RELEASE_REJECTED", old, updated.getStatus(), rejectionNote, "127.0.0.1");
        return updated;
    }

    // ── Step 4: Driver picks up ───────────────────────────────────────────────

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

        // Cash Bundle: debit destination branch balance (they are sending the cash)
        if (isCashBundle(updated)) {
            java.math.BigDecimal amount = updated.getRequestedAmount();
            if (amount != null) {
                cashService.recordTransferOut(updated.getDestinationBranch().getBranchId(), updated.getRequestId(), amount, driverId);
            }
        }

        return updated;
    }

    // ── Step 5: Driver marks delivered ───────────────────────────────────────

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

        // Cash Bundle: credit origin branch balance (they are receiving the cash)
        if (isCashBundle(updated)) {
            java.math.BigDecimal amount = updated.getRequestedAmount();
            if (amount != null) {
                cashService.recordTransferIn(updated.getOriginBranch().getBranchId(), updated.getRequestId(), amount, driverId);
            }
        }

        return updated;
    }

    // ── Step 6: Original requester closes ────────────────────────────────────

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

        // Cash Bundle: if rejected on receipt, reverse the cash movements
        if (!accepted && isCashBundle(updated)) {
            java.math.BigDecimal amount = updated.getRequestedAmount();
            if (amount != null) {
                // Origin branch loses the cash back (reversal out)
                cashService.recordReversal(updated.getOriginBranch().getBranchId(), updated.getRequestId(), amount, requesterId, "OUT");
                // Destination branch gets the cash back (reversal in)
                cashService.recordReversal(updated.getDestinationBranch().getBranchId(), updated.getRequestId(), amount, requesterId, "IN");
            }
        }

        return updated;
    }

    // ── Dashboard & History ───────────────────────────────────────────────────

    @Override
    public List<TransferRequest> getDashboardTransfers(Long actorId) {
        User actor = getUser(actorId);
        String role = actor.getRole().getRoleName();

        if ("SYSTEM_ADMIN".equals(role)) {
            return transferRequestRepository.findAllByOrderByRequestedAtDesc();
        }
        // HQ officers only see transfers sitting in their queue
        if ("HQ_LOGISTICS_OFFICER".equals(role)) {
            return transferRequestRepository.findByStatusOrderByRequestedAtDesc("PENDING_HQ_APPROVAL");
        }
        if ("DELIVERY_PERSON".equals(role)) {
            return transferRequestRepository.findByDeliveryPerson_UserIdOrderByRequestedAtDesc(actorId);
        }
        // Branch users (managers and staff): use the branch-scoped query that
        // hides pre-HQ transfers from the destination branch
        if ("OFFICER".equals(role)) {
            Long branchId = actor.getBranch() != null ? actor.getBranch().getBranchId() : null;
            Long departmentId = actor.getDepartment() != null ? actor.getDepartment().getDepartmentId() : null;
            if (branchId != null && departmentId != null) {
                return transferRequestRepository.findByBranchDashboard(branchId).stream()
                        .filter(t -> {
                            boolean isOriginDept = t.getOriginBranch() != null && t.getOriginBranch().getBranchId().equals(branchId)
                                    && t.getOriginDepartment() != null && t.getOriginDepartment().getDepartmentId().equals(departmentId);
                            boolean isDestDept = t.getDestinationBranch() != null && t.getDestinationBranch().getBranchId().equals(branchId)
                                    && t.getDestinationDepartment() != null && t.getDestinationDepartment().getDepartmentId().equals(departmentId);
                            return isOriginDept || isDestDept;
                        })
                        .toList();
            }
            return List.of();
        }

        Long branchId = actor.getBranch() != null ? actor.getBranch().getBranchId() : null;
        if (branchId != null) {
            return transferRequestRepository.findByBranchDashboard(branchId);
        }
        return List.of();
    }

    @Override
    public List<TransferRequest> getTransferHistory(Long actorId) {
        User actor = getUser(actorId);
        String role = actor.getRole().getRoleName();
        List<String> terminalStatuses = List.of("COMPLETED", "REJECTED_ON_RECEIPT", "CANCELLED", "REJECTED_BY_HQ", "REJECTED_BY_MANAGER");

        if ("SYSTEM_ADMIN".equals(role)) {
            return transferRequestRepository.findAllByOrderByRequestedAtDesc();
        }
        if ("HQ_LOGISTICS_OFFICER".equals(role)) {
            return transferRequestRepository.findAllByOrderByRequestedAtDesc().stream()
                    .filter(t -> terminalStatuses.contains(t.getStatus()))
                    .toList();
        }
        if ("DELIVERY_PERSON".equals(role)) {
            return transferRequestRepository.findByDeliveryPerson_UserIdOrderByRequestedAtDesc(actorId).stream()
                    .filter(t -> terminalStatuses.contains(t.getStatus()))
                    .toList();
        }
        if ("OFFICER".equals(role)) {
            Long userBranchId = actor.getBranch() != null ? actor.getBranch().getBranchId() : null;
            Long departmentId = actor.getDepartment() != null ? actor.getDepartment().getDepartmentId() : null;
            if (userBranchId != null && departmentId != null) {
                return transferRequestRepository
                        .findByOriginBranch_BranchIdOrDestinationBranch_BranchIdOrderByRequestedAtDesc(userBranchId, userBranchId)
                        .stream()
                        .filter(t -> terminalStatuses.contains(t.getStatus()))
                        .filter(t -> {
                            boolean isOriginDept = t.getOriginBranch() != null && t.getOriginBranch().getBranchId().equals(userBranchId)
                                    && t.getOriginDepartment() != null && t.getOriginDepartment().getDepartmentId().equals(departmentId);
                            boolean isDestDept = t.getDestinationBranch() != null && t.getDestinationBranch().getBranchId().equals(userBranchId)
                                    && t.getDestinationDepartment() != null && t.getDestinationDepartment().getDepartmentId().equals(departmentId);
                            return isOriginDept || isDestDept;
                        })
                        .toList();
            }
            return List.of();
        }

        Long userBranchId = actor.getBranch() != null ? actor.getBranch().getBranchId() : null;
        if (userBranchId != null) {
            return transferRequestRepository
                    .findByOriginBranch_BranchIdOrDestinationBranch_BranchIdOrderByRequestedAtDesc(userBranchId, userBranchId)
                    .stream()
                    .filter(t -> terminalStatuses.contains(t.getStatus()))
                    .toList();
        }
        return List.of();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private TransferRequest getRequest(Long id) {
        return transferRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer request not found: " + id));
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    private boolean isCashBundle(TransferRequest request) {
        return request.getCategory() != null
                && "Cash Bundle".equalsIgnoreCase(request.getCategory().getCategoryName());
    }
}
