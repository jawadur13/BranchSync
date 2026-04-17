package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.TransitCheckpoint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransitCheckpointRepository extends JpaRepository<TransitCheckpoint, Long> {
    Page<TransitCheckpoint> findByDispatchRecord_DispatchIdOrderByCheckedAtDesc(Long dispatchId, Pageable pageable);
}
