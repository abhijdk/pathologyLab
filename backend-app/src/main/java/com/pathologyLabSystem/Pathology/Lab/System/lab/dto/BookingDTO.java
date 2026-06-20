package com.pathologyLabSystem.Pathology.Lab.System.lab.dto;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Data
@Getter
@Setter
public class BookingDTO {

    private Long patientId;
    private Integer doctorId;

    private List<Long> categoryIds;   // ✅ correct

    private Double advanceAmount;

    // optional (can be auto-calculated)
    private String paymentStatus;
}