package com.pathologyLabSystem.Pathology.Lab.System.lab.entity.inv;


import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "inv_consumption")
public class Consumption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long consumptionId;
    private LocalDate consumptionDate;
    private Long itemId;
    private String itemName;
    private Integer openStock;
    private Integer usedQuantity;
    private String usedBy;
    private Integer closingStock;
    private String remarks;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}