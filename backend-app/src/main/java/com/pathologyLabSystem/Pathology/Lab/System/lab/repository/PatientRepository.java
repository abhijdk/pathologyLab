package com.pathologyLabSystem.Pathology.Lab.System.lab.repository;

import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Long> {
}