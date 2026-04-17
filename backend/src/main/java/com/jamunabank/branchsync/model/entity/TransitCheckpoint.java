package com.jamunabank.branchsync.model.entity;

import com.jamunabank.branchsync.model.enums.CheckpointStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "transit_checkpoints")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class TransitCheckpoint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long checkpointId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispatch_id", nullable = false)
    private DispatchRecord dispatchRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checked_by", nullable = false)
    private User checkedBy;

    @Column(name = "checkpoint_location", nullable = false, length = 255)
    private String checkpointLocation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CheckpointStatus status;

    @Column(name = "checked_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMPTZ DEFAULT NOW()")
    private OffsetDateTime checkedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
