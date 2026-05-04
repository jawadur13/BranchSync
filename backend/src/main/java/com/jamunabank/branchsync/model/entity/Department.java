package com.jamunabank.branchsync.model.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "departments")
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "department_name", nullable = false, unique = true, length = 255)
    private String departmentName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public Department() {}

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public static class DepartmentBuilder {
        private Department d = new Department();
        public DepartmentBuilder departmentId(Long id) { d.departmentId = id; return this; }
        public DepartmentBuilder departmentName(String n) { d.departmentName = n; return this; }
        public DepartmentBuilder createdAt(OffsetDateTime c) { d.createdAt = c; return this; }
        public Department build() { return d; }
    }
    public static DepartmentBuilder builder() { return new DepartmentBuilder(); }
}
