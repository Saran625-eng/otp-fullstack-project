import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: ReactNode;
  trend?: string;
  colorScheme: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  colorScheme
}) => {
  const schemeClasses = {
    blue: 'from-blue-500/10 to-transparent border-blue-500/20 text-blue-600 dark:text-blue-400',
    emerald: 'from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    amber: 'from-amber-500/10 to-transparent border-amber-500/20 text-amber-600 dark:text-amber-400',
    rose: 'from-rose-500/10 to-transparent border-rose-500/20 text-rose-600 dark:text-rose-400',
    purple: 'from-purple-500/10 to-transparent border-purple-500/20 text-purple-600 dark:text-purple-400'
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900/80 p-5 shadow-sm transition-all hover:shadow-md bg-gradient-to-br ${schemeClasses[colorScheme]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 ${schemeClasses[colorScheme]}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-['JetBrains_Mono',monospace]">
          {value}
        </span>
        {trend && (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {trend}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
};
