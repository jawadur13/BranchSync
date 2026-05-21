package com.jamunabank.branchsync.model.entity;

import com.jamunabank.branchsync.model.enums.CategoryBehavior;
import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "item_categories")
public class ItemCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "category_name", nullable = false, unique = true, length = 255)
    private String categoryName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "sensitivity_level", nullable = false, length = 50)
    private String sensitivityLevel = "LOW";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    /**
     * Drives runtime behavior for this category.
     * CASH    = vault balance tracking, denominations, cash ledger, manual adjustments
     * STOCK   = quantity tracking, stock ledger, stock manual adjustments
     * DOCUMENT_CASE = plain transfer workflow, no quantity/balance tracking
     *
     * Defaults to DOCUMENT_CASE for backward compatibility.
     * IMPORTANT: Run DB migration to set 'Cash Bundle' to CASH after deployment.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "behavior_type", nullable = false, length = 20)
    private CategoryBehavior behaviorType = CategoryBehavior.DOCUMENT_CASE;

    public ItemCategory() {}

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }
    public String getSensitivityLevel() { return sensitivityLevel; }
    public void setSensitivityLevel(String sensitivityLevel) { this.sensitivityLevel = sensitivityLevel; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public boolean getIsActive() { return isActive; }
    public void setIsActive(boolean active) { this.isActive = active; }
    public CategoryBehavior getBehaviorType() { return behaviorType; }
    public void setBehaviorType(CategoryBehavior behaviorType) { this.behaviorType = behaviorType; }

    public static class ItemCategoryBuilder {
        private ItemCategory c = new ItemCategory();
        public ItemCategoryBuilder categoryId(Long id) { c.categoryId = id; return this; }
        public ItemCategoryBuilder categoryName(String n) { c.categoryName = n; return this; }
        public ItemCategoryBuilder department(Department d) { c.department = d; return this; }
        public ItemCategoryBuilder sensitivityLevel(String s) { c.sensitivityLevel = s; return this; }
        public ItemCategoryBuilder description(String d) { c.description = d; return this; }
        public ItemCategoryBuilder createdAt(OffsetDateTime t) { c.createdAt = t; return this; }
        public ItemCategoryBuilder isActive(boolean active) { c.isActive = active; return this; }
        public ItemCategoryBuilder behaviorType(CategoryBehavior b) { c.behaviorType = b; return this; }
        public ItemCategory build() { return c; }
    }
    public static ItemCategoryBuilder builder() { return new ItemCategoryBuilder(); }
}

