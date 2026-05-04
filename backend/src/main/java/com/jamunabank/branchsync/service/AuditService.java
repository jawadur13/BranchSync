package com.jamunabank.branchsync.service;

import com.jamunabank.branchsync.model.entity.TransferRequest;
import com.jamunabank.branchsync.model.entity.User;

public interface AuditService {
    void logAction(
        TransferRequest request,
        User actor,
        String action,
        String fromStatus,
        String toStatus,
        String remarks,
        String ipAddress
    );
}
