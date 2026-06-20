package com.pathologyLabSystem.Pathology.Lab.System.lab.repository;

import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.BookingTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<BookingTest, Long> {

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO booking_test (patient_id, doctor_id, booking_category, total_amount, advance_amount, payment_status, report_status, booking_date) " +
            "SELECT :pId, :dId, JSON_ARRAYAGG(category_id), SUM(amount), :advance, " +
            "CASE WHEN :advance >= SUM(amount) THEN 'Paid' ELSE 'Partial' END, 'Awaiting', NOW() " +
            "FROM test_category WHERE category_id IN (:catIds)", nativeQuery = true)
    void saveBookingWithCalculation(
            @Param("pId") Long patientId,
            @Param("dId") Integer doctorId,
            @Param("catIds") List<Long> categoryIds,
            @Param("advance") Double advance
    );

    @Modifying
    @Transactional
    @Query(value = """
    UPDATE booking_test
    SET 
        advance_amount = advance_amount + :payAmount,
        payment_status = 
            CASE 
                WHEN (advance_amount + :payAmount) >= total_amount THEN 'Paid'
                WHEN (advance_amount + :payAmount) <= 0 THEN 'Pending'
                ELSE 'Partial'
            END
    WHERE booking_id = :bId
    """, nativeQuery = true)
    int updatePayment(@Param("bId") Long bId, @Param("payAmount") Double payAmount);
}