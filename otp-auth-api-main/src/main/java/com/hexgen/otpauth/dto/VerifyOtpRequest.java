package com.hexgen.otpauth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class VerifyOtpRequest {

    @NotBlank(message = "Mobile number is required")
    @Pattern(
        regexp = "^\\+[1-9][0-9]{7,14}$",
        message = "Invalid mobile number"
    )
    private String mobileNumber;

    @NotBlank(message = "OTP is required")
    @Pattern(
        regexp = "^[0-9]{6}$",
        message = "OTP must contain 6 digits"
    )
    private String otp;

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }
}