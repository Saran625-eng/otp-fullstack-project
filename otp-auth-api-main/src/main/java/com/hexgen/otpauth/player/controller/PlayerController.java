
package com.hexgen.otpauth.player.controller;

import com.hexgen.otpauth.player.entity.Player;
import com.hexgen.otpauth.player.service.PlayerService;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/players")
@CrossOrigin(origins = "*")
public class PlayerController {

    @Value("${otp.api.key}")
    private String configuredApiKey;

    private final PlayerService playerService;

    public PlayerController(PlayerService playerService) {
        this.playerService = playerService;
    }

    private boolean isValidApiKey(String apiKey) {
        return apiKey != null && MessageDigest.isEqual(
                configuredApiKey.getBytes(StandardCharsets.UTF_8),
                apiKey.getBytes(StandardCharsets.UTF_8)
        );
    }

    // Player Registration
    @PostMapping
    public ResponseEntity<?> createPlayer(
            @RequestHeader(value = "X-API-Key", required = false) String apiKey,
            @Valid @RequestBody Player player) {

        if (!isValidApiKey(apiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid or missing API key"));
        }

        return ResponseEntity.ok(playerService.createPlayer(player));
    }

    // Get All Players
    @GetMapping
    public ResponseEntity<?> getAllPlayers(
            @RequestHeader(value = "X-API-Key", required = false) String apiKey) {

        if (!isValidApiKey(apiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid or missing API key"));
        }

        return ResponseEntity.ok(playerService.getAllPlayers());
    }

    // Get Player By ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getPlayerById(
            @RequestHeader(value = "X-API-Key", required = false) String apiKey,
            @PathVariable Long id) {

        if (!isValidApiKey(apiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid or missing API key"));
        }

        return ResponseEntity.ok(playerService.getPlayerById(id));
    }

    // Update Player
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePlayer(
            @RequestHeader(value = "X-API-Key", required = false) String apiKey,
            @PathVariable Long id,
            @Valid @RequestBody Player player) {

        if (!isValidApiKey(apiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid or missing API key"));
        }

        return ResponseEntity.ok(playerService.updatePlayer(id, player));
    }

    // Delete Player
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePlayer(
            @RequestHeader(value = "X-API-Key", required = false) String apiKey,
            @PathVariable Long id) {

        if (!isValidApiKey(apiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid or missing API key"));
        }

        playerService.deletePlayer(id);

        return ResponseEntity.ok(
                Map.of("message", "Player deleted successfully")
        );
    }
}
