
import {
  GenerateOtpResponse,
  VerifyOtpResponse,
  OtpHistoryItem,
  OtpMetrics,
  HealthStatus,
  DeliveryMethod,
  OtpStatus
} from '../types';

interface StoredOtpRecord {
  id: string;
  destination: string;
  deliveryMethod: DeliveryMethod;
  otpHash: string;
  plainOtp: string;
  otpLength: 4 | 6;
  attempts: number;
  maxAttempts: number;
  status: OtpStatus;
  createdAt: string;
  expiresAt: string;
  verifiedAt: string | null;
  resendAvailableAt: string;
}

const STORAGE_KEY = 'otp_studio_records_v1';

function loadRecords(): StoredOtpRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecords(records: StoredOtpRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage errors.
  }
}

async function backendRequest(
  endpoint: string,
  body: Record<string, string>
) {
  const response = await fetch(`/api/v1/auth/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || `Request failed with status ${response.status}`
    );
  }

  return result;
}

export class ApiService {

  public static async generateOtp(payload: {
    destination: string;
    deliveryMethod: DeliveryMethod;
    length: 4 | 6;
    expirySeconds: number;
  }): Promise<GenerateOtpResponse> {

    const mobileNumber = payload.destination.trim();

    if (!/^\+[1-9][0-9]{7,14}$/.test(mobileNumber)) {
      throw new Error('Enter a valid mobile number with country code.');
    }

    if (payload.deliveryMethod !== 'SMS') {
      throw new Error('Please select SMS delivery.');
    }

    const result = await backendRequest('send-otp', {
      mobileNumber
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60000).toISOString();
    const resendAvailableAt = new Date(now.getTime() + 30000).toISOString();
    const id = 'backend_' + Date.now();

    const record: StoredOtpRecord = {
      id,
      destination: mobileNumber,
      deliveryMethod: 'SMS',
      otpHash: '',
      plainOtp: '',
      otpLength: 6,
      attempts: 0,
      maxAttempts: 5,
      status: 'PENDING',
      createdAt: now.toISOString(),
      expiresAt,
      verifiedAt: null,
      resendAvailableAt
    };

    const records = loadRecords();
    records.unshift(record);
    saveRecords(records);

    return {
      success: true,
      otpId: id,
      destination: mobileNumber,
      deliveryMethod: 'SMS',
      otpLength: 6,
      status: 'PENDING',
      expiresAt,
      resendAvailableAt,
      resendCooldownSeconds: 30,
      message: result.message || 'OTP generated successfully.'
    };
  }

  public static async verifyOtp(payload: {
    otpId: string;
    otp: string;
  }): Promise<VerifyOtpResponse> {

    const { otpId, otp } = payload;
    const records = loadRecords();
    const record = records.find((r) => r.id === otpId);

    if (!record) {
      return {
        success: false,
        message: 'OTP record not found. Generate a new OTP.',
        status: 'FAILED',
        otpId
      };
    }

    if (record.status === 'VERIFIED') {
      return {
        success: false,
        message: 'This OTP has already been verified.',
        status: 'VERIFIED',
        otpId
      };
    }

    if (record.status === 'LOCKED') {
      return {
        success: false,
        message: 'Maximum verification attempts exceeded.',
        status: 'LOCKED',
        otpId,
        attemptsRemaining: 0,
        isLocked: true
      };
    }

    if (Date.now() >= new Date(record.expiresAt).getTime()) {
      record.status = 'EXPIRED';
      saveRecords(records);

      return {
        success: false,
        message: 'OTP has expired.',
        status: 'EXPIRED',
        otpId
      };
    }

    try {
      const result = await backendRequest('verify-otp', {
        mobileNumber: record.destination,
        otp: otp.trim()
      });

      record.status = 'VERIFIED';
      record.verifiedAt = new Date().toISOString();
      saveRecords(records);

      return {
        success: true,
        message: result.message || 'OTP verified successfully.',
        status: 'VERIFIED',
        otpId,
        verifiedAt: record.verifiedAt
      };

    } catch (error) {
      record.attempts += 1;

      const isLocked = record.attempts >= record.maxAttempts;
      record.status = isLocked ? 'LOCKED' : 'PENDING';
      saveRecords(records);

      return {
        success: false,
        message: error instanceof Error
          ? error.message
          : 'Invalid or expired OTP.',
        status: record.status,
        otpId,
        attemptsRemaining: Math.max(
          0,
          record.maxAttempts - record.attempts
        ),
        isLocked
      };
    }
  }

  public static async resendOtp(
    otpId: string
  ): Promise<GenerateOtpResponse> {

    const records = loadRecords();
    const existing = records.find((r) => r.id === otpId);

    if (!existing) {
      throw new Error('Original OTP record not found.');
    }

    const remaining = new Date(existing.resendAvailableAt).getTime() - Date.now();

    if (remaining > 0) {
      throw new Error(
        `Please wait ${Math.ceil(remaining / 1000)} seconds before resending.`
      );
    }

    existing.status = 'RESENT';
    saveRecords(records);

    return this.generateOtp({
      destination: existing.destination,
      deliveryMethod: 'SMS',
      length: 6,
      expirySeconds: 60
    });
  }

  public static async getHistory(params?: {
    search?: string;
    status?: OtpStatus;
    deliveryMethod?: DeliveryMethod;
    limit?: number;
    offset?: number;
  }): Promise<{ data: OtpHistoryItem[]; total: number }> {

    let records = loadRecords();

    records.forEach((r) => {
      if (
        r.status === 'PENDING' &&
        Date.now() >= new Date(r.expiresAt).getTime()
      ) {
        r.status = 'EXPIRED';
      }
    });

    saveRecords(records);

    if (params?.search) {
      const q = params.search.toLowerCase();
      records = records.filter(
        (r) =>
          r.destination.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
      );
    }

    if (params?.status) {
      records = records.filter((r) => r.status === params.status);
    }

    if (params?.deliveryMethod) {
      records = records.filter(
        (r) => r.deliveryMethod === params.deliveryMethod
      );
    }

    const total = records.length;
    const offset = params?.offset || 0;
    const limit = params?.limit || 50;

    const data: OtpHistoryItem[] = records
      .slice(offset, offset + limit)
      .map((r) => ({
        id: r.id,
        destination: r.destination,
        deliveryMethod: r.deliveryMethod,
        otpLength: r.otpLength,
        attempts: r.attempts,
        maxAttempts: r.maxAttempts,
        status: r.status,
        createdAt: r.createdAt,
        expiresAt: r.expiresAt,
        verifiedAt: r.verifiedAt,
        resendAvailableAt: r.resendAvailableAt
      }));

    return { data, total };
  }

  public static async getStats(): Promise<OtpMetrics> {
    const records = loadRecords();
    const now = Date.now();

    let verified = 0;
    let failedAttempts = 0;
    let expired = 0;
    let locked = 0;
    let pending = 0;

    for (const r of records) {
      if (
        r.status === 'PENDING' &&
        now >= new Date(r.expiresAt).getTime()
      ) {
        r.status = 'EXPIRED';
      }

      failedAttempts += r.attempts;

      if (r.status === 'VERIFIED') verified++;
      else if (r.status === 'EXPIRED') expired++;
      else if (r.status === 'LOCKED') locked++;
      else if (r.status === 'PENDING') pending++;
    }

    saveRecords(records);

    return {
      totalGenerated: records.length,
      verified,
      failedAttempts,
      expired,
      locked,
      pending
    };
  }

  public static async simulateExpire(
    otpId: string
  ): Promise<{ success: boolean; message: string }> {

    const records = loadRecords();
    const record = records.find((r) => r.id === otpId);

    if (!record) {
      return { success: false, message: 'OTP not found' };
    }

    record.expiresAt = new Date(Date.now() - 5000).toISOString();
    record.status = 'EXPIRED';
    saveRecords(records);

    return {
      success: true,
      message: 'Local OTP history expired for testing.'
    };
  }

  public static async getHealth(): Promise<HealthStatus> {
    return {
      status: 'ok',
      service: 'otp-frontend-studio',
      database: 'in-memory',
      uptimeSeconds: 0,
      environment: 'frontend-backend-connected'
    };
  }
}
