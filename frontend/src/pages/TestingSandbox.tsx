import React, { useState } from 'react';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Lock,
  RefreshCw,
  Terminal,
  ShieldCheck,
  Zap,
  Code
} from 'lucide-react';
import { ApiService } from '../services/api';

interface TestingSandboxProps {
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
  onNavigate: (tab: string, state?: any) => void;
}

interface TestLog {
  id: string;
  scenario: string;
  status: 'passed' | 'failed' | 'running';
  details: string;
  timestamp: string;
  payload?: any;
}

export const TestingSandbox: React.FC<TestingSandboxProps> = ({ onNotify, onNavigate }) => {
  const [logs, setLogs] = useState<TestLog[]>([]);
  const [runningScenario, setRunningScenario] = useState<string | null>(null);

  const addLog = (scenario: string, status: 'passed' | 'failed' | 'running', details: string, payload?: any) => {
    const newEntry: TestLog = {
      id: Math.random().toString(36).substring(2, 9),
      scenario,
      status,
      details,
      timestamp: new Date().toLocaleTimeString(),
      payload
    };
    setLogs((prev) => [newEntry, ...prev]);
  };

  // 1. Test Correct OTP Verification
  const testCorrectVerification = async () => {
    const name = 'Scenario 1: Correct OTP Verification';
    setRunningScenario(name);
    addLog(name, 'running', 'Generating 6-digit test OTP...');

    try {
      const gen = await ApiService.generateOtp({
        destination: 'qa.correct@test.local',
        deliveryMethod: 'TESTING',
        length: 6,
        expirySeconds: 60
      });

      if (!gen.testOtp) throw new Error('Test OTP was not returned by API');

      addLog(name, 'running', `Generated OTP: ${gen.testOtp}. Submitting verification...`);

      const verifyRes = await ApiService.verifyOtp({
        otpId: gen.otpId,
        otp: gen.testOtp
      });

      if (verifyRes.success && verifyRes.status === 'VERIFIED') {
        addLog(name, 'passed', 'PASS: Correct OTP accepted! Record marked as VERIFIED.', verifyRes);
        onNotify('success', 'Scenario 1 Passed: Valid OTP verified!');
      } else {
        addLog(name, 'failed', `FAIL: Expected success but got: ${verifyRes.message}`, verifyRes);
      }
    } catch (err: any) {
      addLog(name, 'failed', `ERROR: ${err.message}`);
    } finally {
      setRunningScenario(null);
    }
  };

  // 2. Test Incorrect OTP Verification
  const testIncorrectVerification = async () => {
    const name = 'Scenario 2: Incorrect OTP Verification';
    setRunningScenario(name);
    addLog(name, 'running', 'Generating OTP and testing incorrect code...');

    try {
      const gen = await ApiService.generateOtp({
        destination: 'qa.wrong@test.local',
        deliveryMethod: 'TESTING',
        length: 6,
        expirySeconds: 60
      });

      // Submit deliberate wrong code
      const verifyRes = await ApiService.verifyOtp({
        otpId: gen.otpId,
        otp: '000000'
      });

      if (!verifyRes.success && verifyRes.attemptsRemaining === 4) {
        addLog(name, 'passed', 'PASS: Incorrect code rejected. Decremented attempts remaining to 4.', verifyRes);
        onNotify('success', 'Scenario 2 Passed: Invalid OTP correctly rejected!');
      } else {
        addLog(name, 'failed', `FAIL: Unexpected response: ${JSON.stringify(verifyRes)}`);
      }
    } catch (err: any) {
      addLog(name, 'failed', `ERROR: ${err.message}`);
    } finally {
      setRunningScenario(null);
    }
  };

  // 3. Test Expired OTP
  const testExpiredOtp = async () => {
    const name = 'Scenario 3: Expired OTP Invalidation';
    setRunningScenario(name);
    addLog(name, 'running', 'Generating OTP and triggering fast-forward expiration...');

    try {
      const gen = await ApiService.generateOtp({
        destination: 'qa.expired@test.local',
        deliveryMethod: 'TESTING',
        length: 6,
        expirySeconds: 30
      });

      // Fast-forward expiration using simulated expiration endpoint
      await ApiService.simulateExpire(gen.otpId);

      addLog(name, 'running', 'Simulated expiration complete. Now verifying expired code...');

      const verifyRes = await ApiService.verifyOtp({
        otpId: gen.otpId,
        otp: gen.testOtp || '123456'
      });

      if (!verifyRes.success && verifyRes.status === 'EXPIRED') {
        addLog(name, 'passed', 'PASS: Expired OTP rejected with status EXPIRED.', verifyRes);
        onNotify('success', 'Scenario 3 Passed: Expired OTP blocked!');
      } else {
        addLog(name, 'failed', `FAIL: Expected EXPIRED rejection but got: ${verifyRes.message}`, verifyRes);
      }
    } catch (err: any) {
      addLog(name, 'failed', `ERROR: ${err.message}`);
    } finally {
      setRunningScenario(null);
    }
  };

  // 4. Test Maximum 5 Attempt Lockout
  const testMaxAttemptsLockout = async () => {
    const name = 'Scenario 4: Maximum 5 Attempt Lockout';
    setRunningScenario(name);
    addLog(name, 'running', 'Simulating 5 consecutive brute-force attacks...');

    try {
      const gen = await ApiService.generateOtp({
        destination: 'qa.lockout@test.local',
        deliveryMethod: 'TESTING',
        length: 6,
        expirySeconds: 120
      });

      let lastRes: any = null;
      for (let i = 1; i <= 5; i++) {
        lastRes = await ApiService.verifyOtp({
          otpId: gen.otpId,
          otp: '999999'
        });
      }

      if (lastRes && (lastRes.status === 'LOCKED' || lastRes.isLocked)) {
        addLog(name, 'passed', 'PASS: On 5th failed attempt, OTP locked permanently.', lastRes);
        onNotify('success', 'Scenario 4 Passed: 5-attempt brute force defense locked OTP!');
      } else {
        addLog(name, 'failed', 'FAIL: OTP did not lock on 5th attempt', lastRes);
      }
    } catch (err: any) {
      addLog(name, 'failed', `ERROR: ${err.message}`);
    } finally {
      setRunningScenario(null);
    }
  };

  // 5. Test Duplicate Verification (Single-Use Requirement)
  const testDuplicateVerification = async () => {
    const name = 'Scenario 5: Single-Use Duplicate Prevention';
    setRunningScenario(name);
    addLog(name, 'running', 'Testing re-use of an already verified OTP...');

    try {
      const gen = await ApiService.generateOtp({
        destination: 'qa.duplicate@test.local',
        deliveryMethod: 'TESTING',
        length: 6,
        expirySeconds: 60
      });

      // First verification (valid)
      await ApiService.verifyOtp({
        otpId: gen.otpId,
        otp: gen.testOtp!
      });

      // Second verification attempt on same OTP
      const secondAttempt = await ApiService.verifyOtp({
        otpId: gen.otpId,
        otp: gen.testOtp!
      });

      if (!secondAttempt.success && secondAttempt.message.includes('already')) {
        addLog(name, 'passed', 'PASS: Duplicate verification rejected. Single-use integrity preserved.', secondAttempt);
        onNotify('success', 'Scenario 5 Passed: Consumed OTP cannot be reused!');
      } else {
        addLog(name, 'failed', 'FAIL: Duplicate verification was not rejected as expected', secondAttempt);
      }
    } catch (err: any) {
      addLog(name, 'failed', `ERROR: ${err.message}`);
    } finally {
      setRunningScenario(null);
    }
  };

  // 6. Test Resend Cooldown
  const testResendCooldown = async () => {
    const name = 'Scenario 6: Resend Cooldown Guard (30s)';
    setRunningScenario(name);
    addLog(name, 'running', 'Generating OTP and immediately attempting resend...');

    try {
      const gen = await ApiService.generateOtp({
        destination: 'qa.resend@test.local',
        deliveryMethod: 'TESTING',
        length: 6,
        expirySeconds: 60
      });

      // Immediate resend should throw cooldown error
      try {
        await ApiService.resendOtp(gen.otpId);
        addLog(name, 'failed', 'FAIL: Immediate resend was allowed without cooldown enforcement.');
      } catch (err: any) {
        if (err.message.includes('cooldown') || err.message.includes('wait')) {
          addLog(name, 'passed', `PASS: Cooldown successfully enforced (${err.message})`);
          onNotify('success', 'Scenario 6 Passed: 30-second cooldown active!');
        } else {
          addLog(name, 'failed', `FAIL: Unexpected error: ${err.message}`);
        }
      }
    } catch (err: any) {
      addLog(name, 'failed', `ERROR: ${err.message}`);
    } finally {
      setRunningScenario(null);
    }
  };

  const runAllScenarios = async () => {
    await testCorrectVerification();
    await testIncorrectVerification();
    await testExpiredOtp();
    await testMaxAttemptsLockout();
    await testDuplicateVerification();
    await testResendCooldown();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-2">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Dedicated QA Automation Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Testing Mode & Scenario Lab
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Execute real-time security test cases to validate anti-tampering, expiration, and rate policies.
          </p>
        </div>

        <button
          onClick={runAllScenarios}
          disabled={Boolean(runningScenario)}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all hover:scale-[1.02]"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Run All 6 Test Scenarios</span>
        </button>
      </div>

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Scenario 1 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                Test 01
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
              Correct OTP Verification
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Generates a secure OTP, reads plaintext code from Testing Mode, and verifies match.
            </p>
          </div>
          <button
            onClick={testCorrectVerification}
            disabled={Boolean(runningScenario)}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run Test</span>
          </button>
        </div>

        {/* Scenario 2 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded">
                Test 02
              </span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
              Incorrect OTP Verification
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Submits invalid code, verifying error message and decrement of remaining attempts.
            </p>
          </div>
          <button
            onClick={testIncorrectVerification}
            disabled={Boolean(runningScenario)}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run Test</span>
          </button>
        </div>

        {/* Scenario 3 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
                Test 03
              </span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
              Expired OTP Invalidation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Fast-forwards expiration timestamp and asserts verification refusal with status EXPIRED.
            </p>
          </div>
          <button
            onClick={testExpiredOtp}
            disabled={Boolean(runningScenario)}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run Test</span>
          </button>
        </div>

        {/* Scenario 4 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded">
                Test 04
              </span>
              <Lock className="w-4 h-4 text-purple-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
              Maximum 5 Attempts Lockout
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Simulates 5 failed attempts and confirms state transitions permanently to LOCKED.
            </p>
          </div>
          <button
            onClick={testMaxAttemptsLockout}
            disabled={Boolean(runningScenario)}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run Test</span>
          </button>
        </div>

        {/* Scenario 5 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                Test 05
              </span>
              <ShieldCheck className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
              Duplicate Verification Guard
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Verifies OTP once, then tests immediate reuse attempt to confirm single-use invalidation.
            </p>
          </div>
          <button
            onClick={testDuplicateVerification}
            disabled={Boolean(runningScenario)}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run Test</span>
          </button>
        </div>

        {/* Scenario 6 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded">
                Test 06
              </span>
              <RefreshCw className="w-4 h-4 text-teal-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
              Resend 30s Cooldown Guard
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Triggers instant resend to verify that the 30-second rate limiter rejects early requests.
            </p>
          </div>
          <button
            onClick={testResendCooldown}
            disabled={Boolean(runningScenario)}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run Test</span>
          </button>
        </div>
      </div>

      {/* Live Console Output Log */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950 text-slate-200 shadow-2xl overflow-hidden font-mono text-xs">
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-300">Live Test Execution Log</span>
          </div>
          <button
            onClick={() => setLogs([])}
            className="text-[11px] text-slate-400 hover:text-white transition-colors"
          >
            Clear Log
          </button>
        </div>

        <div className="p-5 max-h-80 overflow-y-auto space-y-2.5">
          {logs.length === 0 ? (
            <p className="text-slate-500 italic py-6 text-center">
              No tests executed yet. Click "Run All 6 Test Scenarios" or choose an individual test above.
            </p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-2 rounded-lg bg-slate-900/40 hover:bg-slate-900 transition-colors"
              >
                <span className="text-slate-500 text-[10px] flex-shrink-0 pt-0.5">
                  [{log.timestamp}]
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0 ${
                    log.status === 'passed'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : log.status === 'failed'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                  }`}
                >
                  {log.status}
                </span>
                <div className="flex-1 space-y-1">
                  <p className="text-slate-200">{log.details}</p>
                  {log.payload && (
                    <pre className="text-[10px] text-slate-400 bg-black/40 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
