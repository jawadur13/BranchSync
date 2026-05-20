package com.jamunabank.branchsync.service.impl;

import com.jamunabank.branchsync.exception.ResourceNotFoundException;
import com.jamunabank.branchsync.exception.UnauthorizedRoleException;
import com.jamunabank.branchsync.model.entity.*;
import com.jamunabank.branchsync.repository.*;
import com.jamunabank.branchsync.service.CashService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CashServiceImpl implements CashService {

    private final BranchCashBalanceRepository balanceRepository;
    private final CashLedgerRepository ledgerRepository;
    private final CashTransferDenominationRepository denominationRepository;
    private final CashManualAdjustmentRepository adjustmentRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final TransferRequestRepository transferRequestRepository;

    private static final List<String> MANAGER_ROLES = List.of(
        "BRANCH_MANAGER", "OPERATION_MANAGER", "FIRST_EXECUTIVE_OFFICER"
    );

    // ── Balance ──────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public BranchCashBalance getOrCreateBalance(Long branchId) {
        return balanceRepository.findByBranch_BranchId(branchId).orElseGet(() -> {
            Branch branch = branchRepository.findById(branchId)
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found: " + branchId));
            BranchCashBalance balance = new BranchCashBalance();
            balance.setBranch(branch);
            balance.setCurrentBalance(BigDecimal.ZERO);
            balance.setLastUpdatedAt(OffsetDateTime.now());
            return balanceRepository.save(balance);
        });
    }

    @Override
    public List<BranchCashBalance> getAllBranchBalances() {
        return balanceRepository.findAll();
    }

    // ── Denominations ─────────────────────────────────────────────────────────

    @Override
    @Transactional
    public List<CashTransferDenomination> submitDenominations(Long requestId, Long actorId, List<Map<String, Object>> denominations) {
        TransferRequest request = transferRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer request not found: " + requestId));
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + actorId));

        // Validate status
        if (!"PENDING_ASSIGNMENT".equals(request.getStatus())) {
            throw new UnauthorizedRoleException("Denominations can only be submitted when the request is awaiting assignment.");
        }

        // Validate actor belongs to destination branch
        if (actor.getBranch() == null || !actor.getBranch().getBranchId().equals(
                request.getDestinationBranch() != null ? request.getDestinationBranch().getBranchId() : null)) {
            throw new UnauthorizedRoleException("Only destination branch staff can submit denominations.");
        }

        // Compute grand total
        BigDecimal total = BigDecimal.ZERO;
        for (Map<String, Object> d : denominations) {
            int denom = ((Number) d.get("denomination")).intValue();
            int qty = ((Number) d.get("quantity")).intValue();
            if (qty > 0) {
                total = total.add(BigDecimal.valueOf((long) denom * qty));
            }
        }

        // Validate total matches requested amount
        BigDecimal requestedAmount = request.getRequestedAmount();
        if (requestedAmount != null && total.compareTo(requestedAmount) != 0) {
            throw new IllegalArgumentException(
                "Denomination total (৳" + total + ") must match requested amount (৳" + requestedAmount + ").");
        }

        // Check destination branch has enough balance
        BranchCashBalance balance = getOrCreateBalance(request.getDestinationBranch().getBranchId());
        if (balance.getCurrentBalance().compareTo(total) < 0) {
            throw new IllegalArgumentException(
                "Insufficient cash balance. Available: ৳" + balance.getCurrentBalance() + ", Required: ৳" + total);
        }

        // Clear previous denominations if re-submitting
        denominationRepository.deleteByTransferRequest_RequestId(requestId);

        // Save each denomination row
        for (Map<String, Object> d : denominations) {
            int denom = ((Number) d.get("denomination")).intValue();
            int qty = ((Number) d.get("quantity")).intValue();
            if (qty <= 0) continue;

            CashTransferDenomination row = new CashTransferDenomination();
            row.setTransferRequest(request);
            row.setDenomination(denom);
            row.setQuantity(qty);
            row.setSubtotal(BigDecimal.valueOf((long) denom * qty));
            row.setSubmittedBy(actor);
            row.setSubmittedAt(OffsetDateTime.now());
            denominationRepository.save(row);
        }

        // Mark denominations submitted
        request.setDenominationsSubmitted(true);
        transferRequestRepository.save(request);

        return denominationRepository.findByTransferRequest_RequestIdOrderByDenominationDesc(requestId);
    }

    @Override
    public List<CashTransferDenomination> getDenominations(Long requestId) {
        return denominationRepository.findByTransferRequest_RequestIdOrderByDenominationDesc(requestId);
    }

    // ── Ledger ────────────────────────────────────────────────────────────────

    @Override
    public List<CashLedgerEntry> getLedger(Long branchId, Long actorId) {
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + actorId));
        String role = actor.getRole().getRoleName();

        if ("SYSTEM_ADMIN".equals(role)) {
            return ledgerRepository.findByBranch_BranchIdOrderByCreatedAtDesc(branchId);
        }

        if (actor.getBranch() == null || !actor.getBranch().getBranchId().equals(branchId)) {
            throw new UnauthorizedRoleException("You can only view the ledger for your own branch.");
        }

        if (MANAGER_ROLES.contains(role)) {
            return ledgerRepository.findByBranch_BranchIdOrderByCreatedAtDesc(branchId);
        }

        if ("OFFICER".equals(role)) {
            boolean isCashDept = actor.getDepartment() != null 
                    && actor.getDepartment().getDepartmentName() != null 
                    && actor.getDepartment().getDepartmentName().toLowerCase().contains("cash");
            if (isCashDept) {
                return ledgerRepository.findByBranch_BranchIdOrderByCreatedAtDesc(branchId);
            }
        }

        throw new UnauthorizedRoleException("You do not have permission to view the cash ledger.");
    }

    // ── Internal Balance Movements (called from TransferServiceImpl) ───────────

    @Override
    @Transactional
    public void recordTransferOut(Long branchId, Long requestId, BigDecimal amount, Long actorId) {
        TransferRequest request = transferRequestRepository.findById(requestId).orElse(null);
        String reason = request != null ? "Cash transfer sent (Req: " + request.getRequestCode() + ")" : "Transfer Out";
        applyMovement(branchId, requestId, amount.negate(), "TRANSFER_OUT", actorId, null, reason);
    }

    @Override
    @Transactional
    public void recordTransferIn(Long branchId, Long requestId, BigDecimal amount, Long actorId) {
        TransferRequest request = transferRequestRepository.findById(requestId).orElse(null);
        String reason = request != null ? "Cash transfer received (Req: " + request.getRequestCode() + ")" : "Transfer In";
        applyMovement(branchId, requestId, amount, "TRANSFER_IN", actorId, null, reason);
    }

    @Override
    @Transactional
    public void recordReversal(Long branchId, Long requestId, BigDecimal amount, Long actorId, String direction) {
        String type = "IN".equals(direction) ? "REVERSAL_IN" : "REVERSAL_OUT";
        BigDecimal signed = "IN".equals(direction) ? amount : amount.negate();
        TransferRequest request = transferRequestRepository.findById(requestId).orElse(null);
        String reason = request != null ? "Transfer reversed (Req: " + request.getRequestCode() + ")" : "Reversal";
        applyMovement(branchId, requestId, signed, type, actorId, null, reason);
    }

    private void applyMovement(Long branchId, Long requestId, BigDecimal signedAmount, String type, Long actorId, Long approverId, String reason) {
        BranchCashBalance balance = getOrCreateBalance(branchId);
        BigDecimal before = balance.getCurrentBalance();
        BigDecimal after = before.add(signedAmount);

        balance.setCurrentBalance(after);
        balance.setLastUpdatedAt(OffsetDateTime.now());
        balanceRepository.save(balance);

        CashLedgerEntry entry = new CashLedgerEntry();
        entry.setBranch(balance.getBranch());
        entry.setEntryType(type);
        if (requestId != null) {
            entry.setTransferRequest(transferRequestRepository.findById(requestId).orElse(null));
        }
        entry.setAmount(signedAmount.abs());
        entry.setBalanceBefore(before);
        entry.setBalanceAfter(after);
        if (actorId != null) {
            entry.setActor(userRepository.findById(actorId).orElse(null));
        }
        if (approverId != null) {
            entry.setApprover(userRepository.findById(approverId).orElse(null));
        }
        entry.setReason(reason);
        entry.setCreatedAt(OffsetDateTime.now());
        ledgerRepository.save(entry);
    }

    // ── Manual Adjustment ─────────────────────────────────────────────────────

    @Override
    @Transactional
    public CashManualAdjustment submitAdjustment(Long branchId, Long actorId, BigDecimal amount, String reason) {
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + actorId));

        if (!"OFFICER".equals(actor.getRole().getRoleName())) {
            throw new UnauthorizedRoleException("Only Officers can submit manual adjustments.");
        }

        if (actor.getBranch() == null || !actor.getBranch().getBranchId().equals(branchId)) {
            throw new UnauthorizedRoleException("You can only submit adjustments for your own branch.");
        }

        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("A reason is mandatory for manual adjustments.");
        }

        // If it's a debit (negative amount), check if branch has enough balance
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            BranchCashBalance balance = getOrCreateBalance(branchId);
            BigDecimal absoluteDebit = amount.abs();
            if (balance.getCurrentBalance().compareTo(absoluteDebit) < 0) {
                throw new IllegalArgumentException("Insufficient cash balance. Available: ৳" 
                        + balance.getCurrentBalance() + ", Requested debit: ৳" + absoluteDebit);
            }
        }

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found: " + branchId));

        CashManualAdjustment adj = new CashManualAdjustment();
        adj.setBranch(branch);
        adj.setAmount(amount);
        adj.setReason(reason.trim());
        adj.setStatus("PENDING");
        adj.setSubmittedBy(actor);
        adj.setSubmittedAt(OffsetDateTime.now());

        return adjustmentRepository.save(adj);
    }

    @Override
    @Transactional
    public CashManualAdjustment approveAdjustment(Long adjustmentId, Long approverId, boolean approved, String decisionNote) {
        CashManualAdjustment adj = adjustmentRepository.findById(adjustmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Adjustment not found: " + adjustmentId));
        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + approverId));

        String role = approver.getRole().getRoleName();
        if (!MANAGER_ROLES.contains(role)) {
            throw new UnauthorizedRoleException("Only a Manager/FEO can approve manual adjustments.");
        }

        if (approver.getBranch() == null || !approver.getBranch().getBranchId().equals(adj.getBranch().getBranchId())) {
            throw new UnauthorizedRoleException("You can only approve adjustments for your own branch.");
        }

        if (!"PENDING".equals(adj.getStatus())) {
            throw new UnauthorizedRoleException("This adjustment has already been decided.");
        }

        adj.setApprovedBy(approver);
        adj.setDecidedAt(OffsetDateTime.now());
        adj.setDecisionNote(decisionNote);

        if (approved) {
            adj.setStatus("APPROVED");
            // If it's a debit (negative amount), check if branch has enough balance
            if (adj.getAmount().compareTo(BigDecimal.ZERO) < 0) {
                BranchCashBalance balance = getOrCreateBalance(adj.getBranch().getBranchId());
                BigDecimal absoluteDebit = adj.getAmount().abs();
                if (balance.getCurrentBalance().compareTo(absoluteDebit) < 0) {
                    throw new IllegalArgumentException("Insufficient cash balance to approve this debit. Available: ৳" 
                            + balance.getCurrentBalance() + ", Required: ৳" + absoluteDebit);
                }
            }
            // Apply to balance
            applyMovement(adj.getBranch().getBranchId(), null, adj.getAmount(), "MANUAL_ADJUSTMENT", adj.getSubmittedBy().getUserId(), approverId, adj.getReason());
        } else {
            adj.setStatus("REJECTED");
        }

        return adjustmentRepository.save(adj);
    }

    @Override
    public List<CashManualAdjustment> getPendingAdjustments(Long branchId) {
        return adjustmentRepository.findByBranch_BranchIdAndStatusOrderBySubmittedAtDesc(branchId, "PENDING");
    }

    @Override
    public List<CashManualAdjustment> getAllAdjustments(Long branchId) {
        return adjustmentRepository.findByBranch_BranchIdOrderBySubmittedAtDesc(branchId);
    }
}
