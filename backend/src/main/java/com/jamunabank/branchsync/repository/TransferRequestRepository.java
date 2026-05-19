package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.TransferRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransferRequestRepository extends JpaRepository<TransferRequest, Long> {
    Optional<TransferRequest> findByRequestCode(String requestCode);

    List<TransferRequest> findAllByOrderByRequestedAtDesc();

    List<TransferRequest> findByOriginBranch_BranchIdOrDestinationBranch_BranchIdOrderByRequestedAtDesc(
            Long originBranchId, Long destBranchId);

    List<TransferRequest> findByDeliveryPerson_UserIdOrderByRequestedAtDesc(Long deliveryPersonId);

    List<TransferRequest> findByInitiatedBy_UserIdOrderByRequestedAtDesc(Long userId);

    // Dashboard for HQ officers: only transfers awaiting their approval
    List<TransferRequest> findByStatusOrderByRequestedAtDesc(String status);

    // Dashboard for regular branch users:
    // - Source branch sees ALL their outgoing transfers (any status)
    // - Destination branch ONLY sees transfers after HQ has approved (status not in pre-HQ states)
    @Query("SELECT t FROM TransferRequest t WHERE " +
           "(t.originBranch.branchId = :branchId) OR " +
           "(t.destinationBranch IS NOT NULL AND t.destinationBranch.branchId = :branchId AND t.status NOT IN ('PENDING_INTERNAL', 'PENDING_HQ_APPROVAL', 'REJECTED_BY_HQ')) " +
           "ORDER BY t.requestedAt DESC")
    List<TransferRequest> findByBranchDashboard(@Param("branchId") Long branchId);
}

