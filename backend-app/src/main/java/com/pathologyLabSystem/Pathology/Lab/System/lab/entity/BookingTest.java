package com.pathologyLabSystem.Pathology.Lab.System.lab.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "booking_test")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bookingId;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false)
    private Integer doctorId;

    // JSON array of test/category IDs
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json", nullable = false)
    private List<Long> bookingCategory;

    @Column(nullable = false, updatable = false)
    private LocalDateTime bookingDate;

    @PrePersist
    public void onCreate() {
        this.bookingDate = LocalDateTime.now();
    }

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal advanceAmount = BigDecimal.ZERO;

    // DB generated column
    @Column(name = "remaining_amount", insertable = false, updatable = false)
    private BigDecimal remainingAmount;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.Pending;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ReportStatus reportStatus = ReportStatus.Awaiting;

    public enum PaymentStatus {
        Pending, Partial, Paid, Refunded
    }

    public enum ReportStatus {
        Awaiting, In_Progress, Generated, Delivered
    }
}