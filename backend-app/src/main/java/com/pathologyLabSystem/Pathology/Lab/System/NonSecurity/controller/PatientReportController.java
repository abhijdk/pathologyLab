package com.pathologyLabSystem.Pathology.Lab.System.NonSecurity.controller;

import com.pathologyLabSystem.Pathology.Lab.System.NonSecurity.dto.PublicPatientReportDTO;
import com.pathologyLabSystem.Pathology.Lab.System.NonSecurity.dto.PublicTestGroupDTO;
import com.pathologyLabSystem.Pathology.Lab.System.NonSecurity.dto.PublicTestResultDTO;
import com.pathologyLabSystem.Pathology.Lab.System.lab.dto.TestReportDTO;
import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.*;

// Adjust these imports based on where your Repositories & Services actually live
import com.pathologyLabSystem.Pathology.Lab.System.lab.repository.TestCategoryRepository;
import com.pathologyLabSystem.Pathology.Lab.System.lab.repository.TestParameterRepository;
import com.pathologyLabSystem.Pathology.Lab.System.lab.service.TestReportService;
import com.pathologyLabSystem.Pathology.Lab.System.lab.service.BookingService;
import com.pathologyLabSystem.Pathology.Lab.System.lab.service.PatientService;
import com.pathologyLabSystem.Pathology.Lab.System.lab.service.DoctorService;

import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@AllArgsConstructor
@RequestMapping("/api/patientReports")
@CrossOrigin(origins = "http://localhost:5173")
public class PatientReportController {

    private final TestReportService reportService;
    private final BookingService bookingService;
    private final PatientService patientService;
    private final DoctorService doctorService;

    // Using Repositories directly since there are no dedicated services
    private final TestCategoryRepository categoryRepository;
    private final TestParameterRepository parameterRepository;


    @Autowired
    private PasswordEncoder passwordEncoder;





    @GetMapping("/{bookingId}")
    public ResponseEntity<?> getPatientReport(@PathVariable Long bookingId) {


        String rawPassword = "admin";
        String encodedPassword = passwordEncoder.encode(rawPassword);

        System.out.println("Raw Password: " + rawPassword);
        System.out.println("Encoded Password: " + encodedPassword);

        try {
            // 1. Fetch raw reports
            List<TestReportDTO> rawReports = reportService.getReportsByBooking(bookingId);

            if (rawReports == null || rawReports.isEmpty()) {
                return ResponseEntity.badRequest().body("No reports found for this booking.");
            }

            PublicPatientReportDTO responseDTO = new PublicPatientReportDTO();
            responseDTO.setBookingId(bookingId);

            // 2. Fetch Demographics
            BookingTest booking = bookingService.getBookingById(bookingId).orElse(null);

            if (booking != null) {
                responseDTO.setBookingDate(booking.getBookingDate());

                // Fetch Patient
                // Fetch Patient
                Patient patient = patientService.getPatientById(booking.getPatientId());
                if (patient != null) {
                    // Change .getName() to .getPatientName() if your entity uses that field
                    responseDTO.setPatientName(patient.getName());
                    // Change .getPhone() to .getMobile() if your entity uses mobile
                    responseDTO.setMobile(patient.getPhone() != null ? patient.getPhone() : "N/A");
                }

// Fetch Doctor (Note: Casting to Integer because DoctorService uses Integer IDs)
                if (booking.getDoctorId() != null) {
                    Doctor doctor = doctorService.getDoctorById(booking.getDoctorId().intValue());
                    responseDTO.setDoctorName(doctor != null ? doctor.getName() : "Self");
                } else {
                    responseDTO.setDoctorName("Self");
                }
            }

            // 3. Group by Category ID
            Map<Long, List<TestReportDTO>> groupedByCategory = rawReports.stream()
                    .collect(Collectors.groupingBy(TestReportDTO::getCategoryId));

            // 4. Process Categories and Parameters
            for (Map.Entry<Long, List<TestReportDTO>> entry : groupedByCategory.entrySet()) {
                Long categoryId = entry.getKey();
                List<TestReportDTO> reportsInCategory = entry.getValue();

                PublicTestGroupDTO testGroup = new PublicTestGroupDTO();

                // Fetch Category Entity
                TestCategory category = categoryRepository.findById(categoryId).orElse(null);

                if (category != null) {
                    testGroup.setCategoryName(category.getCategoryName());
                    // Navigate through the relationship to get the Master Test name
                    if (category.getTestMaster() != null) {
                        testGroup.setMasterName(category.getTestMaster().getTestName());
                    } else {
                        testGroup.setMasterName("Laboratory Tests");
                    }
                } else {
                    testGroup.setCategoryName("Category " + categoryId);
                    testGroup.setMasterName("Laboratory Tests");
                }

                // Process Results
                for (TestReportDTO report : reportsInCategory) {
                    PublicTestResultDTO resultDTO = new PublicTestResultDTO();
                    resultDTO.setValue(report.getResultValue());

                    // Fetch Parameter Entity
                    TestParameter param = parameterRepository.findById(report.getParamId()).orElse(null);

                    if (param != null) {
                        resultDTO.setParameter(param.getParamName());
                        resultDTO.setUnit(param.getUnit() != null ? param.getUnit() : "-");

                        // Construct the Reference Range String exactly as provided in your entity
                        String range = "M: " + param.getRefMaleMin() + " - " + param.getRefMaleMax() +
                                "\nF: " + param.getRefFemaleMin() + " - " + param.getRefFemaleMax();
                        resultDTO.setRange(range);
                    } else {
                        resultDTO.setParameter("Unknown Parameter");
                        resultDTO.setUnit("-");
                        resultDTO.setRange("-");
                    }

                    testGroup.getResults().add(resultDTO);
                }

                responseDTO.getTests().add(testGroup);
            }

            return ResponseEntity.ok(responseDTO);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error generating report: " + e.getMessage());
        }
    }
}