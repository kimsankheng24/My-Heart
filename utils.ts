import { Currency } from './types';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * My Heart Financial - Standard Utilities & Design System Tokens
 * Refined per Project Specifications
 */

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * --- Standardized Typography Scale ---
 * Scales based on 16px root font size
 * H1: 20px (1.25rem) -> 24px (1.5rem), LH: 1.75rem, Bold (700)
 * H2: 18px (1.125rem) -> 20px (1.25rem), LH: 1.5rem, Semi-bold (600)
 * H3: 16px (1rem), LH: 1.375rem, Semi-bold (600)
 * Body: 14px (0.875rem), LH: 1.5rem, Regular (400)
 * Caption: 12px (0.75rem), LH: 1rem, Regular (400)
 */

export const TOKENS = {
  typography: {
    fontSize: {
      h1: "text-[1.25rem] md:text-[1.5rem]",
      h2: "text-[1.125rem] md:text-[1.25rem]",
      h3: "text-[1rem]",
      body: "text-sm",
      caption: "text-xs",
      label: "text-[0.75rem] md:text-[0.875rem]",
    },
    lineHeight: {
      h1: "leading-[1.75rem]",
      h2: "leading-[1.5rem]",
      h3: "leading-[1.375rem]",
      body: "leading-5",
      caption: "leading-4",
      label: "leading-[1.25rem]",
    },
    fontWeight: {
      bold: "font-bold",      // 700
      semibold: "font-semibold",  // 600
      regular: "font-normal",    // 400
    }
  },

  colors: {
    text: {
      primary: "text-gray-900 dark:text-gray-50",
      secondary: "text-gray-800 dark:text-gray-200",
      muted: "text-gray-600 dark:text-gray-400",
      inverse: "text-white dark:text-gray-900",
      label: "text-gray-900 dark:text-gray-100",
    },
    status: {
      success: "text-emerald-600 dark:text-emerald-400",
      warning: "text-yellow-600 dark:text-yellow-400",
      danger: "text-red-600 dark:text-red-400",
      info: "text-blue-600 dark:text-blue-400",
      successBg: "bg-emerald-50 dark:bg-emerald-900/30",
      dangerBg: "bg-red-50 dark:bg-red-900/30",
    },
    surface: {
      base: "bg-[#f3f4f6] dark:bg-[#0d1117]",
      subtle: "bg-gray-50 dark:bg-[#161b22]",
      elevated: "bg-white dark:bg-[#1c2128]",
    },
    border: {
      default: "border-gray-200 dark:border-[#30363d]",
      strong: "border-gray-300 dark:border-[#444c56]",
    }
  }
};

