package com.pathologyLabSystem.Pathology.Lab.System.Security.exception;

import java.time.LocalDateTime;

public record ApiError(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path
) {}