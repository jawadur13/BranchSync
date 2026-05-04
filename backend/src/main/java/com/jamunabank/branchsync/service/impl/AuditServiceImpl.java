package com.jamunabank.branchsync.service.impl;

import com.jamunabank.branchsync.model.entity.AuditLog;
import com.jamunabank.branchsync.model.entity.TransferRequest;
import com.jamunabank.branchsync.model.entity.User;
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
    @Transactional(propagation = Propagation.MANDATORY)
    public void logAction(
            TransferRequest request,
            User actor,
            String action,
            String fromStatus,
            String toStatus,
            String remarks,
            String ipAddress) {

        AuditLog log = AuditLog.builder()
                .transferRequest(request)
                .actor(actor)
                .action(action)
                .fromStatus(fromStatus)
                .toStatus(toStatus)
                .remarks(remarks)
                .ipAddress(ipAddress)
                .actedAt(OffsetDateTime.now())
                .build();

        auditLogRepository.save(log);
    }
}
