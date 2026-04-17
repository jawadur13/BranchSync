package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.TransferItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransferItemRepository extends JpaRepository<TransferItem, Long> {
    Page<TransferItem> findByTransferRequest_RequestId(Long requestId, Pageable pageable);
}
