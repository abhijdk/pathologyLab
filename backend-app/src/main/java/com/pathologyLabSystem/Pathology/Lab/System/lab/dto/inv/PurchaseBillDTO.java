package com.pathologyLabSystem.Pathology.Lab.System.lab.dto.inv;


import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class PurchaseBillDTO {
    private Long vendorId;
    private LocalDate entryDate;
    private String voucherNumber;
    private BigDecimal billAmount;
    private BigDecimal gst;
    private String representativeName;
    private String remarks;

    // This holds all the items inside the single bill
    private List<BillItemDTO> items;
}