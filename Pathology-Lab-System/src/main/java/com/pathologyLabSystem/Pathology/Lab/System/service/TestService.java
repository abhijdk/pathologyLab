package com.pathologyLabSystem.Pathology.Lab.System.service;

import com.pathologyLabSystem.Pathology.Lab.System.entity.TestCategory;
import com.pathologyLabSystem.Pathology.Lab.System.entity.TestMaster;
import com.pathologyLabSystem.Pathology.Lab.System.entity.TestParameter;
import com.pathologyLabSystem.Pathology.Lab.System.repository.TestCategoryRepository;
import com.pathologyLabSystem.Pathology.Lab.System.repository.TestMasterRepository;
import com.pathologyLabSystem.Pathology.Lab.System.repository.TestParameterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TestService {

    @Autowired
    private TestMasterRepository testMasterRepo;

    @Autowired
    private TestCategoryRepository categoryRepo;

    @Autowired
    private TestParameterRepository parameterRepo;

    // =========================
    // TEST MASTER
    // =========================
    public List<TestMaster> getAllTests() {
        return testMasterRepo.findAll();
    }

    public TestMaster saveTest(TestMaster test) {
        return testMasterRepo.save(test);
    }

    // =========================
    // CATEGORY (FIXED)
    // =========================
    public List<TestCategory> getCategories(Long testId) {
        return categoryRepo.findByTestMaster_TestId(testId);
    }

    public TestCategory saveCategory(TestCategory category) {

        Long testId = category.getTestMaster().getTestId();

        TestMaster testMaster = testMasterRepo.findById(testId)
                .orElseThrow(() -> new RuntimeException("TestMaster not found with id: " + testId));

        category.setTestMaster(testMaster);

        return categoryRepo.save(category);
    }

    // =========================
    // PARAMETER (FIXED)
    // =========================
    public List<TestParameter> getParameters(Long categoryId) {
        return parameterRepo.findByTestCategory_CategoryId(categoryId);
    }

    public TestParameter saveParameter(TestParameter param) {

        Long categoryId = param.getTestCategory().getCategoryId();

        TestCategory category = categoryRepo.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));

        param.setTestCategory(category);

        return parameterRepo.save(param);
    }
}