package com.pathologyLabSystem.Pathology.Lab.System.Security.dto;


public record TokenResponse(
        String accessToken,
        String refreshToken,
        long expiresIn,
        String tokenType,
        UserDto user
) {
    /**
     * Static factory method to easily create a Bearer token response.
     */
    public static TokenResponse bearer(String accessToken, String refreshToken, long expiresIn, UserDto user) {
        // Use 'new' to create the instance, and automatically set the type to "Bearer"
        return new TokenResponse(accessToken, refreshToken, expiresIn, "Bearer", user);
    }

    /**
     * Overloaded method in case you want to return the tokens WITHOUT the user object.
     */
    public static TokenResponse bearer(String accessToken, String refreshToken, long expiresIn) {
        return new TokenResponse(accessToken, refreshToken, expiresIn, "Bearer", null);
    }
}