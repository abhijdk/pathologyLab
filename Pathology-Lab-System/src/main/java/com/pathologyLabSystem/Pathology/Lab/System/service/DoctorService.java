package com.pathologyLabSystem.Pathology.Lab.System.service;

import com.pathologyLabSystem.Pathology.Lab.System.entity.Doctor;
import com.pathologyLabSystem.Pathology.Lab.System.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;

    // ADD
    public Doctor addDoctor(Doctor doctor) {
        return doctorRepository.save(doctor);
    }

    // GET ALL
    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }

    // ✅ FIXED UPDATE LOGIC (IMPORTANT)
    public Doctor updateDoctor(Integer id, Doctor updated) {

        Doctor d = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        d.setName(updated.getName());
        d.setCommissionPercentage(updated.getCommissionPercentage());

        // 🔥 IMPORTANT: must update these for PAY feature
        d.setTotalCommission(updated.getTotalCommission());
        d.setReceivedCommission(updated.getReceivedCommission());

        return doctorRepository.save(d);
    }

    // DELETE
    public void deleteDoctor(Integer id) {
        doctorRepository.deleteById(id);
    }

    // SEARCH
    public List<Doctor> search(String name) {
        return doctorRepository.findByNameContaining(name);
    }
}