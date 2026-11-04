import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Lock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Mail,
  Zap
} from 'lucide-react';
import { OtpInput } from '../components/OtpInput';
import { ApiService } from '../services/api';
import { VerifyOtpResponse, OtpStatus } from '../types';

interface VerifyOtpProps {
  initialState?: {
    otpId?: string;
    destination?: string;
    otpLength?: 4 | 6;
    expiresAt?: string;
    resendAvailableAt?: string;
    testOtp?: string;
  };
  onNavigate: (tab: string, state?: any) => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const VerifyOtp: React.FC<VerifyOtpProps> = ({
  initialState,
  onNavigate,
  onNotify
}) => {
  const [otpId, setOtpId] = useState(initialState?.otpId || '');
  const [destination, setDestination] = useState(initialState?.destination || '');
  const [otpLength, setOtpLength] = useState<4 | 6>(initialState?.otpLength || 6);
  const [expiresAt, setExpiresAt] = useState<string | null>(initialState?.expiresAt || null);
  const [resendAvailableAt, setResendAvailableAt] = useState<string | null>(initialState?.resendAvailableAt || null);
  const [testOtp, setTestOtp] = useState<string | undefined>(initialState?.testOtp);

  const [otpValue, setOtpValue] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerifyOtpResponse | null>(null);

  // Countdown timers
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState<number>(0);

  // Sync state if initial state changes
  useEffect(() => {
    if (initialState?.otpId) {
      setOtpId(initialState.otpId);
      setDestination(initialState.destination || '');
      setOtpLength(initialState.otpLength || 6);
      setExpiresAt(initialState.expiresAt || null);
      setResendAvailableAt(initialState.resendAvailableAt || null);
      setTestOtp(initialState.testOtp);
      setOtpValue('');
      setVerificationResult(null);
    }
  }, [initialState]);

  // Expiration countdown
  useEffect(() => {
    if (!expiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const exp = new Date(expiresAt).getTime();
      const diff = Math.max(0, Math.floor((exp - now) / 1000));
      setRemainingSeconds(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Resend cooldown timer
  useEffect(() => {
    if (!resendAvailableAt) {
      setResendCooldownSeconds(0);
      return;
    }

    const updateCooldown = () => {
      const now = Date.now();
      const cd = new Date(resendAvailableAt).getTime();
      const diff = Math.max(0, Math.floor((cd - now) / 1000));
      setResendCooldownSeconds(diff);
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [resendAvailableAt]);

  const handleVerify = async (submittedCode?: string) => {
    const code = submittedCode || otpValue;
    if (!otpId.trim()) {
      onNotify('error', 'Please enter or select a valid OTP ID to verify');
      return;
    }

    if (code.length !== otpLength) {
      onNotify('error', `Please enter the complete ${otpLength}-digit code`);
      return;
    }

    try {
      setVerifying(true);
      const res = await ApiService.verifyOtp({
        otpId: otpId.trim(),
        otp: code.trim()
      });

      setVerificationResult(res);

      if (res.success) {
        onNotify('success', 'OTP verified successfully!');
      } else if (res.status === 'LOCKED') {
        onNotify('error', 'OTP has been permanently locked due to 5 failed attempts.');
      } else if (res.status === 'EXPIRED') {
        onNotify('error', 'OTP has expired.');
      } else {
        onNotify('error', res.message || 'Invalid OTP code');
      }
    } catch (err: any) {
      onNotify('error', err.message || 'Verification request failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!otpId.trim()) {
      onNotify('error', 'No active OTP ID to resend');
      return;
    }

    try {
      setResending(true);
      const res = await ApiService.resendOtp(otpId.trim());

      setOtpId(res.otpId);
      setDestination(res.destination);
      setOtpLength(res.otpLength as 4 | 6);
      setExpiresAt(res.expiresAt);
      setResendAvailableAt(res.resendAvailableAt);
      setTestOtp(res.testOtp);
      setOtpValue('');
      setVerificationResult(null);

      onNotify('success', res.message || 'New OTP generated and resent!');
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const handleAutofillTestOtp = () => {
    if (testOtp) {
      setOtpValue(testOtp);
      onNotify('info', `Autofilled test code: ${testOtp}`);
    }
  };

  const isExpired = remainingSeconds === 0 && Boolean(expiresAt);
  const isLocked = verificationResult?.status === 'LOCKED' || verificationResult?.isLocked;
  const isVerified = verificationResult?.success || verificationResult?.status === 'VERIFIED';

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Identity Verification Gate</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Verify One-Time Password
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enter the verification code sent to your mobile device or email address.
        </p>
      </div>

      {/* Main Verification Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-lg space-y-6">
        {/* Destination & OTP ID Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
              {destination.includes('@') ? <Mail className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                Target Recipient
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {destination || 'No target specified (Select from History or Generate)'}
              </p>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2 text-right">
            <Clock className={`w-4 h-4 ${isExpired ? 'text-rose-500' : 'text-emerald-500'}`} />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {isExpired ? 'Status' : 'Expires in'}
              </span>
              <span
                className={`text-sm font-extrabold font-mono ${
                  isExpired
                    ? 'text-rose-500 font-bold'
                    : remainingSeconds < 20
                    ? 'text-amber-500 animate-pulse'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {isExpired ? 'EXPIRED' : formatTimer(remainingSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* If no OTP ID is set, allow manually pasting an OTP ID */}
        {!initialState?.otpId && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              OTP Record ID
            </label>
            <input
              type="text"
              value={otpId}
              onChange={(e) => setOtpId(e.target.value)}
              placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
            />
          </div>
        )}

        {/* Testing Mode Quick Banner if available */}
        {testOtp && !isVerified && (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-300">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500" />
              <span>Testing OTP: <strong className="font-mono text-sm tracking-wider font-extrabold">{testOtp}</strong></span>
            </div>
            <button
              onClick={handleAutofillTestOtp}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
            >
              Autofill
            </button>
          </div>
        )}

        {/* Dynamic Individual OTP Digits Input Boxes (4 or 6) */}
        <div>
          <label className="block text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Enter {otpLength}-Digit Security Code
          </label>
          <OtpInput
            length={otpLength}
            value={otpValue}
            onChange={setOtpValue}
            disabled={isVerified || isLocked || isExpired || verifying}
            isError={Boolean(verificationResult && !verificationResult.success)}
            onComplete={(fullCode) => handleVerify(fullCode)}
          />
        </div>

        {/* Verification Status Result Alerts */}
        {verificationResult && (
          <div
            className={`p-4 rounded-2xl border text-sm flex items-start gap-3 animate-slide-up ${
              verificationResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-950 dark:text-emerald-200'
                : verificationResult.status === 'LOCKED'
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500/40 text-purple-950 dark:text-purple-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500/40 text-rose-950 dark:text-rose-200'
            }`}
          >
            {verificationResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            ) : verificationResult.status === 'LOCKED' ? (
              <Lock className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-bold">
                {verificationResult.success
                  ? 'Verification Successful!'
                  : verificationResult.status === 'LOCKED'
                  ? 'OTP Permanently Locked'
                  : 'Verification Failed'}
              </p>
              <p className="text-xs opacity-90">{verificationResult.message}</p>
              {verificationResult.attemptsRemaining !== undefined && !verificationResult.success && (
                <p className="text-xs font-semibold">
                  Remaining attempts: {verificationResult.attemptsRemaining} of 5
                </p>
              )}
            </div>
          </div>
        )}

        {/* Expired State Alert */}
        {isExpired && !verificationResult?.success && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>This OTP has passed its expiration time. Please use the resend button below.</span>
          </div>
        )}

        {/* Action Buttons: Verify & Resend */}
        <div className="space-y-3 pt-2">
          {!isVerified ? (
            <button
              onClick={() => handleVerify()}
              disabled={verifying || isLocked || isExpired || otpValue.length !== otpLength}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify OTP</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => onNavigate('generate')}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white font-semibold text-sm hover:bg-slate-800 transition-colors"
              >
                Generate Another OTP
              </button>
              <button
                onClick={() => onNavigate('history')}
                className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition-colors"
              >
                View in History
              </button>
            </div>
          )}

          {/* Resend Button with 30s cooldown */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || resendCooldownSeconds > 0 || !otpId}
              className="text-xs font-semibold text-indigo-600 dark:text-emerald-400 hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>
                {resendCooldownSeconds > 0
                  ? `Resend available in ${resendCooldownSeconds}s`
                  : 'Resend OTP Code'}
              </span>
            </button>

            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Check Audit Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
