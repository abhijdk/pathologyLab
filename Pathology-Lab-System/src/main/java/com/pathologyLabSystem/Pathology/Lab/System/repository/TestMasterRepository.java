package com.pathologyLabSystem.Pathology.Lab.System.repository;

import com.pathologyLabSystem.Pathology.Lab.System.entity.TestMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TestMasterRepository extends JpaRepository<TestMaster, Long> {
}
