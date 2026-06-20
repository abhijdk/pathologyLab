package com.pathologyLabSystem.Pathology.Lab.System.lab.controller;

import com.pathologyLabSystem.Pathology.Lab.System.lab.dto.TestReportDTO;
import com.pathologyLabSystem.Pathology.Lab.System.lab.service.TestReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "http://localhost:5173") // Adjust for your React port
public class TestReportController {

    @Autowired
    private TestReportService reportService;

    // Save multiple test results at once
    @PostMapping("/save")
    public ResponseEntity<List<TestReportDTO>> saveResults(@RequestBody List<TestReportDTO> reports) {
        return ResponseEntity.ok(reportService.saveReports(reports));
    }

    // Get results for a specific booking
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<TestReportDTO>> getByBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(reportService.getReportsByBooking(bookingId));
    }

    // Get results for a specific booking
    @GetMapping("/booking/all")
    public ResponseEntity<List<TestReportDTO>> getAllBooking() {
        return ResponseEntity.ok(reportService.getAllBooking());
    }
}