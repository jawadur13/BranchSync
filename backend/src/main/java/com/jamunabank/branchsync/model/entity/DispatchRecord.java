package com.jamunabank.branchsync.model.entity;

import com.jamunabank.branchsync.model.enums.CarrierType;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "dispatch_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class DispatchRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long dispatchId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false, unique = true)
    private TransferRequest transferRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispatched_by", nullable = false)
    private User dispatchedBy;

    @Column(name = "dispatched_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMPTZ DEFAULT NOW()")
    private OffsetDateTime dispatchedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "carrier_type", nullable = false)
    private CarrierType carrierType;

    @Column(name = "carrier_name", nullable = false, length = 150)
    private String carrierName;

    @Column(name = "carrier_phone", length = 20)
    private String carrierPhone;

    @Column(name = "vehicle_number", length = 50)
    private String vehicleNumber;

    @Column(name = "estimated_arrival")
    private OffsetDateTime estimatedArrival;

    @Column(name = "dispatch_notes", columnDefinition = "TEXT")
    private String dispatchNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "witness_user_id")
    private User witnessUser;
}
