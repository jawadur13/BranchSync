package com.jamunabank.branchsync.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "cash_transfer_details")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class CashTransferDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long cashDetailId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false, unique = true)
    private TransferRequest transferRequest;

    @Column(name = "total_amount_bdt", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmountBdt;

    @Column(name = "denomination_1000", nullable = false)
    private Integer denomination1000 = 0;

    @Column(name = "denomination_500", nullable = false)
    private Integer denomination500 = 0;

    @Column(name = "denomination_200", nullable = false)
    private Integer denomination200 = 0;

    @Column(name = "denomination_100", nullable = false)
    private Integer denomination100 = 0;

    @Column(name = "denomination_50", nullable = false)
    private Integer denomination50 = 0;

    @Column(name = "denomination_20", nullable = false)
    private Integer denomination20 = 0;

    @Column(name = "denomination_10", nullable = false)
    private Integer denomination10 = 0;

    @Column(name = "denomination_5", nullable = false)
    private Integer denomination5 = 0;

    @Column(name = "denomination_2", nullable = false)
    private Integer denomination2 = 0;

    @Column(name = "denomination_1", nullable = false)
    private Integer denomination1 = 0;

    @Column(name = "sealed_bag_count", nullable = false)
    private Integer sealedBagCount = 0;

    @Column(name = "bag_serial_numbers", columnDefinition = "TEXT")
    private String bagSerialNumbers;

    @Column(name = "cit_agent_name", length = 150)
    private String citAgentName;

    @Column(name = "cit_company", length = 150)
    private String citCompany;
}
