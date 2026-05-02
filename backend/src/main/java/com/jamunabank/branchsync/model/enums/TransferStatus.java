package com.jamunabank.branchsync.model.enums;

public enum TransferStatus {
    DRAFT,
    PENDING_APPROVAL,
    PENDING_DELIVERY,
    IN_TRANSIT,
    ARRIVED,
    COMPLETED,
    REJECTED,
    CANCELLED
}
