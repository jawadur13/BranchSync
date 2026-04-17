package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmployeeId(String employeeId);
    Optional<User> findByEmail(String email);
    Page<User> findByRole_RoleName(String roleName, Pageable pageable);
    Page<User> findByBranch_BranchId(Long branchId, Pageable pageable);
    Page<User> findByIsActiveTrue(Pageable pageable);
}
