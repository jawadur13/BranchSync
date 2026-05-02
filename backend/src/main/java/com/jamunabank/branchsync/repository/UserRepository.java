package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    @Query("SELECT u FROM User u JOIN FETCH u.role LEFT JOIN FETCH u.branch LEFT JOIN FETCH u.department")
    List<User> findAllWithDetails();

    Optional<User> findByEmployeeId(String employeeId);

    @Query("SELECT u FROM User u JOIN FETCH u.role WHERE u.employeeId = :employeeId")
    Optional<User> findByEmployeeIdWithRole(@Param("employeeId") String employeeId);

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.role.roleName = 'DELIVERY_PERSON' " +
           "AND u.isActive = true " +
           "AND u.userId NOT IN (SELECT COALESCE(tr.deliveryPerson.userId, 0) FROM TransferRequest tr WHERE tr.status IN ('DISPATCHED', 'IN_TRANSIT'))")
    List<User> findAvailableDeliveryPersons();

    Page<User> findByRole_RoleName(String roleName, Pageable pageable);

    Page<User> findByBranch_BranchId(Long branchId, Pageable pageable);

    Page<User> findByIsActiveTrue(Pageable pageable);
}
