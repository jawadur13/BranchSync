package com.jamunabank.branchsync.service;

import com.jamunabank.branchsync.model.entity.BranchStockBalance;
import com.jamunabank.branchsync.model.entity.StockLedgerEntry;
import com.jamunabank.branchsync.model.entity.StockManualAdjustment;

import java.util.List;

public interface StockService {

    // Balance
    BranchStockBalance getOrCreateBalance(Long branchId, Long stockItemId);
    List<BranchStockBalance> getBranchStockBalances(Long branchId);

    // Ledger
    List<StockLedgerEntry> getLedger(Long branchId, Long stockItemId, Long actorId);

    // Transfer movements (called from TransferServiceImpl)
    void recordTransferOut(Long branchId, Long stockItemId, Long requestId, int quantity, Long actorId);
    void recordTransferIn(Long branchId, Long stockItemId, Long requestId, int quantity, Long actorId);
    void recordReversal(Long branchId, Long stockItemId, Long requestId, int quantity, Long actorId, String direction);

    // Manual adjustments
    StockManualAdjustment submitAdjustment(Long branchId, Long stockItemId, Long actorId, int quantity, String reason);
    StockManualAdjustment approveAdjustment(Long adjustmentId, Long approverId, boolean approved, String decisionNote);
    List<StockManualAdjustment> getPendingAdjustments(Long branchId);
    List<StockManualAdjustment> getAllAdjustments(Long branchId);
}
