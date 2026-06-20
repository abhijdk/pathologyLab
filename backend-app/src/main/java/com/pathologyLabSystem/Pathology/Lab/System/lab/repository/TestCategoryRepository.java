package com.pathologyLabSystem.Pathology.Lab.System.lab.repository;

import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.TestCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestCategoryRepository extends JpaRepository<TestCategory, Long> {

    List<TestCategory> findByTestMaster_TestId(Long testId);
}
