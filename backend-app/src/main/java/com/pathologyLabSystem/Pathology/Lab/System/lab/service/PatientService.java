package com.pathologyLabSystem.Pathology.Lab.System.lab.service;

import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.Patient;
import com.pathologyLabSystem.Pathology.Lab.System.lab.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PatientService {

    @Autowired
    private PatientRepository repo;

    public List<Patient> getAll() {
        return repo.findAll();
    }

    public Patient save(Patient p) {
        return repo.save(p);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }
    public Patient getPatientById(Long id) {
        return repo.findById(id).orElse(null);
    }
}