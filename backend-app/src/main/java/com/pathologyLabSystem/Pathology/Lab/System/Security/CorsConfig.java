package com.pathologyLabSystem.Pathology.Lab.System.Security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // Allow credentials (important if you are using JWT cookies or authorization headers)
        config.setAllowCredentials(true);

//        // Explicitly allow your Vercel URL and Localhost for testing
//        config.setAllowedOrigins(List.of(
//                "https://pathology-lab-one.vercel.app",
//                "http://localhost:3000",
//                "http://localhost:5173" // Vite default
//        ));


        // Explicitly allow your new custom domains and local testing ports
        config.setAllowedOrigins(List.of(
                "https://airteltechnology.in",
                "https://www.airteltechnology.in",
                "https://pathology-lab-one.vercel.app", // Good to keep as a backup
                "http://localhost:3000",
                "http://localhost:5173"
        ));

        // Allow all headers and standard API methods
        config.setAllowedHeaders(Arrays.asList("Origin", "Content-Type", "Accept", "Authorization"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "OPTIONS", "DELETE", "PATCH"));

        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}