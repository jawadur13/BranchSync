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

    /**
     * Approves a transfer request.
     * Logic:
     * 1. Verify Role (FEO or Branch Manager)
     * 2. Move to APPROVED
     * 3. Log Audit
     */
    TransferRequest approveTransfer(Long requestId, Long approverId);

    /**
     * Handles dual-verification confirmation.
     * Logic:
     * 1. Verify if actor belongs to the correct branch (Origin vs Dest)
     * 2. Update ReceiptRecord
     * 3. If both confirmed, move status to SUCCESSFUL (or CONFIRMED in your enum)
     */
    TransferRequest processDualVerification(Long requestId, Long actorId, boolean isOriginConfirmation);

    /**
     * Gets a list of transfers relevant to the user's role and branch for the dashboard.
     */
    List<TransferRequest> getDashboardTransfers(Long actorId);
}
