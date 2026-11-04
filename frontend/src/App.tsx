import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Toast, ToastProps } from './components/Toast';
import { MobileOtpFlow } from './components/MobileOtpFlow';
import { GenerateOtp } from './pages/GenerateOtp';
import { VerifyOtp } from './pages/VerifyOtp';
import { History } from './pages/History';
import { ApiService } from './services/api';
import { HealthStatus } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('mobile');
  const [verifyState, setVerifyState] = useState<any>(null);
  const [toasts, setToasts] = useState<Omit<ToastProps, 'onClose'>[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  // Dark mode with localStorage
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    ApiService.getHealth().then(setHealth).catch(() => setHealth(null));
  }, []);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleNavigate = (tab: string, state?: any) => {
    if (state && tab === 'verify') {
      setVerifyState(state);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Toast Notification Stack */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              id={toast.id}
              type={toast.type}
              message={toast.message}
              onClose={removeToast}
            />
          </div>
        ))}
      </div>

      {/* Top Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleNavigate}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        health={health}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'mobile' && (
          <MobileOtpFlow onNotify={addToast} />
        )}
        {currentTab === 'generate' && (
          <GenerateOtp onNavigate={handleNavigate} onNotify={addToast} />
        )}
        {currentTab === 'verify' && (
          <VerifyOtp
            initialState={verifyState}
            onNavigate={handleNavigate}
            onNotify={addToast}
          />
        )}
        {currentTab === 'history' && (
          <History onNavigate={handleNavigate} onNotify={addToast} />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} OTP Testing Studio — Standalone Frontend Application</p>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Client-side Web Crypto Active
            </span>
            <span>•</span>
            <span>Zero Backend Required</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
