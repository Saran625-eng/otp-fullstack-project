import React, { useEffect, useState } from 'react';
import {
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  ArrowRight,
  RefreshCw,
  ShieldAlert,
  Send,
  FlaskConical
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { StatusBadge, DeliveryBadge } from '../components/Badge';
import { ApiService } from '../services/api';
import { OtpMetrics, OtpHistoryItem } from '../types';

interface DashboardProps {
  onNavigate: (tab: string, state?: any) => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onNotify }) => {
  const [metrics, setMetrics] = useState<OtpMetrics>({
    totalGenerated: 0,
    verified: 0,
    failedAttempts: 0,
    expired: 0,
    locked: 0,
    pending: 0
  });
  const [recentOtps, setRecentOtps] = useState<OtpHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, historyData] = await Promise.all([
        ApiService.getStats(),
        ApiService.getHistory({ limit: 6 })
      ]);
      setMetrics(statsData);
      setRecentOtps(historyData.data);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const verificationRate =
    metrics.totalGenerated > 0
      ? Math.round((metrics.verified / metrics.totalGenerated) * 100)
      : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome & Quick Action Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Testing & Verification Engine Active
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            OTP Generation & Verification Studio
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Enterprise-grade testing platform equipped with cryptographically secure random generation,
            HMAC-SHA256 hashing, rate limiting, single-use invalidation, and maximum attempt safeguards.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('generate')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <KeyRound className="w-4 h-4" />
              Generate New OTP
            </button>
            <button
              onClick={() => onNavigate('sandbox')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold border border-white/10 backdrop-blur-sm transition-all"
            >
              <FlaskConical className="w-4 h-4 text-emerald-400" />
              Run Scenario Lab
            </button>
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Background glow decoration */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/4 bottom-0 -mb-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total OTPs Generated"
          value={metrics.totalGenerated}
          subtitle="Cryptographically randomized"
          colorScheme="blue"
          icon={<KeyRound className="w-5 h-5" />}
        />
        <StatCard
          title="Successfully Verified"
          value={metrics.verified}
          trend={`${verificationRate}% success rate`}
          subtitle="Single-use consumed"
          colorScheme="emerald"
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <StatCard
          title="Failed Verification Attempts"
          value={metrics.failedAttempts}
          subtitle="Incorrect inputs logged"
          colorScheme="amber"
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <StatCard
          title="Expired / Locked OTPs"
          value={metrics.expired + metrics.locked}
          trend={`${metrics.locked} locked by policy`}
          subtitle="Enforced by security threshold"
          colorScheme="rose"
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Security Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Zero Plaintext Storage</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            All OTPs are hashed using keyed HMAC-SHA256 with application pepper. Only timing-safe digests are compared.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
            <Lock className="w-4 h-4" />
            <span>5-Attempt Lockout Defense</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Any OTP with 5 consecutive failed verification attempts is immediately and irrevocably locked against brute-force.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
            <Clock className="w-4 h-4" />
            <span>Cooldown & Expiry Guard</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Strict 30-second cooldown on resends plus configurable automated expiration (30s to 5 mins).
          </p>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Recent OTP Activity
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live audit stream of recent generation and verification events
            </p>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-emerald-400 hover:underline"
          >
            <span>View Full History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentOtps.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              No OTPs have been generated yet
            </p>
            <button
              onClick={() => onNavigate('generate')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold"
            >
              Generate First OTP
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="text-xs font-semibold uppercase bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">OTP ID</th>
                  <th className="px-6 py-3.5">Destination</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5">Length</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Attempts</th>
                  <th className="px-6 py-3.5">Created</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentOtps.map((otp) => (
                  <tr
                    key={otp.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors font-mono text-xs"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {otp.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 font-sans text-slate-700 dark:text-slate-300">
                      {otp.destination}
                    </td>
                    <td className="px-6 py-4 font-sans">
                      <DeliveryBadge method={otp.deliveryMethod} />
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                      {otp.otpLength} Digits
                    </td>
                    <td className="px-6 py-4 font-sans">
                      <StatusBadge status={otp.status} />
                    </td>
                    <td className="px-6 py-4 font-sans">
                      <span className={otp.attempts > 0 ? 'text-rose-500 font-bold' : 'text-slate-500'}>
                        {otp.attempts}/{otp.maxAttempts}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-sans text-slate-400">
                      {new Date(otp.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 text-right font-sans">
                      {otp.status === 'PENDING' ? (
                        <button
                          onClick={() =>
                            onNavigate('verify', {
                              otpId: otp.id,
                              destination: otp.destination,
                              otpLength: otp.otpLength,
                              expiresAt: otp.expiresAt
                            })
                          }
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                        >
                          Verify
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">Closed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
