package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByTransferRequest_RequestIdOrderByActedAtDesc(Long requestId);
    List<AuditLog> findByActor_UserIdOrderByActedAtDesc(Long userId);
}
