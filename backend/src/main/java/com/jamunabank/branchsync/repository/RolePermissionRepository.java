package com.jamunabank.branchsync.repository;

import com.jamunabank.branchsync.model.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {
    List<RolePermission> findByRole_RoleId(Long roleId);
}
