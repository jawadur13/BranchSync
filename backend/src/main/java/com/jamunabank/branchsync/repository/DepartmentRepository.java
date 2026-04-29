package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.Department;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Page<Department> findByBranch_BranchId(Long branchId, Pageable pageable);

    @Query("SELECT d FROM Department d LEFT JOIN FETCH d.branch")
    List<Department> findAllWithBranch();
}
