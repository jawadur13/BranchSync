package com.jamunabank.branchsync.service;

import com.jamunabank.branchsync.model.entity.TransferRequest;
import java.util.List;

public interface TransferService {
    /**
     * Initiates a new transfer request.
     * Logic:
     * 1. Generate Request Code (REQ-2026-XXXX)
     * 2. Set Status (DRAFT or PENDING_APPROVAL based on constraints)
     * 3. Log Audit
     */
    TransferRequest initiateTransfer(TransferRequest request, Long actorId);

    // Step 2: Approve & Assign Delivery (Source Branch Manager/FEO)
    TransferRequest approveAndAssignDelivery(Long requestId, Long approverId, Long deliveryPersonId);

    // Step 3: Handoff to Delivery (Delivery Person)
    TransferRequest markAsInTransit(Long requestId, Long actorId);

    // Step 4: Mark as Arrived (Delivery Person)
    TransferRequest markAsArrived(Long requestId, Long actorId);

    // Step 5: Confirm Receipt (Destination Branch Manager/FEO)
    TransferRequest confirmReceipt(Long requestId, Long actorId, String finalNote);

    List<TransferRequest> getDashboardTransfers(Long actorId);
}
