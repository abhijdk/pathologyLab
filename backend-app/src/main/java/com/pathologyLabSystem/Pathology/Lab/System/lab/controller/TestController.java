package com.pathologyLabSystem.Pathology.Lab.System.lab.controller;

import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.TestCategory;
import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.TestMaster;
import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.TestParameter;
import com.pathologyLabSystem.Pathology.Lab.System.lab.service.TestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tests")
@CrossOrigin
public class TestController {

    @Autowired
    private TestService testService;

    // =========================
    // TEST MASTER
    // =========================
    @GetMapping
    public List<TestMaster> getAllTests() {
        return testService.getAllTests();
    }

    @PostMapping
    public TestMaster addTest(@RequestBody TestMaster test) {
        return testService.saveTest(test);
    }

    // =========================
    // CATEGORY
    // =========================
    @GetMapping("/category/{testId}")
    public List<TestCategory> getCategories(@PathVariable Long testId) {
        return testService.getCategories(testId);
    }

    @PostMapping("/category")
    public TestCategory addCategory(@RequestBody TestCategory category) {
        return testService.saveCategory(category);
    }

    @PutMapping("/category/{id}")
    public TestCategory updateCategory(@PathVariable Long id,
                                       @RequestBody TestCategory category) {
        return testService.updateCategory(id, category);
    }

    // =========================
    // PARAMETER
    // =========================
    @GetMapping("/parameter/{categoryId}")
    public List<TestParameter> getParameters(@PathVariable Long categoryId) {
        return testService.getParameters(categoryId);
    }

    @PostMapping("/parameter")
    public TestParameter addParameter(@RequestBody TestParameter param) {
        return testService.saveParameter(param);
    }

    @PutMapping("/parameter/{id}")
    public TestParameter updateParameter(@PathVariable Long id,
                                         @RequestBody TestParameter param) {
        return testService.updateParameter(id, param);
    }
    // =========================
// DELETE CATEGORY (with parameters auto delete)
// =========================
    @DeleteMapping("/category/{id}")
    public String deleteCategory(@PathVariable Long id) {
        testService.deleteCategory(id);
        return "Category deleted successfully";
    }

    // =========================
// DELETE PARAMETER
// =========================
    @DeleteMapping("/parameter/{id}")
    public String deleteParameter(@PathVariable Long id) {
        testService.deleteParameter(id);
        return "Parameter deleted successfully";
    }
}