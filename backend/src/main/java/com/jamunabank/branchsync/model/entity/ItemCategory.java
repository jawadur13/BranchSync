package com.jamunabank.branchsync.model.entity;

import com.jamunabank.branchsync.model.enums.CategoryName;
import com.jamunabank.branchsync.model.enums.SensitivityLevel;
import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "item_categories")
public class ItemCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Long categoryId;

    @Enumerated(EnumType.STRING)
    @Column(name = "category_name", nullable = false, unique = true)
    private CategoryName categoryName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "requires_dual_verification", nullable = false)
    private Boolean requiresDualVerification = false;

    @Column(name = "requires_hq_approval", nullable = false)
    private Boolean requiresHqApproval = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "sensitivity_level", nullable = false)
    private SensitivityLevel sensitivityLevel = SensitivityLevel.LOW;

    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMPTZ DEFAULT NOW()")
    private OffsetDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    public ItemCategory() {}

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public CategoryName getCategoryName() { return categoryName; }
    public void setCategoryName(CategoryName categoryName) { this.categoryName = categoryName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Boolean getRequiresDualVerification() { return requiresDualVerification; }
    public void setRequiresDualVerification(Boolean r) { this.requiresDualVerification = r; }
    public Boolean getRequiresHqApproval() { return requiresHqApproval; }
    public void setRequiresHqApproval(Boolean r) { this.requiresHqApproval = r; }
    public SensitivityLevel getSensitivityLevel() { return sensitivityLevel; }
    public void setSensitivityLevel(SensitivityLevel s) { this.sensitivityLevel = s; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime c) { this.createdAt = c; }
    public Department getDepartment() { return department; }
    public void setDepartment(Department d) { this.department = d; }

    public static class ItemCategoryBuilder {
        private ItemCategory c = new ItemCategory();
        public ItemCategoryBuilder categoryId(Long id) { c.categoryId = id; return this; }
        public ItemCategoryBuilder categoryName(CategoryName n) { c.categoryName = n; return this; }
        public ItemCategoryBuilder description(String d) { c.description = d; return this; }
        public ItemCategoryBuilder requiresDualVerification(Boolean r) { c.requiresDualVerification = r; return this; }
        public ItemCategoryBuilder requiresHqApproval(Boolean r) { c.requiresHqApproval = r; return this; }
        public ItemCategoryBuilder sensitivityLevel(SensitivityLevel s) { c.sensitivityLevel = s; return this; }
        public ItemCategoryBuilder createdAt(OffsetDateTime cat) { c.createdAt = cat; return this; }
        public ItemCategoryBuilder department(Department d) { c.department = d; return this; }
        public ItemCategory build() { return c; }
    }
    public static ItemCategoryBuilder builder() { return new ItemCategoryBuilder(); }
}
