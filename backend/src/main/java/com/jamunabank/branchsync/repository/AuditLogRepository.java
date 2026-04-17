package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByEntityNameAndEntityIdOrderByActedAtDesc(String entityName, Long entityId, Pageable pageable);
    Page<AuditLog> findByRequest_RequestIdOrderByActedAtDesc(Long requestId, Pageable pageable);
    Page<AuditLog> findByActor_UserIdOrderByActedAtDesc(Long userId, Pageable pageable);
}
