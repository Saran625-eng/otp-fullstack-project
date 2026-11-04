
import React, { useState } from 'react';
import {
  KeyRound,
  Smartphone,
  Clock,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Info
} from 'lucide-react';
import { ApiService } from '../services/api';
import { GenerateOtpResponse } from '../types';

interface GenerateOtpProps {
  onNavigate: (tab: string, state?: any) => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const GenerateOtp: React.FC<GenerateOtpProps> = ({
  onNavigate,
  onNotify
}) => {
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedResult, setGeneratedResult] =
    useState<GenerateOtpResponse | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    const mobileNumber = destination.trim();

    if (!/^\+[1-9]\d{7,14}$/.test(mobileNumber)) {
      onNotify(
        'error',
        'Enter a valid mobile number with country code. Example: +919876543210'
      );
      return;
    }

    try {
      setLoading(true);
      setGeneratedResult(null);

      const res = await ApiService.generateOtp({
        destination: mobileNumber,
        deliveryMethod: 'SMS',
        length: 6,
        expirySeconds: 60
      });

      setGeneratedResult(res);
      onNotify('success', res.message || 'OTP generated successfully!');
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to generate OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToVerify = () => {
    if (!generatedResult) return;

    onNavigate('verify', {
      otpId: generatedResult.otpId,
      destination: generatedResult.destination,
      otpLength: 6,
      expiresAt: generatedResult.expiresAt,
      resendAvailableAt: generatedResult.resendAvailableAt
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <KeyRound className="w-3.5 h-3.5" />
          <span>Backend OTP Generator</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Generate One-Time Password
        </h1>

        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Generate a secure six-digit OTP using the Spring Boot backend.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Delivery Method
              </label>

              <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                <Smartphone className="w-5 h-5" />
                <span className="text-sm font-semibold">SMS / Mobile Number</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Mobile Number
              </label>

              <input
                type="tel"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="+919876543210"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                Include the country code, for example +91 for India.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                OTP Configuration
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500">OTP Length</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                    6 Digits
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500">Expiry Time</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    60 Seconds
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating OTP...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Generate OTP</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-5 space-y-6">
          {generatedResult ? (
            <div className="rounded-3xl border-2 border-emerald-500/30 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-lg space-y-5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-semibold">
                  OTP Generated Successfully
                </span>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                <strong>Local testing:</strong> SMS delivery is not configured yet.
                Check your Spring Boot backend terminal for the generated OTP.
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 divide-y divide-slate-100 dark:divide-slate-800">
                <div className="flex justify-between py-2 gap-3">
                  <span>OTP ID</span>
                  <span className="font-mono text-right break-all">
                    {generatedResult.otpId}
                  </span>
                </div>

                <div className="flex justify-between py-2 gap-3">
                  <span>Mobile Number</span>
                  <span className="font-medium text-right">
                    {generatedResult.destination}
                  </span>
                </div>

                <div className="flex justify-between py-2">
                  <span>OTP Length</span>
                  <span>6 digits</span>
                </div>

                <div className="flex justify-between py-2">
                  <span>Expiry</span>
                  <span>60 seconds</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceedToVerify}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
                <Smartphone className="w-6 h-6" />
              </div>

              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Ready to Generate OTP
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your mobile number and generate an OTP through the backend.
              </p>
            </div>
          )}

          <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <ShieldAlert className="w-4 h-4 text-emerald-500" />
              <span>Security Notice</span>
            </div>

            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
              The backend generates and validates the OTP. For local testing,
              the OTP is printed in the Spring Boot terminal. Actual SMS delivery
              requires SMS provider integration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
