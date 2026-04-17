package com.jamunabank.branchsync.model.entity;

import com.jamunabank.branchsync.model.enums.Condition;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "receipt_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ReceiptRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long receiptId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false, unique = true)
    private TransferRequest transferRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "received_by", nullable = false)
    private User receivedBy;

    @Column(name = "received_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMPTZ DEFAULT NOW()")
    private OffsetDateTime receivedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_noted", nullable = false)
    private Condition conditionNoted;

    @Column(name = "receiver_notes", columnDefinition = "TEXT")
    private String receiverNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "origin_confirmation_by")
    private User originConfirmationBy;

    @Column(name = "origin_confirmed_at")
    private OffsetDateTime originConfirmedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_confirmation_by")
    private User destinationConfirmationBy;

    @Column(name = "destination_confirmed_at")
    private OffsetDateTime destinationConfirmedAt;

    @Column(name = "dual_verification_complete", nullable = false)
    private Boolean dualVerificationComplete = false;
}
