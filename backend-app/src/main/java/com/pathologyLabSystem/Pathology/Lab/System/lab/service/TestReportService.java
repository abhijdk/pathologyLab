package com.pathologyLabSystem.Pathology.Lab.System.lab.service;

import com.pathologyLabSystem.Pathology.Lab.System.lab.dto.TestReportDTO;
import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.TestReport;
import com.pathologyLabSystem.Pathology.Lab.System.lab.repository.TestReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TestReportService {

    @Autowired
    private TestReportRepository reportRepository;

//    public List<TestReportDTO> saveReports(List<TestReportDTO> dtos) {
//        List<TestReport> reports = dtos.stream().map(dto -> {
//            TestReport report = new TestReport();
//            report.setBookingId(dto.getBookingId());
//            report.setCategoryId(dto.getCategoryId());
//            report.setParamId(dto.getParamId());
//            report.setResultValue(dto.getResultValue());
//            return report;
//        }).collect(Collectors.toList());
//
//        List<TestReport> savedReports = reportRepository.saveAll(reports);
//
//        return savedReports.stream().map(this::convertToDTO).collect(Collectors.toList());
//    }

    public List<TestReportDTO> saveReports(List<TestReportDTO> reports) {
        for (TestReportDTO dto : reports) {
            // Check if this result already exists for this booking and parameter
            TestReport existingReport = reportRepository.findByBookingIdAndParamId(dto.getBookingId(), dto.getParamId());

            if (existingReport != null) {
                // It exists! Update the value instead of creating a new row
                existingReport.setResultValue(dto.getResultValue());
                reportRepository.save(existingReport);
            } else {
                // It doesn't exist, create a new one
                TestReport newReport = new TestReport();
                newReport.setBookingId(dto.getBookingId());
                newReport.setCategoryId(dto.getCategoryId());
                newReport.setParamId(dto.getParamId());
                newReport.setResultValue(dto.getResultValue());
                // Set other fields...
                reportRepository.save(newReport);
            }
        }
        return reports;
    }

    public List<TestReportDTO> getReportsByBooking(Long bookingId) {
        return reportRepository.findByBookingId(bookingId)
                .stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    // FIXED: Changed return type from List<List<TestReportDTO>> to List<TestReportDTO>
    public List<TestReportDTO> getAllBooking() {
        return reportRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private TestReportDTO convertToDTO(TestReport entity) {
        TestReportDTO dto = new TestReportDTO();
        dto.setReportId(entity.getReportId());
        dto.setBookingId(entity.getBookingId());
        dto.setCategoryId(entity.getCategoryId());
        dto.setParamId(entity.getParamId());
        dto.setResultValue(entity.getResultValue());
        dto.setCapturedAt(entity.getCapturedAt());
        return dto;
    }
}