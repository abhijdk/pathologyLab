package com.pathologyLabSystem.Pathology.Lab.System.lab.dto.inv;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ConsumptionDTO {
    private LocalDate consumptionDate;
    private Long itemId;
    private Integer usedQuantity;
    private String usedBy;
    private String remarks;
}