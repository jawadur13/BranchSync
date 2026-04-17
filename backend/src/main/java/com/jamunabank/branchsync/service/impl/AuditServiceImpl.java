package com.jamunabank.branchsync.service.impl;

import com.jamunabank.branchsync.model.entity.AuditLog;
import com.jamunabank.branchsync.model.entity.TransferRequest;
import com.jamunabank.branchsync.model.entity.User;
import com.jamunabank.branchsync.model.enums.AuditAction;
import com.jamunabank.branchsync.repository.AuditLogRepository;
import com.jamunabank.branchsync.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional(propagation = Propagation.MANDATORY) // Ensures it runs in the same TX as caller
    public void logAction(
            TransferRequest request,
            User actor,
            AuditAction actionType,
            String entityName,
            Long entityId,
            String oldValue,
            String newValue,
            String ipAddress,
            String userAgent) {

        AuditLog log = AuditLog.builder()
                .transferRequest(request)
                .actor(actor)
                .actionType(actionType)
                .entityName(entityName)
                .entityId(entityId)
                .oldValue(oldValue)
                .newValue(newValue)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .actedAt(OffsetDateTime.now())
                .build();

        auditLogRepository.save(log);
    }
}
