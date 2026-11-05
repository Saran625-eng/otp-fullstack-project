
import React from 'react';
import {
  ShieldCheck,
  KeyRound,
  CheckCircle,
  History,
  Smartphone,
  Sun,
  Moon,
  Users
} from 'lucide-react';
import { HealthStatus } from '../types';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  health: HealthStatus | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  isDark,
  onToggleTheme
}) => {
  const navItems = [
    { id: 'mobile', label: 'Mobile Auth Flow', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'generate', label: 'Generate OTP', icon: <KeyRound className="w-4 h-4" /> },
    { id: 'verify', label: 'Verify OTP', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'history', label: 'History & Logs', icon: <History className="w-4 h-4" /> },
    { id: 'players', label: 'Players', icon: <Users className="w-4 h-4" /> }
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div
            onClick={() => onSelectTab('mobile')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  OTP Studio
                </span>
                <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Frontend Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Instant OTP Generation & Verification
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>
          </div>
        </div>

        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-100 dark:border-slate-800 scrollbar-none">
          {navItems.map((item) => {
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-emerald-600'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
