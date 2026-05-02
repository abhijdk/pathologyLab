package com.pathologyLabSystem.Pathology.Lab.System.repository;

import com.pathologyLabSystem.Pathology.Lab.System.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Long> {
}