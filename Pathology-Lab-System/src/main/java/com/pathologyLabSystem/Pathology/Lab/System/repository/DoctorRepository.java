package com.pathologyLabSystem.Pathology.Lab.System.repository;

import com.pathologyLabSystem.Pathology.Lab.System.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DoctorRepository extends JpaRepository<Doctor, Integer> {
    List<Doctor> findByNameContaining(String name);
}