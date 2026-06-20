package com.pathologyLabSystem.Pathology.Lab.System.Security.service.impl;

import com.pathologyLabSystem.Pathology.Lab.System.Security.dto.LoginRequest;
import com.pathologyLabSystem.Pathology.Lab.System.Security.dto.TokenResponse;
import com.pathologyLabSystem.Pathology.Lab.System.Security.dto.UserDto;
import com.pathologyLabSystem.Pathology.Lab.System.Security.entity.User;
import com.pathologyLabSystem.Pathology.Lab.System.Security.jwt.JwtService;
import com.pathologyLabSystem.Pathology.Lab.System.Security.repo.UserRepository;
import com.pathologyLabSystem.Pathology.Lab.System.Security.service.Authservice;
import com.pathologyLabSystem.Pathology.Lab.System.Security.service.UserService;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class AuthserviceImpl implements Authservice {

    private final UserService userService;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final ModelMapper modelMapper;

    @Override
    public UserDto registerUser(UserDto userDto) {
        // We do NOT encode the password here because your UserServiceImpl already encodes it!
        // Doing it twice breaks login.
        return userService.createUser(userDto);
    }

    // THIS IS THE MISSING METHOD
    @Override
    public TokenResponse login(LoginRequest loginRequest) {
        User user = userRepository.findByEmail(loginRequest.email())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        // Fetch userDto to return in the payload if needed
        UserDto userDto = userService.findUserByEmail(loginRequest.email());

        return TokenResponse.bearer(accessToken, refreshToken, 3600, userDto);
    }

    @Override
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> modelMapper.map(user, UserDto.class)) // Or your preferred mapper
                .toList();
    }

    @Override
    public UserDto getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        return modelMapper.map(user, UserDto.class);
    }


    @Transactional
    public UserDto updateUserByEmail(String currentEmail, UserDto updateDto) {

        User existingUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + currentEmail));

        // Update Email
        String newEmail = updateDto.getEmail();
        if (newEmail != null && !newEmail.isBlank() && !newEmail.equals(currentEmail)) {
            if (userRepository.findByEmail(newEmail).isPresent()) {
                throw new RuntimeException("The email " + newEmail + " is already in use!");
            }
            existingUser.setEmail(newEmail);
        }

        // Update Name
        if (updateDto.getName() != null && !updateDto.getName().isBlank()) {
            existingUser.setName(updateDto.getName());
        }

        // Update Password
        String newPassword = updateDto.getPassword();
        if (newPassword != null && !newPassword.trim().isEmpty()) {
            existingUser.setPassword(passwordEncoder.encode(newPassword));
        }

        // Update Enable Status
        if (updateDto.getEnable() != null) {
            existingUser.setEnable(updateDto.getEnable());
        }

        User savedUser = userRepository.save(existingUser);

        return modelMapper.map(savedUser, UserDto.class);
    }

    @Override
    @Transactional
    public void deleteUserByEmail(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        userRepository.delete(user);
    }




}