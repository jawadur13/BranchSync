package com.jamunabank.branchsync.service;

import com.jamunabank.branchsync.model.entity.TransferRequest;
import java.util.List;

public interface TransferService {
    // Step 1: Initiate (auto-bypasses if Manager/FEO)
    TransferRequest initiateTransfer(TransferRequest request, Long actorId);

    // Step 1 Gate: Manager/FEO at source branch approves internally
    TransferRequest approveInternal(Long requestId, Long approverId);

    // Step 2: Dest dept staff accepts and assigns available driver
    TransferRequest acceptAndAssignDriver(Long requestId, Long acceptorId, Long deliveryPersonId);

    // Step 3: Dest Manager/FEO gives final green light
    TransferRequest releaseFinal(Long requestId, Long releaserId);

    // Step 4: Driver picks up from source
    TransferRequest markPickedUp(Long requestId, Long driverId);

    // Step 5: Driver marks as delivered at destination
    TransferRequest markDelivered(Long requestId, Long driverId);

    // Step 6: Original requester accepts or rejects on receipt
    TransferRequest closeRequest(Long requestId, Long requesterId, String finalNote, boolean accepted);

    List<TransferRequest> getDashboardTransfers(Long actorId);

    // History: all completed/terminated transfers for the user's context
    List<TransferRequest> getTransferHistory(Long actorId);
}
