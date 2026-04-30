package com.jamunabank.branchsync.model.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "roles")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "role_id")
    private Long roleId;

    @Column(name = "role_name", nullable = false, unique = true, length = 50)
    private String roleName;

    @Column(name = "role_level", nullable = false)
    private Integer roleLevel = 0;

    @Column(columnDefinition = "TEXT")
    private String description;

    public Role() {}

    public Long getRoleId() { return roleId; }
    public void setRoleId(Long roleId) { this.roleId = roleId; }
    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }
    public Integer getRoleLevel() { return roleLevel; }
    public void setRoleLevel(Integer roleLevel) { this.roleLevel = roleLevel; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public static class RoleBuilder {
        private Role r = new Role();
        public RoleBuilder roleId(Long id) { r.roleId = id; return this; }
        public RoleBuilder roleName(String n) { r.roleName = n; return this; }
        public RoleBuilder roleLevel(Integer l) { r.roleLevel = l; return this; }
        public RoleBuilder description(String d) { r.description = d; return this; }
        public Role build() { return r; }
    }
    public static RoleBuilder builder() { return new RoleBuilder(); }
}
