package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.Branch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {
    Optional<Branch> findByBranchCode(String branchCode);
    Page<Branch> findByIsActiveTrue(Pageable pageable);

    @Query("SELECT b FROM Branch b")
    List<Branch> findAllBranches();
}
