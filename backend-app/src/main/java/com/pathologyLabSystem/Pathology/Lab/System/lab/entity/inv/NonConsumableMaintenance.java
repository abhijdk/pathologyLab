package com.pathologyLabSystem.Pathology.Lab.System.lab.entity.inv;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;


@Data
@Entity
@Table(name = "inv_non_con_mantance")
public class NonConsumableMaintenance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long mid;

    private LocalDate date;

    @Column(name = "n_i_id") // <-- ADDED THIS
    private Long niId;

    private String itemName;
    private String serialNumber;
    private String engineerName;
    private String presenceOfStaff;
    private BigDecimal maintenanceAmount;
    private String remarks;
}
