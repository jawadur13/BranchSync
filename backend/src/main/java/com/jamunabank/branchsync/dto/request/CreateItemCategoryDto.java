package com.jamunabank.branchsync.dto.request;

import jakarta.validation.constraints.NotBlank;

public class CreateItemCategoryDto {

    @NotBlank(message = "Category name is required")
    private String categoryName;

    private Long departmentId; // nullable = open access

    private String sensitivityLevel = "LOW"; // LOW | MEDIUM | HIGH | CRITICAL

    private String description;

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public String getSensitivityLevel() { return sensitivityLevel; }
    public void setSensitivityLevel(String sensitivityLevel) { this.sensitivityLevel = sensitivityLevel; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
