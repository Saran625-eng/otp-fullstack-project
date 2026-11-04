
package com.hexgen.otpauth.controller;

import com.hexgen.otpauth.dto.SendOtpRequest;
import com.hexgen.otpauth.dto.VerifyOtpRequest;
import com.hexgen.otpauth.service.OtpService;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Value("${otp.api.key}")
    private String configuredApiKey;

    private final OtpService otpService;

    public AuthController(OtpService otpService) {
        this.otpService = otpService;
    }

    private boolean isValidApiKey(String apiKey) {
        return apiKey != null && MessageDigest.isEqual(
                configuredApiKey.getBytes(StandardCharsets.UTF_8),
                apiKey.getBytes(StandardCharsets.UTF_8)
        );
    }

    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, String>> sendOtp(
            @RequestHeader(value = "X-API-Key", required = false) String apiKey,
            @Valid @RequestBody SendOtpRequest request) {

        if (!isValidApiKey(apiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid or missing API key"));
        }

        otpService.generateOtp(request.getMobileNumber());

        return ResponseEntity.ok(
                Map.of("message", "OTP generated successfully")
        );
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(
            @RequestHeader(value = "X-API-Key", required = false) String apiKey,
            @Valid @RequestBody VerifyOtpRequest request) {

        if (!isValidApiKey(apiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid or missing API key"));
        }

        boolean isValid = otpService.verifyOtp(
                request.getMobileNumber(),
                request.getOtp()
        );

        if (isValid) {
            return ResponseEntity.ok(
                    Map.of("message", "OTP verified successfully")
            );
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", "Invalid or expired OTP"));
    }
}
