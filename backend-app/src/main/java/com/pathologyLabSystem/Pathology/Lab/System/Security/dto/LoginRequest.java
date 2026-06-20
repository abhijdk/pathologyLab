package com.pathologyLabSystem.Pathology.Lab.System.Security.dto; // Adjust to your actual package



public record LoginRequest(

        String email,

        String password
) {}