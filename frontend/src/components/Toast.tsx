import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 flex-shrink-0" />
  };

  const borders = {
    success: 'border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200',
    error: 'border-rose-500/30 bg-rose-50/90 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200',
    info: 'border-sky-500/30 bg-sky-50/90 dark:bg-sky-950/40 text-sky-950 dark:text-sky-200'
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-slide-up ${borders[type]}`}
      role="alert"
    >
      {icons[type]}
      <p className="text-sm font-medium pr-2">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
