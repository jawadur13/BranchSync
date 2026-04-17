package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.EscalationLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EscalationLogRepository extends JpaRepository<EscalationLog, Long> {
    Page<EscalationLog> findByTransferRequest_RequestId(Long requestId, Pageable pageable);
}
