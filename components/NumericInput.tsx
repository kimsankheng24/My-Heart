import React from 'react';
import { cn, CLASSES } from '../utils';
import { Typography } from './Typography';

interface NumericInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  currencySymbol?: string;
  suffix?: string;
  error?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  label,
  required,
  placeholder = "0.00",
  currencySymbol,
  suffix,
  error,
  className,
  inputClassName,
  disabled
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    let numericVal = val.replace(/,/g, '');
    if (numericVal !== '' && !/^\d*\.?\d*$/.test(numericVal)) return;
    const parts = numericVal.split('.');
    if (parts[1] && parts[1].length > 2) return;
    let displayVal = '';
    if (parts[0]) {
      const intPart = parseInt(parts[0], 10);
      if (!isNaN(intPart)) displayVal = intPart.toLocaleString('en-US');
    } else if (numericVal.startsWith('.')) displayVal = '';
    if (parts.length > 1) displayVal += '.' + (parts[1] || '');
    onChange(displayVal);
  };

  return (
    <div className={cn("w-full flex flex-col", className)}>
      {label && (
        <Typography variant="label" as="label" className="mb-1.5 block">
          {label} {required && <span className="text-red-500">*</span>}
        </Typography>
      )}
      <div className="relative group w-full">
        {currencySymbol && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-black pointer-events-none group-focus-within:text-emerald-500 transition-colors text-xs">
            {currencySymbol}
          </span>
        )}
        <input
          type="text"
          inputMode="decimal"
          disabled={disabled}
          className={cn(
            CLASSES.input,
            "font-black text-base w-full",
            currencySymbol ? "pl-11" : "pl-3.5",
            suffix ? "pr-16" : "pr-3.5",
            error && CLASSES.inputError,
            // Rule: Rounded-md for form elements
            "rounded-md border-2 focus:ring-8 focus:ring-emerald-500/5 transition-all duration-300 focus:border-emerald-500",
            inputClassName
          )}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          autoComplete="off"
        />
        {suffix && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-700 dark:text-emerald-300 font-bold pointer-events-none text-xs bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <Typography variant="caption" className="text-red-500 font-bold mt-1.5 px-1 block animate-in fade-in slide-in-from-top-1 text-[11px]">
          {error}
        </Typography>
      )}
    </div>
  );
};
