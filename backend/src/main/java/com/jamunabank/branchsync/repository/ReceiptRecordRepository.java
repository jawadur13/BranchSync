package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.ReceiptRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ReceiptRecordRepository extends JpaRepository<ReceiptRecord, Long> {
    Optional<ReceiptRecord> findByTransferRequest_RequestId(Long requestId);
}
