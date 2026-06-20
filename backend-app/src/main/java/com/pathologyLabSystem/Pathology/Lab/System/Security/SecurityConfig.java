package com.pathologyLabSystem.Pathology.Lab.System.Security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pathologyLabSystem.Pathology.Lab.System.Security.jwt.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {

        http
                // 1. Disable CSRF and enable CORS
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())

                // 2. Set Session Management to Stateless (for JWTs)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // 3. Configure Route Authorizations
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/auth/login").permitAll() // Anyone can try to log in

                        // ADD THIS LINE: Allow public access to patient reports
                        .requestMatchers("/api/patientReports/**").permitAll()

                        .requestMatchers("/api/v1/auth/register").hasAuthority("ADMIN") // ONLY Admins can register
                        .anyRequest().authenticated()
                )

                // 4. Configure Exception Handling (AuthenticationEntryPoint)
                .exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, authException) -> {

                    // Set headers
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
                    response.setContentType("application/json");

                    // Build the error map
                    String message = "Unauthorized access: " + authException.getMessage();
                    Map<String, String> errorMap = Map.of(
                            "message", message,
                            "status", String.valueOf(HttpServletResponse.SC_UNAUTHORIZED)
                    );

                    // Convert Map to JSON using Jackson and write to response
                    ObjectMapper mapper = new ObjectMapper();
                    response.getWriter().write(mapper.writeValueAsString(errorMap));
                }))

                // 5. Add your JWT filter BEFORE Spring's standard authentication filter
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Expose the AuthenticationManager as a Bean.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Expose the PasswordEncoder as a Bean.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 1. Allow your React app's URL (Update the port if your React app uses 3000 instead of 5173)
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000"));

        // 2. Allow all standard HTTP methods
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // 3. Allow these headers (Crucial for your Bearer token and JSON body)
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));

        // 4. Allow credentials (optional but good practice)
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Apply this configuration to all backend routes
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}