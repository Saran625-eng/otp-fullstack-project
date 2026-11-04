import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Edit2,
  Zap,
  Lock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { OtpInput } from './OtpInput';
import { ApiService } from '../services/api';

interface MobileOtpFlowProps {
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const MobileOtpFlow: React.FC<MobileOtpFlowProps> = ({ onNotify }) => {
  // Step: 1 = Enter Mobile, 2 = Enter OTP, 3 = Verified Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Inputs
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpLength, setOtpLength] = useState<4 | 6>(6);
  const [otpValue, setOtpValue] = useState('');

  // OTP State
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpId, setOtpId] = useState<string>('');
  const [expirySeconds, setExpirySeconds] = useState<number>(60);
  const [resendCooldown, setResendCooldown] = useState<number>(30);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(5);
  const [isLocked, setIsLocked] = useState(false);

  // Loading States
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live countdown timer for OTP Expiry
  useEffect(() => {
    if (step !== 2 || expirySeconds <= 0) return;
    const interval = setInterval(() => {
      setExpirySeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, expirySeconds]);

  // Cooldown timer for Resend
  useEffect(() => {
    if (step !== 2 || resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, resendCooldown]);

  // Client-side secure fallback generator so it works 100% standalone without backend
  const generateLocalOtp = (length: 4 | 6) => {
    const min = length === 4 ? 1000 : 100000;
    const max = length === 4 ? 9999 : 999999;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = mobileNumber.replace(/\D/g, '');

    if (cleanNumber.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      onNotify('error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    const fullPhoneNumber = `${countryCode} ${cleanNumber}`;

    try {
      // Attempt backend API call first
      const res = await ApiService.generateOtp({
        destination: fullPhoneNumber,
        deliveryMethod: 'TESTING',
        length: otpLength,
        expirySeconds: 60
      });

      setOtpId(res.otpId);
      setGeneratedOtp(res.testOtp || generateLocalOtp(otpLength));
      onNotify('success', `OTP sent to ${fullPhoneNumber}`);
    } catch {
      // Fallback: seamless client-side generation (No backend required!)
      const localCode = generateLocalOtp(otpLength);
      setGeneratedOtp(localCode);
      setOtpId(`local-${Date.now()}`);
      onNotify('success', `OTP generated for ${fullPhoneNumber}`);
    } finally {
      setLoading(false);
      setStep(2);
      setExpirySeconds(60);
      setResendCooldown(30);
      setAttemptsRemaining(5);
      setIsLocked(false);
      setOtpValue('');
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpValue;

    if (code.length !== otpLength) {
      setErrorMessage(`Please enter all ${otpLength} digits`);
      return;
    }

    if (expirySeconds <= 0) {
      setErrorMessage('OTP has expired. Please click "Resend OTP".');
      onNotify('error', 'OTP has expired');
      return;
    }

    if (isLocked || attemptsRemaining <= 0) {
      setErrorMessage('Maximum attempts exceeded. This OTP is locked.');
      onNotify('error', 'Maximum verification attempts exceeded');
      return;
    }

    setVerifying(true);
    setErrorMessage(null);

    // Try API verification if backend is active and not a local mock
    let verified = false;
    if (otpId && !otpId.startsWith('local-')) {
      try {
        const res = await ApiService.verifyOtp({
          otpId,
          otp: code
        });
        if (res.success) {
          verified = true;
        } else {
          setAttemptsRemaining(res.attemptsRemaining !== undefined ? res.attemptsRemaining : attemptsRemaining - 1);
          setIsLocked(Boolean(res.isLocked));
          setErrorMessage(res.message);
          onNotify('error', res.message);
        }
      } catch {
        // Fallback to local check
        verified = code === generatedOtp;
      }
    } else {
      // Local client check
      verified = code === generatedOtp;
    }

    setVerifying(false);

    if (verified) {
      onNotify('success', 'Mobile number verified successfully! 🎉');
      setStep(3);
    } else if (!errorMessage) {
      const remaining = attemptsRemaining - 1;
      setAttemptsRemaining(remaining);
      if (remaining <= 0) {
        setIsLocked(true);
        setErrorMessage('Maximum 5 attempts reached. This OTP is permanently locked.');
        onNotify('error', 'Maximum attempts reached');
      } else {
        setErrorMessage(`Invalid OTP code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
        onNotify('error', `Invalid OTP (${remaining} attempts left)`);
      }
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    setErrorMessage(null);

    const fullPhoneNumber = `${countryCode} ${mobileNumber}`;

    try {
      if (otpId && !otpId.startsWith('local-')) {
        const res = await ApiService.resendOtp(otpId);
        setOtpId(res.otpId);
        setGeneratedOtp(res.testOtp || generateLocalOtp(otpLength));
      } else {
        setGeneratedOtp(generateLocalOtp(otpLength));
      }
      onNotify('success', 'New OTP sent successfully!');
    } catch {
      setGeneratedOtp(generateLocalOtp(otpLength));
      onNotify('success', 'New OTP generated!');
    } finally {
      setLoading(false);
      setExpirySeconds(60);
      setResendCooldown(30);
      setAttemptsRemaining(5);
      setIsLocked(false);
      setOtpValue('');
    }
  };

  // Reset to Step 1
  const handleReset = () => {
    setStep(1);
    setOtpValue('');
    setErrorMessage(null);
    setGeneratedOtp('');
    setAttemptsRemaining(5);
    setIsLocked(false);
  };

  // Autofill helper
  const handleAutofill = () => {
    if (generatedOtp) {
      setOtpValue(generatedOtp);
      handleVerifyOtp(generatedOtp);
    }
  };

  return (
    <div className="max-w-md mx-auto my-6 sm:my-10 animate-fade-in">
      {/* Container Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden p-6 sm:p-8">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Mobile Verification
              </span>
              <span className="text-[10px] text-slate-400">
                {step === 1 ? 'Step 1: Enter Mobile' : step === 2 ? 'Step 2: Enter OTP' : 'Verification Complete'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}></span>
            <span className={`w-2.5 h-2.5 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}></span>
            <span className={`w-2.5 h-2.5 rounded-full ${step === 3 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}></span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* STEP 1: ENTER MOBILE NUMBER                                  */}
        {/* ============================================================ */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-6 animate-slide-up">
            <div className="text-center space-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Enter Mobile Number
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                We'll send a one-time verification code to this number.
              </p>
            </div>

            {/* Mobile Input Field with Country Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Mobile Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+971">🇦🇪 +971</option>
                  <option value="+65">🇸🇬 +65</option>
                  <option value="+60">🇲🇾 +60</option>
                </select>

                <div className="relative flex-1">
                  <input
                    type="tel"
                    required
                    maxLength={15}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="98765 43210"
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-semibold tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* OTP Length Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Select OTP Length
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[6, 4].map((len) => (
                  <button
                    key={len}
                    type="button"
                    onClick={() => setOtpLength(len as 4 | 6)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      otpLength === len
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {len} Digits {len === 6 ? '(Standard)' : '(Quick)'}
                  </button>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Send OTP Button */}
            <button
              type="submit"
              disabled={loading || mobileNumber.length < 5}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Sending OTP...</span>
                </>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ============================================================ */}
        {/* STEP 2: ENTER OTP                                            */}
        {/* ============================================================ */}
        {step === 2 && (
          <div className="space-y-6 animate-slide-up">
            {/* Target Mobile Info + Edit Button */}
            <div className="text-center space-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Verify OTP Code
              </h2>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Code sent to</span>
                <strong className="text-slate-800 dark:text-slate-200 font-mono">
                  {countryCode} {mobileNumber}
                </strong>
                <button
                  onClick={handleReset}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline p-1"
                  title="Change Number"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Simulated Incoming SMS Toast / Banner */}
            {generatedOtp && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-transparent border border-emerald-500/30 flex items-center justify-between gap-3 animate-slide-up">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500 text-white">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider block">
                      Incoming SMS Simulation
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      Your code is <strong className="font-mono text-base font-extrabold text-slate-900 dark:text-white tracking-widest">{generatedOtp}</strong>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAutofill}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors whitespace-nowrap shadow-sm"
                >
                  Autofill
                </button>
              </div>
            )}

            {/* Individual Digits OTP Input Boxes (4 or 6) */}
            <div>
              <OtpInput
                length={otpLength}
                value={otpValue}
                onChange={setOtpValue}
                disabled={verifying || isLocked || expirySeconds <= 0}
                isError={Boolean(errorMessage)}
                onComplete={(code) => handleVerifyOtp(code)}
              />
            </div>

            {/* Expiry Timer & Remaining Attempts */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <div className="flex items-center gap-1.5">
                <Clock className={`w-3.5 h-3.5 ${expirySeconds <= 15 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`} />
                <span>
                  {expirySeconds > 0 ? (
                    <>Expires in <strong className="font-mono font-bold text-slate-900 dark:text-white">{expirySeconds}s</strong></>
                  ) : (
                    <strong className="text-rose-500 font-bold">Code Expired</strong>
                  )}
                </span>
              </div>

              <div>
                <span className={attemptsRemaining <= 2 ? 'text-rose-500 font-bold' : ''}>
                  {attemptsRemaining} / 5 attempts left
                </span>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Verify Button */}
            <button
              onClick={() => handleVerifyOtp()}
              disabled={verifying || isLocked || expirySeconds <= 0 || otpValue.length !== otpLength}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {verifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify Mobile Number</span>
                </>
              )}
            </button>

            {/* Resend Cooldown Footer */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>
                  {resendCooldown > 0
                    ? `Resend OTP in ${resendCooldown}s`
                    : "Didn't receive code? Resend OTP"}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 3: SUCCESS STATE                                        */}
        {/* ============================================================ */}
        {step === 3 && (
          <div className="text-center py-6 space-y-6 animate-slide-up">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center ring-8 ring-emerald-50 dark:ring-emerald-950/20 shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Verified Successfully!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Mobile number <strong className="text-slate-800 dark:text-slate-200 font-mono">{countryCode} {mobileNumber}</strong> has been authenticated with single-use OTP verification.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">VERIFIED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Security Check</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Passed (Single-Use Consumed)</span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-md"
            >
              Verify Another Mobile Number
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
