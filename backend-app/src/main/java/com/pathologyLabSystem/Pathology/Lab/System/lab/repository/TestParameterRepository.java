package com.pathologyLabSystem.Pathology.Lab.System.lab.repository;

import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.TestParameter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestParameterRepository extends JpaRepository<TestParameter, Long> {

    List<TestParameter> findByTestCategory_CategoryId(Long categoryId);
}
