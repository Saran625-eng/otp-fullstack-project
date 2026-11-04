export type OtpStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXPIRED' | 'LOCKED' | 'RESENT';
export type DeliveryMethod = 'SMS' | 'EMAIL' | 'TESTING';

export interface GenerateOtpResponse {
  success: boolean;
  otpId: string;
  destination: string;
  deliveryMethod: DeliveryMethod;
  otpLength: 4 | 6;
  status: OtpStatus;
  expiresAt: string;
  resendAvailableAt: string;
  resendCooldownSeconds: number;
  testOtp?: string;
  message: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  status: OtpStatus;
  otpId: string;
  attemptsRemaining?: number;
  isLocked?: boolean;
  verifiedAt?: string;
}

export interface OtpHistoryItem {
  id: string;
  destination: string;
  deliveryMethod: DeliveryMethod;
  otpLength: number;
  attempts: number;
  maxAttempts: number;
  status: OtpStatus;
  createdAt: string;
  expiresAt: string;
  verifiedAt: string | null;
  resendAvailableAt: string;
}

export interface OtpMetrics {
  totalGenerated: number;
  verified: number;
  failedAttempts: number;
  expired: number;
  locked: number;
  pending: number;
}

export interface HealthStatus {
  status: string;
  service: string;
  database: 'postgresql' | 'in-memory';
  uptimeSeconds: number;
  environment: string;
}
