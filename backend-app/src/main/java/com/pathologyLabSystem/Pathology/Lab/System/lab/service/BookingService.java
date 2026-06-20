package com.pathologyLabSystem.Pathology.Lab.System.lab.service;

import com.pathologyLabSystem.Pathology.Lab.System.lab.dto.BookingDTO;
import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.BookingTest;
import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.Doctor;
import com.pathologyLabSystem.Pathology.Lab.System.lab.repository.BookingRepository;
import com.pathologyLabSystem.Pathology.Lab.System.lab.repository.DoctorRepository;
import com.pathologyLabSystem.Pathology.Lab.System.lab.repository.TestCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private TestCategoryRepository testCategoryRepository;

    @Transactional
    public void createBooking(BookingDTO dto) {
        // 1. Calculate the total amount using BigDecimal for precision
        BigDecimal totalBookingAmount = testCategoryRepository.findAllById(dto.getCategoryIds())
                .stream()
                .map(cat -> BigDecimal.valueOf(cat.getAmount())) // Convert Double/amount to BigDecimal
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Fetch the Doctor
        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found with ID: " + dto.getDoctorId()));

        // 3. Calculate Commission: (totalBookingAmount * commissionPercentage) / 100
        // We use RoundingMode.HALF_UP to handle decimal rounding safely
        BigDecimal commissionEarned = totalBookingAmount
                .multiply(doctor.getCommissionPercentage())
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        // 4. Update Doctor's total commission (Old + New)
        doctor.setTotalCommission(doctor.getTotalCommission().add(commissionEarned));

        // Save updated doctor info
        doctorRepository.save(doctor);

        // 5. Save the Booking via native query
        bookingRepository.saveBookingWithCalculation(
                dto.getPatientId(),
                dto.getDoctorId(),
                dto.getCategoryIds(),
                dto.getAdvanceAmount()
        );
    }

    @Transactional
    public String updateBookingPayment(Long bookingId, Double payAmount) {
        int rows = bookingRepository.updatePayment(bookingId, payAmount);
        if (rows > 0) {
            return "Payment successful. Database has auto-calculated the remaining balance.";
        } else {
            throw new RuntimeException("Booking not found with ID: " + bookingId);
        }
    }

    public List<BookingTest> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Optional<BookingTest> getBookingById(Long id) {
        return bookingRepository.findById(id);
    }
}