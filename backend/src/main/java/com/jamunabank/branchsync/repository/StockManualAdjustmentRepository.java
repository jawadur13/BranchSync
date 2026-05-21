package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.StockManualAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockManualAdjustmentRepository extends JpaRepository<StockManualAdjustment, Long> {

    /** Pending adjustments awaiting manager approval at a branch. */
    List<StockManualAdjustment> findByBranch_BranchIdAndStatusOrderBySubmittedAtDesc(
            Long branchId, String status);

    /** Full adjustment history at a branch across all stock items. */
    List<StockManualAdjustment> findByBranch_BranchIdOrderBySubmittedAtDesc(Long branchId);

    /** Full adjustment history for a specific stock item at a branch. */
    List<StockManualAdjustment> findByBranch_BranchIdAndStockItem_StockItemIdOrderBySubmittedAtDesc(
            Long branchId, Long stockItemId);
}
