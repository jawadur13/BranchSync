package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.DispatchRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface DispatchRecordRepository extends JpaRepository<DispatchRecord, Long> {
    Optional<DispatchRecord> findByTransferRequest_RequestId(Long requestId);
}
