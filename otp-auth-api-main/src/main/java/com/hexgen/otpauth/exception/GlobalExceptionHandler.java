
package com.hexgen.otpauth.exception;

import jakarta.validation.ConstraintViolationException;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Validation errors - HTTP 400
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationErrors(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        error -> error.getField(),
                        error -> error.getDefaultMessage(),
                        (first, second) -> first
                ));

        return ResponseEntity.badRequest().body(
                Map.of(
                        "status", 400,
                        "message", "Validation failed",
                        "errors", errors
                )
        );
    }

    // Duplicate email/mobile - HTTP 409
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDuplicateData(
            DataIntegrityViolationException ex) {

        return ResponseEntity.status(HttpStatus.CONFLICT).body(
                Map.of(
                        "status", 409,
                        "message", "Email or mobile number already exists"
                )
        );
    }

    // Other runtime errors - HTTP 404
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeErrors(RuntimeException ex) {

        String message = ex.getMessage();

        if (message != null &&
                (message.contains("already registered")
                || message.contains("already exists"))) {

            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                    Map.of(
                            "status", 409,
                            "message", message
                    )
            );
        }

        if ("Player not found".equals(message)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    Map.of(
                            "status", 404,
                            "message", message
                    )
            );
        }

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of(
                        "status", 500,
                        "message", "An unexpected error occurred"
                )
        );
    }

    // Invalid JSON - HTTP 400
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> handleInvalidJson(
            HttpMessageNotReadableException ex) {

        return ResponseEntity.badRequest().body(
                Map.of(
                        "status", 400,
                        "message", "Invalid request body"
                )
        );
    }
}
