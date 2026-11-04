import React, { useRef, useEffect } from 'react';

interface OtpInputProps {
  length: 4 | 6;
  value: string;
  onChange: (otp: string) => void;
  disabled?: boolean;
  isError?: boolean;
  onComplete?: (otp: string) => void;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length,
  value,
  onChange,
  disabled = false,
  isError = false,
  onComplete
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Array of single characters
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    // Focus first input automatically on mount if empty and not disabled
    if (!disabled && !value && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [length, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const rawVal = e.target.value;
    const lastChar = rawVal.slice(-1);

    // Only allow single digit 0-9
    if (lastChar && !/^\d$/.test(lastChar)) {
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = lastChar;
    const combined = newDigits.join('');
    onChange(combined);

    if (lastChar && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (combined.length === length && onComplete) {
      onComplete(combined);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;

    const pastedData = e.clipboardData.getData('text').trim();
    // Keep only numbers up to the required length
    const cleanNumbers = pastedData.replace(/\D/g, '').slice(0, length);

    if (cleanNumbers.length > 0) {
      onChange(cleanNumbers);

      // Focus the last filled box or next empty box
      const targetFocusIndex = Math.min(cleanNumbers.length, length - 1);
      inputRefs.current[targetFocusIndex]?.focus();

      if (cleanNumbers.length === length && onComplete) {
        onComplete(cleanNumbers);
      }
    }
  };

  return (
    <div className="flex justify-center items-center gap-2.5 sm:gap-4 my-6">
      {Array.from({ length }).map((_, index) => {
        const isFilled = Boolean(digits[index]);
        return (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            disabled={disabled}
            value={digits[index]}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            aria-label={`Digit ${index + 1} of ${length}`}
            className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold font-['JetBrains_Mono',monospace] rounded-xl border-2 outline-none transition-all duration-200 ${
              disabled
                ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                : isError
                ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 focus:ring-4 focus:ring-rose-500/20'
                : isFilled
                ? 'border-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15'
            }`}
          />
        );
      })}
    </div>
  );
};
