package com.pathologyLabSystem.Pathology.Lab.System.lab.repository;




import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.TestReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TestReportRepository extends JpaRepository<TestReport, Long> {
    // Find all results for a specific booking
    List<TestReport> findByBookingId(Long bookingId);

    TestReport findByBookingIdAndParamId(Long bookingId, Long paramId);
}