export const CLASSES = {
  typography: {
    h1: cn(TOKENS.typography.fontSize.h1, TOKENS.typography.lineHeight.h1, TOKENS.typography.fontWeight.bold, TOKENS.colors.text.primary, "type-h1"),
    h2: cn(TOKENS.typography.fontSize.h2, TOKENS.typography.lineHeight.h2, TOKENS.typography.fontWeight.semibold, TOKENS.colors.text.primary, "type-h2"),
    h3: cn(TOKENS.typography.fontSize.h3, TOKENS.typography.lineHeight.h3, TOKENS.typography.fontWeight.semibold, TOKENS.colors.text.primary, "type-h3"),
    body: cn(TOKENS.typography.fontSize.body, TOKENS.typography.lineHeight.body, TOKENS.typography.fontWeight.regular, TOKENS.colors.text.secondary, "type-body"),
    label: cn(TOKENS.typography.fontSize.label, TOKENS.typography.lineHeight.label, TOKENS.typography.fontWeight.regular, TOKENS.colors.text.label, "type-label"),
    caption: cn(TOKENS.typography.fontSize.caption, TOKENS.typography.lineHeight.caption, TOKENS.typography.fontWeight.regular, TOKENS.colors.text.muted, "type-caption"),
    tableHeader: cn("text-sm", TOKENS.typography.fontWeight.semibold, TOKENS.colors.text.muted, "type-table-header"),
    meta: cn(TOKENS.typography.fontSize.caption, TOKENS.typography.fontWeight.regular, TOKENS.colors.text.muted, "type-meta"),
    
    destructive: cn("font-bold text-red-600 dark:text-red-400"),
    success: cn("font-bold text-emerald-600 dark:text-emerald-400"),
    muted: cn(TOKENS.colors.text.muted, "font-normal"),
  },

  container: cn(
    "w-full flex flex-col space-y-8 animate-in fade-in duration-500 pb-28 md:pb-12 min-h-screen",
    "px-4 md:px-6 lg:px-8 xl:px-10",
    TOKENS.colors.surface.base
  ),
  
  card: cn("rounded-[1.5rem] md:rounded-[2rem] border shadow-sm transition-all duration-300", TOKENS.colors.surface.elevated, TOKENS.colors.border.default),
  
  grid: "grid gap-6 md:gap-8",
  gridDense: "grid gap-4 md:gap-6",

  input: cn(
    "w-full px-4 h-12 rounded-2xl transition-all shadow-sm outline-none focus:ring-4 focus:ring-emerald-500/10",
    TOKENS.colors.surface.elevated, TOKENS.colors.border.strong, TOKENS.colors.text.primary,
    "placeholder-gray-400 focus:border-emerald-500 hover:border-emerald-400 disabled:opacity-50"
  ),
  select: cn(
    "w-full px-4 h-12 rounded-2xl transition-all shadow-sm cursor-pointer appearance-none outline-none focus:ring-4 focus:ring-emerald-500/10",
    TOKENS.colors.surface.elevated, TOKENS.colors.border.strong, TOKENS.colors.text.primary,
    "focus:border-emerald-500 hover:border-emerald-400"
  ),
  inputError: "border-red-500 dark:border-red-900 focus:border-red-500 focus:ring-red-500/10",
  
  buttonPrimary: cn("flex items-center justify-center gap-2 px-6 h-12 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 font-semibold text-sm leading-4 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-600/20 whitespace-nowrap"),
  buttonSecondary: cn(
    "flex items-center justify-center gap-2 px-6 h-12 rounded-2xl font-semibold text-sm leading-4 transition-all border active:scale-95 disabled:opacity-50 shadow-sm whitespace-nowrap",
    TOKENS.colors.surface.elevated, TOKENS.colors.border.default, TOKENS.colors.text.primary, "hover:bg-gray-50 dark:hover:bg-gray-800"
  ),
  buttonDanger: cn("flex items-center justify-center gap-2 px-6 h-12 bg-red-600 text-white rounded-2xl hover:bg-red-700 font-semibold text-sm leading-4 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-red-600/20 whitespace-nowrap"),
  buttonGhost: cn("p-3 rounded-xl transition-all active:scale-90", TOKENS.colors.text.muted, "hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"),

  th: cn("px-6 py-4 border-b bg-gray-50/50 dark:bg-gray-800/50", TOKENS.colors.border.default),
  td: cn("px-6 py-4 border-b", TOKENS.colors.border.default),

  modalOverlay: "fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300",
  modalContent: "bg-white dark:bg-[#161b22] w-full rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-800",
  modalHeader: "flex items-center justify-between p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800 shrink-0",
  modalBody: "p-6 sm:p-8 overflow-y-auto scrollbar-thin space-y-6 flex-1",
  modalFooter: "p-6 sm:p-8 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-end gap-3 shrink-0",
};

export function getPhnomPenhNowISO(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Phnom_Penh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(now);
  const map: any = {};
  parts.forEach(p => map[p.type] = p.value);
  // Ensure format is YYYY-MM-DDThh:mm compatible with datetime-local inputs
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

export function convertToDefault(amount: number, fromCurrency: string, toCurrency: string, exchangeRates: Record<string, number>): number {
  if (fromCurrency === toCurrency) return amount;
  const rateFrom = exchangeRates[fromCurrency] || 1;
  const rateTo = exchangeRates[toCurrency] || 1;
  return (amount / rateFrom) * rateTo;
}

export function formatCurrency(
  amount: number, 
  currency: string, 
  lang: string = 'en',
  targetCurrency?: string, 
  exchangeRates?: Record<string, number>
): string {
  let displayAmount = amount;
  let displayCurrency = currency;

  if (targetCurrency && exchangeRates && currency !== targetCurrency) {
    displayAmount = convertToDefault(amount, currency, targetCurrency, exchangeRates);
    displayCurrency = targetCurrency;
  }

  const locale = lang === 'km' ? 'km-KH' : 'en-US';
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const symbol = displayCurrency === Currency.USD ? '$' : displayCurrency === Currency.KHR ? '៛' : '฿';
  return `${formatter.format(displayAmount)} ${symbol}`;
}

export function formatNumber(value: number, decimals: number = 2, lang: string = 'en'): string {
    const locale = lang === 'km' ? 'km-KH' : 'en-US';
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}

export function formatDate(dateStr: string, lang: string = 'en'): string {
  if (!dateStr) return '-';
  try {
    const locale = lang === 'km' ? 'km-KH' : 'en-GB';
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Phnom_Penh'
    }).format(new Date(dateStr));
  } catch (e) {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string, lang: string = 'en'): string {
  if (!dateStr) return '-';
  try {
    const locale = lang === 'km' ? 'km-KH' : 'en-GB';
    const date = new Date(dateStr);
    const datePart = new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Phnom_Penh'
    }).format(date);
    
    const timePart = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Phnom_Penh'
    }).format(date);
    
    return `${datePart} ${timePart}`;
  } catch (e) {
    return dateStr;
  }
}