package com.pathologyLabSystem.Pathology.Lab.System.NonSecurity.dto;


import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class PublicTestGroupDTO {
    private String masterName;
    private String categoryName;
    private List<PublicTestResultDTO> results = new ArrayList<>();
}