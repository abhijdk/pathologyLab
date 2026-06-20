package com.pathologyLabSystem.Pathology.Lab.System.NonSecurity.dto;


import lombok.Data;

@Data
public class PublicTestResultDTO {
    private String parameter;
    private String value;
    private String unit;
    private String range;
}
