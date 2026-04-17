package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.ApprovalChain;
import com.jamunabank.branchsync.model.enums.Priority;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ApprovalChainRepository extends JpaRepository<ApprovalChain, Long> {
    List<ApprovalChain> findByCategory_CategoryIdAndPriorityLevelOrderByStepNumberAsc(Long categoryId, Priority priorityLevel);
    Page<ApprovalChain> findByCategory_CategoryId(Long categoryId, Pageable pageable);
}
