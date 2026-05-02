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
    
    // Non-paginated for simple dashboard
    List<TransferRequest> findByStatusOrderByRequestedAtDesc(TransferStatus status);
    List<TransferRequest> findByOriginBranch_BranchIdOrDestinationBranch_BranchIdOrderByRequestedAtDesc(Long originBranchId, Long destBranchId);
    
    @org.springframework.data.jpa.repository.Query("SELECT t FROM TransferRequest t WHERE t.originBranch.branchId = :branchId OR (t.destinationBranch.branchId = :branchId AND t.destinationDepartment.departmentId = :deptId) ORDER BY t.requestedAt DESC")
    List<TransferRequest> findDashboardTransfersForStaff(@org.springframework.data.repository.query.Param("branchId") Long branchId, @org.springframework.data.repository.query.Param("deptId") Long deptId);

    List<TransferRequest> findByDeliveryPerson_UserIdOrderByRequestedAtDesc(Long deliveryPersonId);
    List<TransferRequest> findAllByOrderByRequestedAtDesc();
}
