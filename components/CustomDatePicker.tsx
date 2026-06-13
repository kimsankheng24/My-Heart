import React, { useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { cn, CLASSES } from '../utils';
import { Typography } from './Typography';

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'date' | 'month' | 'datetime-local';
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  iconSize?: number;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  type = 'date',
  label,
  required,
  error,
  disabled,
  className,
  inputClassName,
  placeholder,
  iconSize = 18
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Ensure value format matches input type requirements
  useEffect(() => {
    if (type === 'month' && value) {
      // Month input expects YYYY-MM format
      const match = value.match(/^\d{4}-\d{2}$/);
      if (!match) {
        // Try to parse and format if it's not in YYYY-MM
        try {
          const d = new Date(value);
          if (!isNaN(d.getTime())) {
            const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (formatted !== value) {
              onChange(formatted);
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, [type, value, onChange]);

  const handleContainerClick = () => {
    if (disabled) return;
    try {
      // Modern showPicker API provides the best affordance by opening the UI immediately
      if (inputRef.current && 'showPicker' in inputRef.current) {
        (inputRef.current as any).showPicker();
      } else {
        inputRef.current?.focus();
      }
    } catch (e) {
      inputRef.current?.focus();
    }
  };

  return (
    <div className={cn("w-full flex flex-col group", className)}>
      {label && (
        <Typography variant="label" as="label" className="mb-1.5 block px-0.5">
          {label} {required && <span className="text-red-500">*</span>}
        </Typography>
      )}
      <div 
        className="relative w-full cursor-pointer" 
        onClick={handleContainerClick}
      >
        <input
          ref={inputRef}
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={cn(
            CLASSES.input,
            "w-full transition-all appearance-none px-4 pr-11 font-medium h-12 cursor-pointer",
            "group-hover:border-emerald-400 group-focus-within:border-emerald-500",
            error && CLASSES.inputError,
            inputClassName
          )}
        />
        <div 
          className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 group-hover:text-emerald-500 group-focus-within:text-emerald-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation(); // Prevent double triggering if parent has onClick
            handleContainerClick();
          }}
        >
          <Calendar size={iconSize} />
        </div>
      </div>
      {error && (
        <Typography variant="caption" className="text-red-500 font-bold mt-1.5 px-1 block animate-in fade-in slide-in-from-top-1 text-[11px]">
          {error}
        </Typography>
      )}
    </div>
  );
};