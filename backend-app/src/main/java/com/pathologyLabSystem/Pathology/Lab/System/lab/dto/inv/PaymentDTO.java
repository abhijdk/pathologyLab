package com.pathologyLabSystem.Pathology.Lab.System.lab.dto.inv;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PaymentDTO {
    private LocalDate paymentDate;
    private Long vendorId;
    private BigDecimal paidAmount;
    private String paymentMode;
    private String paymentAgentVoucher;
    private String remarks;
}
