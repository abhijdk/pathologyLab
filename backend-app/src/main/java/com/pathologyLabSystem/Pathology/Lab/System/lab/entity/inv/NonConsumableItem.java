package com.pathologyLabSystem.Pathology.Lab.System.lab.entity.inv;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
@Data
@Entity
@Table(name = "inv_non_con_item_master")
public class NonConsumableItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long itemId;
    private LocalDate date;
    private String itemName;
    private String itemSerialNumber;
    private String itemOptional;
    private Integer stock;
    private LocalDate maintenanceNextDate;

    // Add this new field
    @Column(name = "maintenance_duration_months")
    private Integer maintenanceDurationMonths;

    @Column(updatable = false, insertable = false)
    private LocalDateTime createdAt;
}