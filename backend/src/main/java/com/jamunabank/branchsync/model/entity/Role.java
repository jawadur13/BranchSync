package com.jamunabank.branchsync.model.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "roles")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "role_id")
    private Long roleId;

    @Column(name = "role_name", nullable = false, unique = true, length = 100)
    private String roleName;

    public Role() {}

    public Long getRoleId() { return roleId; }
    public void setRoleId(Long roleId) { this.roleId = roleId; }
    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }

    public static class RoleBuilder {
        private Role r = new Role();
        public RoleBuilder roleId(Long id) { r.roleId = id; return this; }
        public RoleBuilder roleName(String n) { r.roleName = n; return this; }
        public Role build() { return r; }
    }
    public static RoleBuilder builder() { return new RoleBuilder(); }
}
