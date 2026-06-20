package com.pathologyLabSystem.Pathology.Lab.System.Security.service;


import com.pathologyLabSystem.Pathology.Lab.System.Security.dto.UserDto;

import java.util.List;
import java.util.UUID;

public interface UserService {
    UserDto createUser(UserDto userDto);
    UserDto updateUser(UUID id, UserDto userDto);
    UserDto findUserByEmail(String email);
    UserDto findUserByUserId(UUID id);
    List<UserDto> findAll();
    void deleteUser(UUID id);
}
