package com.pathologyLabSystem.Pathology.Lab.System.lab.controller;


import com.pathologyLabSystem.Pathology.Lab.System.lab.dto.BookingDTO;
import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.BookingTest;
import com.pathologyLabSystem.Pathology.Lab.System.lab.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping("/save")
    public ResponseEntity<String> saveBooking(@RequestBody BookingDTO bookingDTO) {
        try {
            bookingService.createBooking(bookingDTO);
            return ResponseEntity.ok("Booking created successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to create booking: " + e.getMessage());
        }
    }

    // URL: http://localhost:8080/api/bookings/update-payment?bId=1&payAmount=50.0
    @PutMapping("/update-payment")
    public ResponseEntity<String> updatePayment(@RequestBody Map<String, Object> payload) {
        try {
            // Extract values from JSON body
            Long bId = Long.valueOf(payload.get("bId").toString());
            Double payAmount = Double.valueOf(payload.get("payAmount").toString());

            String result = bookingService.updateBookingPayment(bId, payAmount);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Update failed: " + e.getMessage());
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<BookingTest>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBookingById(@PathVariable Long id) {
        return bookingService.getBookingById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}