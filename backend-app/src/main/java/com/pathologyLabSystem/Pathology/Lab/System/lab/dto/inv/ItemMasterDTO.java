package com.pathologyLabSystem.Pathology.Lab.System.lab.dto.inv;

import lombok.Data;

@Data
public class ItemMasterDTO {
    private String itemName;
    private Integer stock; // Usually starts at 0
    private String suffix; // e.g., "pcs", "ml", "box"
}