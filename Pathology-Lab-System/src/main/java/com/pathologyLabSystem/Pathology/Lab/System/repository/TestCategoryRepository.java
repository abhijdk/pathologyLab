package com.pathologyLabSystem.Pathology.Lab.System.repository;

import com.pathologyLabSystem.Pathology.Lab.System.entity.TestCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestCategoryRepository extends JpaRepository<TestCategory, Long> {

    List<TestCategory> findByTestMaster_TestId(Long testId);
}
