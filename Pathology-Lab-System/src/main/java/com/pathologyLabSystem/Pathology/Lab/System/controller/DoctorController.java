package com.pathologyLabSystem.Pathology.Lab.System.controller;

import com.pathologyLabSystem.Pathology.Lab.System.entity.Doctor;
import com.pathologyLabSystem.Pathology.Lab.System.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    @PostMapping
    public Doctor add(@RequestBody Doctor doctor) {
        return doctorService.addDoctor(doctor);
    }

    @GetMapping
    public List<Doctor> getAll() {
        return doctorService.getAllDoctors();
    }

    @PutMapping("/{id}")
    public Doctor update(@PathVariable Integer id, @RequestBody Doctor doctor) {
        return doctorService.updateDoctor(id, doctor);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        doctorService.deleteDoctor(id);
    }

    @GetMapping("/search")
    public List<Doctor> search(@RequestParam String name) {
        return doctorService.search(name);
    }
}