package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.Department;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Page<Department> findByBranch_BranchId(Long branchId, Pageable pageable);
}
