package com.pathologyLabSystem.Pathology.Lab.System.lab.dto.inv;

import lombok.Data;

import java.time.LocalDate;

@Data
public class NonConsumableDestroyDTO {
    private LocalDate date;
    private Long nciId;
    private Integer destroyQuantity;
    private String destroyedBy;
    private String remark;
}