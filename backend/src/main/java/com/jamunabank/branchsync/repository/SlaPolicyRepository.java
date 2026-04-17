package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.SlaPolicy;
import com.jamunabank.branchsync.model.enums.Priority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SlaPolicyRepository extends JpaRepository<SlaPolicy, Long> {
    Optional<SlaPolicy> findByCategory_CategoryIdAndPriorityLevel(Long categoryId, Priority priorityLevel);
}
