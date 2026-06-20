package com.pathologyLabSystem.Pathology.Lab.System.lab.service;

import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.TestCategory;
import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.TestMaster;
import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.TestParameter;
import com.pathologyLabSystem.Pathology.Lab.System.lab.repository.TestCategoryRepository;
import com.pathologyLabSystem.Pathology.Lab.System.lab.repository.TestMasterRepository;
import com.pathologyLabSystem.Pathology.Lab.System.lab.repository.TestParameterRepository;
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
    // CATEGORY
    // =========================
    public List<TestCategory> getCategories(Long testId) {
        return categoryRepo.findByTestMaster_TestId(testId);
    }

    public TestCategory saveCategory(TestCategory category) {

        Long testId = category.getTestMaster().getTestId();

        TestMaster testMaster = testMasterRepo.findById(testId)
                .orElseThrow(() -> new RuntimeException("TestMaster not found: " + testId));

        category.setTestMaster(testMaster);

        return categoryRepo.save(category);
    }

    public TestCategory updateCategory(Long id, TestCategory updated) {

        TestCategory existing = categoryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found: " + id));

        existing.setCategoryName(updated.getCategoryName());
        existing.setAmount(updated.getAmount());
        existing.setDisplayOrder(updated.getDisplayOrder());
        existing.setIsActive(updated.getIsActive());

        return categoryRepo.save(existing);
    }

    // =========================
    // PARAMETER
    // =========================
    public List<TestParameter> getParameters(Long categoryId) {
        return parameterRepo.findByTestCategory_CategoryId(categoryId);
    }

    public TestParameter saveParameter(TestParameter param) {

        Long categoryId = param.getTestCategory().getCategoryId();

        TestCategory category = categoryRepo.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found: " + categoryId));

        param.setTestCategory(category);

        return parameterRepo.save(param);
    }

    public TestParameter updateParameter(Long id, TestParameter updated) {

        TestParameter existing = parameterRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Parameter not found: " + id));

        existing.setParamName(updated.getParamName());
        existing.setUnit(updated.getUnit());
        existing.setDisplayOrder(updated.getDisplayOrder());
        existing.setIsActive(updated.getIsActive());

        return parameterRepo.save(existing);
    }
    // =========================
    // CATEGORY DELETE (auto parameters delete due to cascade)
    // =========================
    public void deleteCategory(Long id) {
        TestCategory category = categoryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        categoryRepo.delete(category);
    }

    // =========================
    // PARAMETER DELETE
    // =========================
    public void deleteParameter(Long id) {
        TestParameter param = parameterRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Parameter not found"));

        parameterRepo.delete(param);
    }
}