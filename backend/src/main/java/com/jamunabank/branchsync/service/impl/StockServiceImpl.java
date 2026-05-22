package com.jamunabank.branchsync.service.impl;

import com.jamunabank.branchsync.exception.ResourceNotFoundException;
import com.jamunabank.branchsync.exception.UnauthorizedRoleException;
import com.jamunabank.branchsync.model.entity.*;
import com.jamunabank.branchsync.repository.*;
import com.jamunabank.branchsync.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockServiceImpl implements StockService {

    private final BranchStockBalanceRepository balanceRepository;
    private final StockLedgerRepository ledgerRepository;
    private final StockManualAdjustmentRepository adjustmentRepository;
    private final StockItemRepository stockItemRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final TransferRequestRepository transferRequestRepository;

    private static final List<String> MANAGER_ROLES = List.of(
        "BRANCH_MANAGER", "OPERATION_MANAGER", "FIRST_EXECUTIVE_OFFICER"
    );

    // ── Balance ──────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public BranchStockBalance getOrCreateBalance(Long branchId, Long stockItemId) {
        return balanceRepository.findByBranch_BranchIdAndStockItem_StockItemId(branchId, stockItemId)
                .orElseGet(() -> {
                    Branch branch = branchRepository.findById(branchId)
                            .orElseThrow(() -> new ResourceNotFoundException("Branch not found: " + branchId));
                    StockItem stockItem = stockItemRepository.findById(stockItemId)
                            .orElseThrow(() -> new ResourceNotFoundException("Stock item not found: " + stockItemId));
                    
                    BranchStockBalance balance = new BranchStockBalance();
                    balance.setBranch(branch);
                    balance.setStockItem(stockItem);
                    balance.setCurrentQuantity(0);
                    balance.setLastUpdatedAt(OffsetDateTime.now());
                    return balanceRepository.save(balance);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public List<BranchStockBalance> getBranchStockBalances(Long branchId) {
        return balanceRepository.findByBranch_BranchId(branchId);
    }

    // ── Ledger ───────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<StockLedgerEntry> getLedger(Long branchId, Long stockItemId, Long actorId) {
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + actorId));

        String role = actor.getRole().getRoleName();
        if ("SYSTEM_ADMIN".equals(role)) {
            if (stockItemId == 0) {
                return ledgerRepository.findByBranch_BranchIdOrderByCreatedAtDesc(branchId);
            }
            return ledgerRepository.findByBranch_BranchIdAndStockItem_StockItemIdOrderByCreatedAtDesc(branchId, stockItemId);
        }

        if (actor.getBranch() == null || !actor.getBranch().getBranchId().equals(branchId)) {
            throw new UnauthorizedRoleException("You do not have permission to view stock ledger of another branch.");
        }

        if (MANAGER_ROLES.contains(role)) {
            if (stockItemId == 0) {
                return ledgerRepository.findByBranch_BranchIdOrderByCreatedAtDesc(branchId);
            }
            return ledgerRepository.findByBranch_BranchIdAndStockItem_StockItemIdOrderByCreatedAtDesc(branchId, stockItemId);
        }

        if ("OFFICER".equals(role)) {
            if (stockItemId == 0) {
                Long deptId = actor.getDepartment() != null ? actor.getDepartment().getDepartmentId() : null;
                return ledgerRepository.findByBranch_BranchIdOrderByCreatedAtDesc(branchId).stream()
                        .filter(e -> {
                            Department itemDept = e.getStockItem().getCategory().getDepartment();
                            return itemDept == null || (deptId != null && deptId.equals(itemDept.getDepartmentId()));
                        })
                        .collect(Collectors.toList());
            } else {
                StockItem item = stockItemRepository.findById(stockItemId)
                        .orElseThrow(() -> new ResourceNotFoundException("Stock item not found: " + stockItemId));
                Department itemDept = item.getCategory().getDepartment();
                if (itemDept == null || (actor.getDepartment() != null && actor.getDepartment().getDepartmentId().equals(itemDept.getDepartmentId()))) {
                    return ledgerRepository.findByBranch_BranchIdAndStockItem_StockItemIdOrderByCreatedAtDesc(branchId, stockItemId);
                }
            }
        }

        throw new UnauthorizedRoleException("You do not have permission to view this stock ledger.");
    }

    // ── Transfer Movements (called from TransferServiceImpl) ─────────────────

    @Override
    @Transactional
    public void recordTransferOut(Long branchId, Long stockItemId, Long requestId, int quantity, Long actorId) {
        TransferRequest request = transferRequestRepository.findById(requestId).orElse(null);
        String reason = request != null ? "Stock transfer sent (Req: " + request.getRequestCode() + ")" : "Transfer Out";
        applyMovement(branchId, stockItemId, requestId, -quantity, "TRANSFER_OUT", actorId, null, reason);
    }

    @Override
    @Transactional
    public void recordTransferIn(Long branchId, Long stockItemId, Long requestId, int quantity, Long actorId) {
        TransferRequest request = transferRequestRepository.findById(requestId).orElse(null);
        String reason = request != null ? "Stock transfer received (Req: " + request.getRequestCode() + ")" : "Transfer In";
        applyMovement(branchId, stockItemId, requestId, quantity, "TRANSFER_IN", actorId, null, reason);
    }

    @Override
    @Transactional
    public void recordReversal(Long branchId, Long stockItemId, Long requestId, int quantity, Long actorId, String direction) {
        String type = "IN".equals(direction) ? "REVERSAL_IN" : "REVERSAL_OUT";
        int signed = "IN".equals(direction) ? quantity : -quantity;
        TransferRequest request = transferRequestRepository.findById(requestId).orElse(null);
        String reason = request != null ? "Transfer reversed (Req: " + request.getRequestCode() + ")" : "Reversal";
        applyMovement(branchId, stockItemId, requestId, signed, type, actorId, null, reason);
    }

    private void applyMovement(Long branchId, Long stockItemId, Long requestId, int signedQty, String type, Long actorId, Long approverId, String reason) {
        BranchStockBalance balance = getOrCreateBalance(branchId, stockItemId);
        int before = balance.getCurrentQuantity();
        int after = before + signedQty;

        if (after < 0) {
            throw new IllegalArgumentException("Operation would result in negative stock quantity (Available: " + before + ", Requested: " + signedQty + ")");
        }

        balance.setCurrentQuantity(after);
        balance.setLastUpdatedAt(OffsetDateTime.now());
        balanceRepository.save(balance);

        StockLedgerEntry entry = new StockLedgerEntry();
        entry.setBranch(balance.getBranch());
        entry.setStockItem(balance.getStockItem());
        entry.setEntryType(type);
        if (requestId != null) {
            entry.setTransferRequest(transferRequestRepository.findById(requestId).orElse(null));
        }
        entry.setQuantity(Math.abs(signedQty));
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

    // ── Manual Adjustments ───────────────────────────────────────────────────

    @Override
    @Transactional
    public StockManualAdjustment submitAdjustment(Long branchId, Long stockItemId, Long actorId, int quantity, String reason) {
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + actorId));

        if (!"OFFICER".equals(actor.getRole().getRoleName())) {
            throw new UnauthorizedRoleException("Only Officers can submit manual stock adjustments.");
        }

        if (actor.getBranch() == null || !actor.getBranch().getBranchId().equals(branchId)) {
            throw new UnauthorizedRoleException("You can only submit adjustments for your own branch.");
        }

        StockItem item = stockItemRepository.findById(stockItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Stock item not found: " + stockItemId));

        // Dept check: only officer of the assigned department can adjust.
        // If category department is null, it's open access to all branch officers.
        Department itemDept = item.getCategory().getDepartment();
        if (itemDept != null) {
            if (actor.getDepartment() == null || !actor.getDepartment().getDepartmentId().equals(itemDept.getDepartmentId())) {
                throw new UnauthorizedRoleException("You belong to department '" 
                        + (actor.getDepartment() != null ? actor.getDepartment().getDepartmentName() : "None") 
                        + "', but this item requires '" + itemDept.getDepartmentName() + "' department privileges.");
            }
        }

        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("A reason is mandatory for manual adjustments.");
        }

        if (quantity == 0) {
            throw new IllegalArgumentException("Adjustment quantity cannot be zero.");
        }

        // If debit, validate balance
        if (quantity < 0) {
            BranchStockBalance balance = getOrCreateBalance(branchId, stockItemId);
            int absDebit = Math.abs(quantity);
            if (balance.getCurrentQuantity() < absDebit) {
                throw new IllegalArgumentException("Insufficient stock quantity. Available: " 
                        + balance.getCurrentQuantity() + ", Requested debit: " + absDebit);
            }
        }

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found: " + branchId));

        StockManualAdjustment adj = new StockManualAdjustment();
        adj.setBranch(branch);
        adj.setStockItem(item);
        adj.setQuantity(quantity);
        adj.setReason(reason.trim());
        adj.setStatus("PENDING");
        adj.setSubmittedBy(actor);
        adj.setSubmittedAt(OffsetDateTime.now());

        return adjustmentRepository.save(adj);
    }

    @Override
    @Transactional
    public StockManualAdjustment approveAdjustment(Long adjustmentId, Long approverId, boolean approved, String decisionNote) {
        StockManualAdjustment adj = adjustmentRepository.findById(adjustmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Adjustment request not found: " + adjustmentId));
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
            // Validate balance again during approval for negative adjustments
            if (adj.getQuantity() < 0) {
                BranchStockBalance balance = getOrCreateBalance(adj.getBranch().getBranchId(), adj.getStockItem().getStockItemId());
                int absDebit = Math.abs(adj.getQuantity());
                if (balance.getCurrentQuantity() < absDebit) {
                    throw new IllegalArgumentException("Insufficient stock quantity to approve this debit. Available: " 
                            + balance.getCurrentQuantity() + ", Required: " + absDebit);
                }
            }
            // Apply movement
            applyMovement(
                adj.getBranch().getBranchId(), 
                adj.getStockItem().getStockItemId(), 
                null, 
                adj.getQuantity(), 
                "MANUAL_ADJUSTMENT", 
                adj.getSubmittedBy().getUserId(), 
                approverId, 
                adj.getReason()
            );
        } else {
            adj.setStatus("REJECTED");
        }

        return adjustmentRepository.save(adj);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockManualAdjustment> getPendingAdjustments(Long branchId) {
        return adjustmentRepository.findByBranch_BranchIdAndStatusOrderBySubmittedAtDesc(branchId, "PENDING");
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockManualAdjustment> getAllAdjustments(Long branchId) {
        return adjustmentRepository.findByBranch_BranchIdOrderBySubmittedAtDesc(branchId);
    }
}
