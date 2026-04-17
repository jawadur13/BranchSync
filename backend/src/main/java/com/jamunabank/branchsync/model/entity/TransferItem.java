package com.jamunabank.branchsync.model.entity;

import com.jamunabank.branchsync.model.enums.Condition;
import com.jamunabank.branchsync.model.enums.Unit;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "transfer_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class TransferItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long itemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private TransferRequest transferRequest;

    @Column(name = "item_name", nullable = false, length = 255)
    private String itemName;

    @Column(name = "item_description", columnDefinition = "TEXT")
    private String itemDescription;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Unit unit;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_on_send", nullable = false)
    private Condition conditionOnSend = Condition.GOOD;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_on_receive")
    private Condition conditionOnReceive;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
