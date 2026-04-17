package com.jamunabank.branchsync.model.entity;

import com.jamunabank.branchsync.model.enums.ApprovalScope;
import com.jamunabank.branchsync.model.enums.Priority;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "approval_chains", uniqueConstraints = @UniqueConstraint(columnNames = {"category_id", "priority_level", "step_number"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ApprovalChain {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long chainId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private ItemCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority_level", nullable = false)
    private Priority priorityLevel = Priority.NORMAL;

    @Column(name = "step_number", nullable = false)
    private Integer stepNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "required_role_id", nullable = false)
    private Role requiredRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_scope", nullable = false)
    private ApprovalScope approvalScope;

    @Column(columnDefinition = "TEXT")
    private String description;
}
