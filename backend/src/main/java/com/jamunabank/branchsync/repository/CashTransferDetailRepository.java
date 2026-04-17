package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.CashTransferDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CashTransferDetailRepository extends JpaRepository<CashTransferDetail, Long> {
    Optional<CashTransferDetail> findByTransferRequest_RequestId(Long requestId);
}
