package com.pathologyLabSystem.Pathology.Lab.System.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Entity
@Data
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer doctorId;

    private String name;

    private BigDecimal commissionPercentage;

    private BigDecimal totalCommission = BigDecimal.ZERO;

    private BigDecimal receivedCommission = BigDecimal.ZERO;

    @Transient
    public BigDecimal getPendingCommission() {
        return totalCommission.subtract(receivedCommission);
    }
}