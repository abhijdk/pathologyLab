package com.pathologyLabSystem.Pathology.Lab.System.Security.service.impl;

import com.pathologyLabSystem.Pathology.Lab.System.Security.repo.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Because User implements UserDetails, we can return it directly.
        return userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid Email id: " + username));
    }
}