package com.pathologyLabSystem.Pathology.Lab.System.controller;

import com.pathologyLabSystem.Pathology.Lab.System.entity.TestCategory;
import com.pathologyLabSystem.Pathology.Lab.System.entity.TestMaster;
import com.pathologyLabSystem.Pathology.Lab.System.entity.TestParameter;
import com.pathologyLabSystem.Pathology.Lab.System.service.TestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tests")
@CrossOrigin
public class TestController {

    @Autowired
    private TestService testService;

    // TEST MASTER
    @GetMapping
    public List<TestMaster> getAllTests() {
        return testService.getAllTests();
    }

//    @PostMapping
//    public TestMaster addTest(@RequestBody TestMaster test) {
//        return testService.saveTest(test);
//    }

    // CATEGORY
    @GetMapping("/category/{testId}")
    public List<TestCategory> getCategories(@PathVariable Long testId) {
        return testService.getCategories(testId);
    }

    @PostMapping("/category")
    public TestCategory addCategory(@RequestBody TestCategory category) {
        return testService.saveCategory(category);
    }

    // PARAMETER
    @GetMapping("/parameter/{categoryId}")
    public List<TestParameter> getParameters(@PathVariable Long categoryId) {
        return testService.getParameters(categoryId);
    }

    @PostMapping("/parameter")
    public TestParameter addParameter(@RequestBody TestParameter param) {
        return testService.saveParameter(param);
    }
}
