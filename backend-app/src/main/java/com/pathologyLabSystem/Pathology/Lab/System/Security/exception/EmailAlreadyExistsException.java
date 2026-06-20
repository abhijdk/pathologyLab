package com.pathologyLabSystem.Pathology.Lab.System.Security.exception;


public class EmailAlreadyExistsException extends RuntimeException {
    public EmailAlreadyExistsException(String message) {
        super(message);
    }
}
