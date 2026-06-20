package com.pathologyLabSystem.Pathology.Lab.System.lab.dto.inv;

import lombok.Data;
import java.math.BigDecimal; // Don't forget this import!

@Data
public class BillItemDTO {
    private Long itemId;
    private Integer receivedQuantityBox;
    private Integer perBoxQuantity;

    // This catches the individual amount from the React frontend
    private BigDecimal itemAmount;
}