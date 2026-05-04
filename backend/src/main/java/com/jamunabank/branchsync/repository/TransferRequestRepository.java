package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.TransferRequest;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
