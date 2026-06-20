package com.pathologyLabSystem.Pathology.Lab.System.lab.dto.inv;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class NonConsumableEntryDTO {
    private LocalDate entryDate;
    private Long itemId;
    private Long vendorId;
    private Integer receivedQuantityBox;
    private Integer perBoxQuantity;
    private String voucherNumber;
    private BigDecimal billAmount;
    private BigDecimal gst;
    private String representativeName;
    private String remarks;
}
