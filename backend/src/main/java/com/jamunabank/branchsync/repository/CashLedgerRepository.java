package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.CashLedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CashLedgerRepository extends JpaRepository<CashLedgerEntry, Long> {
    List<CashLedgerEntry> findByBranch_BranchIdOrderByCreatedAtDesc(Long branchId);
}
