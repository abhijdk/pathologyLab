package com.pathologyLabSystem.Pathology.Lab.System.Security.controller;


import com.pathologyLabSystem.Pathology.Lab.System.Security.dto.LoginRequest;
import com.pathologyLabSystem.Pathology.Lab.System.Security.dto.TokenResponse;
import com.pathologyLabSystem.Pathology.Lab.System.Security.dto.UserDto;
import com.pathologyLabSystem.Pathology.Lab.System.Security.service.Authservice;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor // Recommended over @AllArgsConstructor for Spring dependency injection
public class AuthController {

    private final Authservice authservice;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login( @RequestBody LoginRequest loginRequest) {
        // 1. Verify the credentials against the database
        authenticate(loginRequest);

        // 2. If authentication passes, ask the service to generate the JWT tokens
        TokenResponse tokenResponse = authservice.login(loginRequest);

        // 3. Return the tokens to the client
        return ResponseEntity.ok(tokenResponse);
    }

    private void authenticate(LoginRequest loginRequest) {
        try {
            // This triggers Spring Security's UserDetailsService to load the user
            // and securely compare the hashed passwords.
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.email(),
                            loginRequest.password() 
                    )
            );
        } catch (BadCredentialsException e) {
            // Throw a custom exception here so you can return a clean 401 Unauthorized response
            throw new RuntimeException("Invalid email or password!");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto> registerUser( @RequestBody UserDto userDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authservice.registerUser(userDto));
    }



    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(authservice.getAllUsers());
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<UserDto> getUserByEmail(@PathVariable String email) {
        return ResponseEntity.ok(authservice.getUserByEmail(email));
    }


    @PutMapping("/email/{email}")
    public ResponseEntity<UserDto> updateUserByEmail(
            @PathVariable String email,
            @RequestBody UserDto userDto) {

        UserDto updatedUser = authservice.updateUserByEmail(email, userDto);
        return ResponseEntity.ok(updatedUser);
    }


    @DeleteMapping("/email/{email}")
    public ResponseEntity<String> deleteUserByEmail(@PathVariable String email) {

        authservice.deleteUserByEmail(email);

        return ResponseEntity.ok("User deleted successfully");
    }



}