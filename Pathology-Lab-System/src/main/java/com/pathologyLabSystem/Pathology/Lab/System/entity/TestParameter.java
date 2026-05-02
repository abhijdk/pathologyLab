package com.pathologyLabSystem.Pathology.Lab.System.entity;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;


@Entity
@Table(name = "test_parameter")
@Getter
@Setter
public class TestParameter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long paramId;

    private String paramName;
    private String unit;

    private String refMaleMin;
    private String refMaleMax;
    private String refFemaleMin;
    private String refFemaleMax;

    private Integer displayOrder;
    private Boolean isActive;

    @ManyToOne
    @JoinColumn(name = "category_id")
    @JsonBackReference
    private TestCategory testCategory;
}