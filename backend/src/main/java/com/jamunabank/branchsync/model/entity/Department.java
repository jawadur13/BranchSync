package com.jamunabank.branchsync.model.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "departments")
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "departments_seq")
    @SequenceGenerator(name = "departments_seq", sequenceName = "departments_department_id_seq", allocationSize = 1)
    private Long departmentId;

    @Column(name = "department_name", nullable = false, length = 150)
    private String departmentName;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "department_item_categories",
        joinColumns = @JoinColumn(name = "department_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private java.util.Set<ItemCategory> itemCategories = new java.util.HashSet<>();

    // head_user_id omitted — column not in current schema

    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMPTZ DEFAULT NOW()")
    private OffsetDateTime createdAt;

    public Department() {}

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
    public java.util.Set<ItemCategory> getItemCategories() { return itemCategories; }
    public void setItemCategories(java.util.Set<ItemCategory> itemCategories) { this.itemCategories = itemCategories; }

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
