package com.pathologyLabSystem.Pathology.Lab.System.lab.entity.inv;


import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "inv_payment_ledger")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long paymentId;
    private LocalDate paymentDate;
    private Long vendorId;
    private String vendorName;
    private BigDecimal openingBalance;
    private BigDecimal paidAmount;
    private String paymentMode;
    private BigDecimal closingBalance;
    private String paymentAgentVoucher;
    private String remarks;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}