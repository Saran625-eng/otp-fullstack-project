
package com.hexgen.otpauth.player.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "players")
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long playerId;

    @NotBlank(message = "Player name is required")
    @Column(nullable = false)
    private String playerName;

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    @Column(nullable = false, unique = true)
    private String email;

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[0-9]{10}$",
             message = "Mobile number must contain exactly 10 digits")
    @Column(nullable = false)
    private String mobileNumber;

    @NotNull(message = "Age is required")
    @Min(value = 1, message = "Age must be at least 1")
    @Max(value = 120, message = "Age cannot exceed 120")
    private Integer age;

    private String gender;
    private String profileImage;

    @Column(length = 1000)
    private String address;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @PrePersist
    protected void onCreate() {
        createdDate = LocalDateTime.now();
    }

    public Player() {
    }

    public Long getPlayerId() {
        return playerId;
    }

    public void setPlayerId(Long playerId) {
        this.playerId = playerId;
    }

    public String getPlayerName() {
        return playerName;
    }

    public void setPlayerName(String playerName) {
        this.playerName = playerName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getProfileImage() {
        return profileImage;
    }

    public void setProfileImage(String profileImage) {
        this.profileImage = profileImage;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }
}
