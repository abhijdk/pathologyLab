package com.pathologyLabSystem.Pathology.Lab.System.controller;

import com.pathologyLabSystem.Pathology.Lab.System.entity.Patient;
import com.pathologyLabSystem.Pathology.Lab.System.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/patients")
@CrossOrigin
public class PatientController {

    @Autowired
    private PatientService service;

    @GetMapping
    public List<Patient> getAll() {
        return service.getAll();
    }

    @PostMapping
    public Patient add(@RequestBody Patient p) {
        return service.save(p);
    }

    @PutMapping("/{id}")
    public Patient update(@PathVariable Long id, @RequestBody Patient p) {
        p.setPatientId(id);
        return service.save(p);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}