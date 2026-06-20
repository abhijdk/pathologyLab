package com.pathologyLabSystem.Pathology.Lab.System.Security.service;

import com.pathologyLabSystem.Pathology.Lab.System.Security.dto.LoginRequest;
import com.pathologyLabSystem.Pathology.Lab.System.Security.dto.TokenResponse;
import com.pathologyLabSystem.Pathology.Lab.System.Security.dto.UserDto;

import java.util.List;
import java.util.UUID;

public interface Authservice {

    UserDto registerUser(UserDto userDto);

    // Add this missing method signature so the controller can see it
    TokenResponse login(LoginRequest loginRequest);

    List<UserDto> getAllUsers();
    UserDto getUserByEmail(String email);
    UserDto updateUserByEmail(String email, UserDto userDto);
    void deleteUserByEmail(String email);
}