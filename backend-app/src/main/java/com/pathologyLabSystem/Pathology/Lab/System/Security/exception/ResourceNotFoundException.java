package com.pathologyLabSystem.Pathology.Lab.System.Security.exception;


public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}