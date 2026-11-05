
package com.hexgen.otpauth.player.service;

import com.hexgen.otpauth.player.entity.Player;
import com.hexgen.otpauth.player.repository.PlayerRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlayerService {

    private final PlayerRepository playerRepository;

    public PlayerService(PlayerRepository playerRepository) {
        this.playerRepository = playerRepository;
    }

    // Player Registration
    public Player createPlayer(Player player) {

        if (playerRepository.existsByEmail(player.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        if (playerRepository.existsByMobileNumber(player.getMobileNumber())) {
            throw new RuntimeException("Mobile number already registered");
        }

        return playerRepository.save(player);
    }

    // Get All Players
    public List<Player> getAllPlayers() {
        return playerRepository.findAll();
    }

    // Get Player By ID
    public Player getPlayerById(Long id) {
        return playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found"));
    }

    // Update Player
    public Player updatePlayer(Long id, Player player) {

        Player existing = getPlayerById(id);

        if (!existing.getEmail().equals(player.getEmail())
                && playerRepository.existsByEmail(player.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        if (!existing.getMobileNumber().equals(player.getMobileNumber())
                && playerRepository.existsByMobileNumber(player.getMobileNumber())) {
            throw new RuntimeException("Mobile number already registered");
        }

        existing.setPlayerName(player.getPlayerName());
        existing.setEmail(player.getEmail());
        existing.setMobileNumber(player.getMobileNumber());
        existing.setAge(player.getAge());
        existing.setGender(player.getGender());
        existing.setProfileImage(player.getProfileImage());
        existing.setAddress(player.getAddress());

        return playerRepository.save(existing);
    }

    // Delete Player
    public void deletePlayer(Long id) {
        Player player = getPlayerById(id);
        playerRepository.delete(player);
    }
}
