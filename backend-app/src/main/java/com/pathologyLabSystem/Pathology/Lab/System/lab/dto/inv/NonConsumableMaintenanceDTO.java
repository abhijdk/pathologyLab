package com.pathologyLabSystem.Pathology.Lab.System.lab.dto.inv;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class NonConsumableMaintenanceDTO {
    private LocalDate date;
    private Long niId;
    private String engineerName;
    private String presenceOfStaff;
    private BigDecimal maintenanceAmount;
    private String remarks;
}
