package com.pathologyLabSystem.Pathology.Lab.System.lab.dto;


import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TestReportDTO {
    private Long reportId;
    private Long bookingId;
    private Long categoryId;
    private Long paramId;
    private String resultValue;
    private LocalDateTime capturedAt;
}
