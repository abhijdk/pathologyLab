package com.pathologyLabSystem.Pathology.Lab.System.Security.dto;


import lombok.Data;
import java.util.Set;
import java.util.UUID;

@Data
public class UserDto {
    private UUID id;
    private String email;
    private String name;
    private String password; // Consider omitting password in responses in a real app
    private Boolean enable;
    private Set<RoleDto> roles;
}

