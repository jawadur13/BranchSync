package com.jamunabank.branchsync.model.entity;

import com.jamunabank.branchsync.model.enums.Priority;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "sla_policies", uniqueConstraints = @UniqueConstraint(columnNames = {"category_id", "priority_level"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class SlaPolicy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long slaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private ItemCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority_level", nullable = false)
    private Priority priorityLevel;

    @Column(name = "max_approval_hours", nullable = false)
    private Integer maxApprovalHours;

    @Column(name = "max_transit_hours", nullable = false)
    private Integer maxTransitHours;

    @Column(name = "max_confirmation_hours", nullable = false)
    private Integer maxConfirmationHours;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "escalation_role_id", nullable = false)
    private Role escalationRole;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMPTZ DEFAULT NOW()")
    private OffsetDateTime createdAt;
}
