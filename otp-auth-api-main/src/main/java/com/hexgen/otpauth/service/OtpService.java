
package com.hexgen.otpauth.service;

import org.springframework.stereotype.Service;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private final SecureRandom random = new SecureRandom();

    private final ConcurrentHashMap<String, String> otpStorage =
            new ConcurrentHashMap<>();

    private final ConcurrentHashMap<String, LocalDateTime> otpExpiry =
            new ConcurrentHashMap<>();

    public String generateOtp(String mobileNumber) {

        int number = 100000 + random.nextInt(900000);

        String otp = String.valueOf(number);

        // Temporary debugging only
        System.out.println("Generated OTP: " + otp);

        otpStorage.put(mobileNumber, otp);

        otpExpiry.put(
                mobileNumber,
                LocalDateTime.now().plusSeconds(60)
        );

        return otp;
    }

    public boolean verifyOtp(String mobileNumber, String otp) {

        String storedOtp = otpStorage.get(mobileNumber);
        LocalDateTime expiryTime = otpExpiry.get(mobileNumber);

        if (storedOtp == null || expiryTime == null) {
            return false;
        }

        if (!LocalDateTime.now().isBefore(expiryTime)) {
            otpStorage.remove(mobileNumber);
            otpExpiry.remove(mobileNumber);
            return false;
        }

        if (storedOtp.equals(otp)) {
            otpStorage.remove(mobileNumber);
            otpExpiry.remove(mobileNumber);
            return true;
        }

        return false;
    }
}
