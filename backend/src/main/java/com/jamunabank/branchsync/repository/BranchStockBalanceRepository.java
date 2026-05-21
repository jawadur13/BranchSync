package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.BranchStockBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BranchStockBalanceRepository extends JpaRepository<BranchStockBalance, Long> {

    /** Get a specific item balance at a specific branch. */
    Optional<BranchStockBalance> findByBranch_BranchIdAndStockItem_StockItemId(Long branchId, Long stockItemId);

    /** Get all item balances at a branch. Used for branch stock overview. */
    List<BranchStockBalance> findByBranch_BranchId(Long branchId);

    /** Get all branch balances for a specific stock item (admin / cross-branch view). */
    List<BranchStockBalance> findByStockItem_StockItemId(Long stockItemId);
}
