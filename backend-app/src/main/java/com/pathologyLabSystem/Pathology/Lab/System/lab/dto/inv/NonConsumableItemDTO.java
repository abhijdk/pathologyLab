package com.pathologyLabSystem.Pathology.Lab.System.lab.dto.inv;

import lombok.Data;
import java.time.LocalDate;

@Data
public class NonConsumableItemDTO {
    private LocalDate date;
    private String itemName;
    private String itemSerialNumber;
    private String itemOptional;
    private Integer stock;
    private LocalDate maintenanceNextDate;
    private Integer maintenanceDurationMonths; // Add this
}