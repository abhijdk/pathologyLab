package com.pathologyLabSystem.Pathology.Lab.System.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "test_master")
@Getter
@Setter
public class TestMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long testId;

    private String testName;
    private String description;
    private Integer isActive;
    private Integer displayOrder;

    @OneToMany(mappedBy = "testMaster", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TestCategory> categories;
}