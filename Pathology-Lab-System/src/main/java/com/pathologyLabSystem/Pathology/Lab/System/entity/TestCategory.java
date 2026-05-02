package com.pathologyLabSystem.Pathology.Lab.System.entity;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;


@Entity
@Table(name = "test_category")
@Getter
@Setter
public class TestCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long categoryId;

    private String categoryName;
    private Integer displayOrder;
    private Boolean isActive;

    @ManyToOne
    @JoinColumn(name = "test_id")
    @JsonBackReference
    private TestMaster testMaster;

    @OneToMany(mappedBy = "testCategory", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<TestParameter> parameters;
}