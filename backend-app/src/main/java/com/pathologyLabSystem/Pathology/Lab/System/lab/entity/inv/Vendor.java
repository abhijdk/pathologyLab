package com.pathologyLabSystem.Pathology.Lab.System.lab.entity.inv;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "inv_vendor")
public class Vendor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long vendorId;
    private String vendorName;
    private String vendorMobile;
    private String vendorEmail;
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
