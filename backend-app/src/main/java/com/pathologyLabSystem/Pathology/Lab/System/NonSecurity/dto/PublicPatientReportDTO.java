package com.pathologyLabSystem.Pathology.Lab.System.NonSecurity.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class PublicPatientReportDTO {
    private Long bookingId;
    private String patientName;
    private String mobile;
    private String doctorName;
    private LocalDateTime bookingDate;
    private List<PublicTestGroupDTO> tests = new ArrayList<>();
}