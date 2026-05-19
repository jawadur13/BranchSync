package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.BranchCashBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BranchCashBalanceRepository extends JpaRepository<BranchCashBalance, Long> {
    Optional<BranchCashBalance> findByBranch_BranchId(Long branchId);
}
