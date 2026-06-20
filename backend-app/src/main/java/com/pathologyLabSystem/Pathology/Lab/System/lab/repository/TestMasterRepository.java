package com.pathologyLabSystem.Pathology.Lab.System.lab.repository;

import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.TestMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TestMasterRepository extends JpaRepository<TestMaster, Long> {
}
