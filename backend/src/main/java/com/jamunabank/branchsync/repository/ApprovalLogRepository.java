package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.ApprovalLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApprovalLogRepository extends JpaRepository<ApprovalLog, Long> {
    Page<ApprovalLog> findByTransferRequest_RequestIdOrderByActedAtDesc(Long requestId, Pageable pageable);
}
