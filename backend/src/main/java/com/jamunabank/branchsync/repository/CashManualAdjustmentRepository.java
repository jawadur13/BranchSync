package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.CashManualAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CashManualAdjustmentRepository extends JpaRepository<CashManualAdjustment, Long> {
    List<CashManualAdjustment> findByBranch_BranchIdOrderBySubmittedAtDesc(Long branchId);
    List<CashManualAdjustment> findByBranch_BranchIdAndStatusOrderBySubmittedAtDesc(Long branchId, String status);
    List<CashManualAdjustment> findByStatusOrderBySubmittedAtDesc(String status);
}
