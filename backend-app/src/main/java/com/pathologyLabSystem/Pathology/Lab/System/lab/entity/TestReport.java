package com.pathologyLabSystem.Pathology.Lab.System.lab.entity;


import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "test_report")
@Data
public class TestReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reportId;

    private Long bookingId;
    private Long categoryId;
    private Long paramId;

    private String resultValue;

    @Column(insertable = false, updatable = false)
    private LocalDateTime capturedAt;
}