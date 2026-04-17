package com.jamunabank.branchsync.service;

import com.jamunabank.branchsync.model.entity.TransferRequest;
import com.jamunabank.branchsync.model.entity.User;
import com.jamunabank.branchsync.model.enums.AuditAction;

public interface AuditService {
    /**
     * Records an entry into the audit log.
     * Must be run within the same transaction as the business logic.
     */
    void logAction(
        TransferRequest request, 
        User actor, 
        AuditAction actionType, 
        String entityName, 
        Long entityId, 
        String oldValue, 
        String newValue, 
        String ipAddress, 
        String userAgent
    );
}
