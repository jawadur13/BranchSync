package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.StockLedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockLedgerRepository extends JpaRepository<StockLedgerEntry, Long> {

    /** Full movement history for a specific item at a specific branch. */
    List<StockLedgerEntry> findByBranch_BranchIdAndStockItem_StockItemIdOrderByCreatedAtDesc(
            Long branchId, Long stockItemId);

    /** All stock movements at a branch across all items. */
    List<StockLedgerEntry> findByBranch_BranchIdOrderByCreatedAtDesc(Long branchId);

    /** All movements linked to a specific transfer request. */
    List<StockLedgerEntry> findByTransferRequest_RequestIdOrderByCreatedAtDesc(Long requestId);
}
