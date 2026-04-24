package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.TransferRequest;
import com.jamunabank.branchsync.model.enums.TransferStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface TransferRequestRepository extends JpaRepository<TransferRequest, Long> {
    Optional<TransferRequest> findByRequestCode(String requestCode);
    
    Page<TransferRequest> findByStatus(TransferStatus status, Pageable pageable);
    
    Page<TransferRequest> findByOriginBranch_BranchId(Long branchId, Pageable pageable);
    
    Page<TransferRequest> findByDestinationBranch_BranchId(Long branchId, Pageable pageable);
    
    Page<TransferRequest> findByOriginBranch_BranchIdAndStatus(Long branchId, TransferStatus status, Pageable pageable);
    
    Page<TransferRequest> findByDestinationBranch_BranchIdAndStatus(Long branchId, TransferStatus status, Pageable pageable);
    
    Page<TransferRequest> findByInitiatedBy_UserId(Long userId, Pageable pageable);
    Page<TransferRequest> findByInitiatedBy_UserId(Long userId, Pageable pageable);
    
    // Non-paginated for simple dashboard
    List<TransferRequest> findByStatusOrderByRequestedAtDesc(TransferStatus status);
    List<TransferRequest> findByOriginBranch_BranchIdOrDestinationBranch_BranchIdOrderByRequestedAtDesc(Long originBranchId, Long destBranchId);
    List<TransferRequest> findAllByOrderByRequestedAtDesc();
}
