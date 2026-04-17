package com.jamunabank.branchsync.model.entity;

import com.jamunabank.branchsync.model.enums.CategoryName;
import com.jamunabank.branchsync.model.enums.SensitivityLevel;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "item_categories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ItemCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long categoryId;

    @Enumerated(EnumType.STRING)
    @Column(name = "category_name", nullable = false, unique = true)
    private CategoryName categoryName;

    @Column(name = "requires_dual_verification", nullable = false)
    private Boolean requiresDualVerification = false;

    @Column(name = "requires_hq_approval", nullable = false)
    private Boolean requiresHqApproval = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "sensitivity_level", nullable = false)
    private SensitivityLevel sensitivityLevel = SensitivityLevel.LOW;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMPTZ DEFAULT NOW()")
    private OffsetDateTime createdAt;
}
