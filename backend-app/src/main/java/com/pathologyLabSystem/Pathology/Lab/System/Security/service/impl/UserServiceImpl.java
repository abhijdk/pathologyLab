package com.pathologyLabSystem.Pathology.Lab.System.Security.service.impl;


import com.pathologyLabSystem.Pathology.Lab.System.Security.dto.UserDto;
import com.pathologyLabSystem.Pathology.Lab.System.Security.entity.User;
import com.pathologyLabSystem.Pathology.Lab.System.Security.entity.Role;
import com.pathologyLabSystem.Pathology.Lab.System.Security.exception.EmailAlreadyExistsException;
import com.pathologyLabSystem.Pathology.Lab.System.Security.exception.ResourceNotFoundException;
import com.pathologyLabSystem.Pathology.Lab.System.Security.repo.RoleRepository;
import com.pathologyLabSystem.Pathology.Lab.System.Security.repo.UserRepository;
import com.pathologyLabSystem.Pathology.Lab.System.Security.service.UserService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository; // INJECTED ROLE REPOSITORY
    private final ModelMapper modelMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDto createUser(UserDto userDto) {

        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new EmailAlreadyExistsException(
                    "Email already exists: " + userDto.getEmail());
        }

        User user = modelMapper.map(userDto, User.class);

        // ENCODE PASSWORD
        user.setPassword(passwordEncoder.encode(userDto.getPassword()));

        Set<Role> managedRoles = new HashSet<>();

        for (Role transientRole : user.getRoles()) {

            Role existingRole = roleRepository.findByName(transientRole.getName());

            if (existingRole == null) {
                throw new ResourceNotFoundException(
                        "Role not found: " + transientRole.getName());
            }

            managedRoles.add(existingRole);
        }

        user.setRoles(managedRoles);

        User savedUser = userRepository.save(user);

        return modelMapper.map(savedUser, UserDto.class);
    }

    @Override
    public UserDto updateUser(UUID id, UserDto userDto) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (!existingUser.getEmail().equals(userDto.getEmail()) && userRepository.existsByEmail(userDto.getEmail())) {
            throw new EmailAlreadyExistsException("Email already exists: " + userDto.getEmail());
        }

        existingUser.setName(userDto.getName());
        existingUser.setEmail(userDto.getEmail());
        existingUser.setPassword(
                passwordEncoder.encode(userDto.getPassword())
        );
        existingUser.setEnable(userDto.getEnable());

        // --- APPLY THE SAME FIX TO UPDATE ---
        if (userDto.getRoles() != null) {
            User mappedUser = modelMapper.map(userDto, User.class);
            Set<Role> managedRoles = new HashSet<>();
            for (Role transientRole : mappedUser.getRoles()) {
                Role existingRole = roleRepository.findByName(transientRole.getName());
                if (existingRole == null) {
                    throw new ResourceNotFoundException("Role not found: " + transientRole.getName());
                }
                managedRoles.add(existingRole);
            }
            existingUser.setRoles(managedRoles);
        }
        // ------------------------------------

        User updatedUser = userRepository.save(existingUser);
        return modelMapper.map(updatedUser, UserDto.class);
    }

    @Override
    public UserDto findUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return modelMapper.map(user, UserDto.class);
    }

    @Override
    public UserDto findUserByUserId(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return modelMapper.map(user, UserDto.class);
    }

    @Override
    public List<UserDto> findAll() {
        return userRepository.findAll().stream()
                .map(user -> modelMapper.map(user, UserDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public void deleteUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        userRepository.delete(user);
    }
}