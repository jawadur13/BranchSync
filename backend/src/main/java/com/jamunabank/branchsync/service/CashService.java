package com.jamunabank.branchsync.service;

import com.jamunabank.branchsync.model.entity.BranchCashBalance;
import com.jamunabank.branchsync.model.entity.CashLedgerEntry;
import com.jamunabank.branchsync.model.entity.CashManualAdjustment;
import com.jamunabank.branchsync.model.entity.CashTransferDenomination;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface CashService {

    // Balance
    BranchCashBalance getOrCreateBalance(Long branchId);
    List<BranchCashBalance> getAllBranchBalances();

    // Denominations
    List<CashTransferDenomination> submitDenominations(Long requestId, Long actorId, List<Map<String, Object>> denominations);
    List<CashTransferDenomination> getDenominations(Long requestId);

    // Ledger
    List<CashLedgerEntry> getLedger(Long branchId, Long actorId);

    // Internal balance movement (called from TransferServiceImpl)
    void recordTransferOut(Long branchId, Long requestId, BigDecimal amount, Long actorId);
    void recordTransferIn(Long branchId, Long requestId, BigDecimal amount, Long actorId);
    void recordReversal(Long branchId, Long requestId, BigDecimal amount, Long actorId, String direction);

    // Manual adjustment
    CashManualAdjustment submitAdjustment(Long branchId, Long actorId, BigDecimal amount, String reason);
    CashManualAdjustment approveAdjustment(Long adjustmentId, Long approverId, boolean approved, String decisionNote);
    List<CashManualAdjustment> getPendingAdjustments(Long branchId);
    List<CashManualAdjustment> getAllAdjustments(Long branchId);
}
