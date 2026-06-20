package com.pathologyLabSystem.Pathology.Lab.System.lab.entity.inv;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;



@Data
@Entity
@Table(name = "inv_non_con_inventory_entry")
public class NonConsumableEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long inventoryEntryId;
    private LocalDate entryDate;
    private Long itemId;
    private String itemName;
    private Long vendorId;
    private String vendorName;
    private Integer openingBalance;
    private Integer receivedQuantityBox;
    private Integer perBoxQuantity;
    private Integer totalQuantityReceived;
    private Integer closingBalance;
    private String voucherNumber;
    private BigDecimal billAmount;
    private BigDecimal gst;
    private String representativeName;
    private BigDecimal perKitOrMlCost;
    private String remarks;
    @Column(updatable = false, insertable = false)
    private LocalDateTime createdAt;
}
