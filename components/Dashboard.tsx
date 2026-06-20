
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../store';
import { Currency, TransactionType, Account, AccountType, Transaction } from '../types';
import { formatCurrency, convertToDefault, formatDate, formatDateTime, CLASSES, cn, getPhnomPenhNowISO } from '../utils';
import { 
    ArrowUpRight, ArrowDownRight, Wallet, Info, 
    ChevronRight, X, 
    History, ChevronDown, Landmark, Clock, User as UserIcon, Coins,
    Tag, Settings2, BarChart3, TrendingUp, TrendingDown
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { useNavigate } from 'react-router';
import { Typography } from './Typography';
import { ResponsiveGrid } from './ResponsiveGrid';
import { CustomDatePicker } from './CustomDatePicker';

const getAccountIcon = (type: string) => {
    switch (type) {
        case AccountType.BANK: return <Landmark size={18} />;
        case AccountType.CASH: return <Coins size={18} />; 
        case AccountType.WALLET: return <Wallet size={18} />;
        default: return <Landmark size={18} />;
    }
};

const DropdownMenu = ({ options, value, onChange }: { options: string[], value: string, onChange: (val: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 transition-all"
            >
                {value} <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl md:rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200">
                    {options.map((opt: string) => (
                        <button 
                            key={opt} 
                            onClick={() => { onChange(opt); setIsOpen(false); }} 
                            className={cn(
                                "w-full text-left px-4 py-2 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                                value === opt ? "text-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10" : "text-gray-600 dark:text-gray-400"
                            )}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const CustomTooltip = ({ active, payload, label, currency, lang, t }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-[#161b22] p-3 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl z-50 min-w-[150px]">
                <p className="font-bold text-gray-900 dark:text-white mb-2 text-xs">{label}</p>
                {payload.map((p: any) => (
                    <div key={p.name} className="flex items-center justify-between gap-4 text-xs font-medium mb-1 last:mb-0">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill || p.color }} />
                            <span className="text-gray-500 dark:text-gray-400 capitalize">
                                {p.name === 'Income' ? t('income') : p.name === 'Expense' ? t('expense') : p.name === 'Net Income' ? t('net_income_label') : p.name}
                            </span>
                        </div>
                        <span className="tabular-nums font-bold text-gray-900 dark:text-white">
                            {formatCurrency(p.value, currency, lang)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const TooltipButton: React.FC<{ tooltip: string; variant?: 'default' | 'primary' }> = ({ tooltip, variant = 'default' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (ref.current && !ref.current.contains(event.target as Node)) {
              setIsOpen(false);
          }
      };
      if (isOpen) {
          document.addEventListener('mousedown', handleClickOutside);
      }
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
      <div className="relative inline-flex items-center justify-center shrink-0 z-50" ref={ref}>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
            className={cn(
                "cursor-pointer transition-colors p-0.5 rounded-full outline-none focus:ring-2 focus:ring-emerald-500/50", 
                variant === 'primary' 
                    ? "text-emerald-100/60 hover:text-white hover:bg-emerald-500/20" 
                    : "text-gray-300 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <Info size={12} />
          </button>
          
          {isOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 md:w-80 p-3 bg-gray-900/95 backdrop-blur-md text-white rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 z-[100] ring-1 ring-white/10 text-center">
                <Typography variant="caption" className="text-white text-[13px] leading-relaxed font-medium block whitespace-normal">
                    {tooltip}
                </Typography>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-[1px] border-4 border-transparent border-b-gray-900/95" />
            </div>
          )}
      </div>
  );
};

const KPICard: React.FC<{
  title: string;
  amount: number;
  currency: Currency;
  icon?: React.ElementType;
  trend?: number;
  trendLabel?: string;
  color: 'emerald' | 'red' | 'blue' | 'purple' | 'yellow';
  tooltip?: string;
  lang: string;
  invertTrendColor?: boolean;
  variant?: 'default' | 'primary';
}> = ({ title, amount, currency, icon: Icon, trend, trendLabel, color, tooltip, lang, invertTrendColor, variant = 'default' }) => {
  const trendColorClass = invertTrendColor 
    ? (trend && trend >= 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")
    : (trend && trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400");

  if (variant === 'primary') {
    return (
      <div className={cn("w-full h-full rounded-xl md:rounded-xl transition-all cursor-default relative group p-3 flex flex-col justify-between border shadow-xl bg-emerald-600 border-emerald-500 shadow-emerald-600/20")}>
        <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
            <div className="absolute top-0 right-0 p-3 opacity-10 transform translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
                {Icon && <Icon size={64} />}
            </div>
        </div>
        <div className="relative z-10 w-full flex justify-between items-start">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-md border border-white/20 shadow-sm shrink-0 flex items-center justify-center text-white">
                    {Icon && <Icon size={12} />}
                </div>
                <div className="flex items-center gap-1 min-w-0 flex-1">
                    <Typography variant="caption" className="text-emerald-400 dark:text-emerald-400 font-medium truncate text-xs md:text-sm">{title}</Typography>
                    {tooltip && <TooltipButton tooltip={tooltip} variant="primary" />}
                </div>
            </div>
        </div>
        <div className="relative z-10 mt-auto pt-2">
            <Typography variant="h2" className="break-all tabular-nums font-semibold leading-none tracking-tight text-base md:text-lg text-white">
                {formatCurrency(amount, currency, lang)}
            </Typography>
        </div>
      </div>
    );
  }

  const colorClasses = {
      emerald: 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400',
      red: 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-800/50 text-red-700 dark:text-red-400',
      blue: 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/50 text-blue-700 dark:text-blue-400',
      purple: 'bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800/50 text-purple-700 dark:text-purple-400',
      yellow: 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-800/50 text-yellow-700 dark:text-yellow-400'
  };

  const titleColors = {
      emerald: 'text-emerald-600 dark:text-emerald-400',
      red: 'text-red-600 dark:text-red-400',
      blue: 'text-blue-600 dark:text-blue-400',
      purple: 'text-purple-600 dark:text-purple-400',
      yellow: 'text-yellow-600 dark:text-yellow-400'
  };

  return (
    <div className={cn(CLASSES.card, "w-full h-full p-3 rounded-xl md:rounded-xl border shadow-sm flex flex-col justify-center transition-all", colorClasses[color])}>
      <div className="flex items-center mb-0.5">
          <Typography variant="caption" className={cn("font-medium text-xs md:text-sm block", titleColors[color])}>
              {title}
          </Typography>
          {tooltip && <TooltipButton tooltip={tooltip} />}
      </div>
      <div>
        <Typography variant="h2" className="text-base md:text-lg font-semibold tabular-nums tracking-tight leading-none break-all">
          {formatCurrency(amount, currency, lang)}
        </Typography>
        {trend !== undefined && !isNaN(trend) && (
            <div className="flex items-center gap-1.5 mt-1.5">
                <span className={cn("text-[10px] font-bold flex items-center", trendColorClass)}>
                    {trend >= 0 ? <TrendingUp size={12} className="mr-1"/> : <TrendingDown size={12} className="mr-1"/>}
                    {Math.abs(trend).toFixed(2)}%
                </span>
                {trendLabel && <span className="text-[10px] opacity-70 truncate">in {trendLabel}</span>}
            </div>
        )}
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { accounts, transactions, assets, liabilities, chartOfAccounts, settings, t, currentUser } = useApp();

  // Global Date Filter State (For KPIs - Default to This Month)
  const [startDate] = useState(() => {
    const nowISO = getPhnomPenhNowISO();
    const year = parseInt(nowISO.split('-')[0]);
    const month = parseInt(nowISO.split('-')[1]);
    return `${year}-${String(month).padStart(2, '0')}-01`;
  });
  const [endDate] = useState(() => {
    const nowISO = getPhnomPenhNowISO();
    const year = parseInt(nowISO.split('-')[0]);
    const month = parseInt(nowISO.split('-')[1]);
    const lastDay = new Date(year, month, 0).getDate();
    return `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  });
  
  // Independent Chart Filter States
  const [trendRange, setTrendRange] = useState('This Month');
  const [periodSummaryFilter, setPeriodSummaryFilter] = useState('This Month');

  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);

  const calculateDateRange = (preset: string) => {
    const nowISO = getPhnomPenhNowISO();
    const todayStr = nowISO.split('T')[0];
    const [yStr, mStr, dStr] = todayStr.split('-');
    const year = parseInt(yStr);
    const month = parseInt(mStr);
    const day = parseInt(dStr);
    const curr = new Date(year, month - 1, day, 12, 0, 0);
    const toISO = (d: Date) => {
        const yy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yy}-${mm}-${dd}`;
    };

    let start = '', end = '';
    // Map 'Daily' to 'Today' behavior for date range calculation
    const effectivePreset = preset === 'Daily' ? 'Today' : preset;

    switch(effectivePreset) {
        case 'Today': start = todayStr; end = todayStr; break;
        case 'Yesterday':
            const yest = new Date(curr); yest.setDate(curr.getDate() - 1);
            start = toISO(yest); end = toISO(yest); break;
        case 'This Week':
            const dist = (curr.getDay() + 6) % 7;
            const monday = new Date(curr); monday.setDate(curr.getDate() - dist);
            const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
            start = toISO(monday); end = toISO(sunday); break;
        case 'Last Week':
            const distLast = (curr.getDay() + 6) % 7;
            const prevMonday = new Date(curr); prevMonday.setDate(curr.getDate() - distLast - 7);
            const prevSunday = new Date(prevMonday); prevSunday.setDate(prevMonday.getDate() + 6);
            start = toISO(prevMonday); end = toISO(prevSunday); break;
        case 'This Month':
            start = `${year}-${String(month).padStart(2, '0')}-01`;
            const lastDayThis = new Date(year, month, 0).getDate();
            end = `${year}-${String(month).padStart(2, '0')}-${lastDayThis}`; break;
        case 'Last Month':
            let m = month - 1; let y = year;
            if (m === 0) { m = 12; y--; }
            start = `${y}-${String(m).padStart(2, '0')}-01`;
            const lastDayLast = new Date(y, m, 0).getDate();
            end = `${y}-${String(m).padStart(2, '0')}-${lastDayLast}`; break;
        case 'This Year': start = `${year}-01-01`; end = `${year}-12-31`; break;
        case 'Last Year': start = `${year - 1}-01-01`; end = `${year - 1}-12-31`; break;
    }
    return { start, end };
  };

  const rangeTransactions = useMemo(() => {
    return transactions.filter(t => {
      const txDate = t.date.split('T')[0];
      return txDate >= startDate && txDate <= endDate && !t.isInternalTransfer;
    });
  }, [transactions, startDate, endDate]);

  // --- Independent Period Summary Data Logic ---
  const summaryDateRange = useMemo(() => calculateDateRange(periodSummaryFilter), [periodSummaryFilter]);
  
  const summaryTransactions = useMemo(() => {
      const { start, end } = summaryDateRange;
      if (!start || !end) return [];
      return transactions.filter(t => {
          const d = t.date.split('T')[0];
          return d >= start && d <= end && !t.isInternalTransfer;
      });
  }, [transactions, summaryDateRange]);

  const summaryChartData = useMemo(() => {
    const inc = summaryTransactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((s, t) => s + convertToDefault(t.amount, t.currency, settings.defaultCurrency, settings.exchangeRates), 0);
    const exp = summaryTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((s, t) => s + convertToDefault(t.amount, t.currency, settings.defaultCurrency, settings.exchangeRates), 0);
    return [
        { name: 'Income', value: inc, fill: '#10B981' },
        { name: 'Expense', value: exp, fill: '#EF4444' },
        { name: 'Net Income', value: inc - exp, fill: '#3B82F6' }
    ];
  }, [summaryTransactions, settings]);

  // --- Independent Daily Trend Data Logic ---
  const trendDateRange = useMemo(() => calculateDateRange(trendRange), [trendRange]);
  const trendTransactions = useMemo(() => {
      const { start, end } = trendDateRange;
      if (!start || !end) return [];
      return transactions.filter(t => {
          const d = t.date.split('T')[0];
          return d >= start && d <= end && !t.isInternalTransfer;
      });
  }, [transactions, trendDateRange]);

  const trendChartData = useMemo(() => {
    const data: Record<string, { date: string; label: string; Income: number; Expense: number }> = {};
    const { start: startStr, end: endStr } = trendDateRange;
    if (!startStr || !endStr) return [];

    const start = new Date(startStr);
    const end = new Date(endStr);
    
    // Always use Daily granularity
    const getKeyAndLabel = (d: Date) => {
        return { 
            key: d.toISOString().split('T')[0], 
            label: d.getDate().toString() 
        };
    };

    // Initialize periods to ensure continuous axis
    let current = new Date(start);
    while (current <= end) {
        const { key, label } = getKeyAndLabel(current);
        if (!data[key]) data[key] = { date: key, label, Income: 0, Expense: 0 };
        current.setDate(current.getDate() + 1);
    }

    // Populate Data
    trendTransactions.forEach(tx => {
        const d = new Date(tx.date);
        const { key } = getKeyAndLabel(d);
        if (data[key]) {
            const val = convertToDefault(tx.amount, tx.currency, settings.defaultCurrency, settings.exchangeRates);
            if (tx.type === TransactionType.INCOME) data[key].Income += val;
            else data[key].Expense += val;
        }
    });

    return Object.values(data);
  }, [trendTransactions, trendDateRange, settings]);

  const totalBalance = accounts.reduce((acc, item) => 
      acc + convertToDefault(item.balance, item.currency, settings.defaultCurrency, settings.exchangeRates), 0
  );
  
  const rangeIncome = useMemo(() => rangeTransactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + convertToDefault(t.amount, t.currency, settings.defaultCurrency, settings.exchangeRates), 0), [rangeTransactions, settings]);
  const rangeExpense = useMemo(() => rangeTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + convertToDefault(t.amount, t.currency, settings.defaultCurrency, settings.exchangeRates), 0), [rangeTransactions, settings]);

  const prevPeriodRange = useMemo(() => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    
    // Check if it's a full month selection
    const isStartFirst = s.getDate() === 1;
    const isEndLast = new Date(e.getFullYear(), e.getMonth() + 1, 0).getDate() === e.getDate();
    const isSameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();

    if (isStartFirst && isEndLast && isSameMonth) {
        // It's a full single month, so previous period is the previous full month
        const prevStart = new Date(s);
        prevStart.setMonth(prevStart.getMonth() - 1);
        const prevEnd = new Date(prevStart.getFullYear(), prevStart.getMonth() + 1, 0);
        return {
            start: prevStart.toISOString().split('T')[0],
            end: prevEnd.toISOString().split('T')[0]
        };
    }

    const diff = Math.abs(e.getTime() - s.getTime());
    const days = Math.ceil(diff / (1000 * 3600 * 24)) + 1;
    const pEnd = new Date(s); pEnd.setDate(pEnd.getDate() - 1);
    const pStart = new Date(pEnd); pStart.setDate(pEnd.getDate() - days + 1);
    return { start: pStart.toISOString().split('T')[0], end: pEnd.toISOString().split('T')[0] };
  }, [startDate, endDate]);

  const prevRangeTransactions = useMemo(() => transactions.filter(t => {
      const d = t.date.split('T')[0]; return d >= prevPeriodRange.start && d <= prevPeriodRange.end && !t.isInternalTransfer;
  }), [transactions, prevPeriodRange]);

  const prevIncome = prevRangeTransactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + convertToDefault(t.amount, t.currency, settings.defaultCurrency, settings.exchangeRates), 0);
  const prevExpense = prevRangeTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + convertToDefault(t.amount, t.currency, settings.defaultCurrency, settings.exchangeRates), 0);
  
  const incomeTrend = prevIncome > 0 ? ((rangeIncome - prevIncome) / prevIncome) * 100 : (rangeIncome > 0 ? 100 : undefined);
  const expenseTrend = prevExpense > 0 ? ((rangeExpense - prevExpense) / prevExpense) * 100 : (rangeExpense > 0 ? 100 : undefined);

  const prevPeriodLabel = useMemo(() => {
      const s = new Date(prevPeriodRange.start);
      return s.toLocaleDateString(settings.language === 'km' ? 'km-KH' : 'en-US', { month: 'short', year: 'numeric' });
  }, [prevPeriodRange, settings.language]);

  const recentTransactions = useMemo(() => [...rangeTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 9), [rangeTransactions]);

  const getCategoryLabel = (categoryName: string) => {
      const coa = chartOfAccounts.find(c => c.name === categoryName);
      if (!coa) return categoryName;
      const name = settings.language === 'km' && coa.localName ? coa.localName : coa.name;
      return `${coa.code} - ${name}`;
  };

  const getDropdownOptions = (type: 'trend' | 'summary') => {
      if (type === 'trend') {
          return [t('daily'), t('this_month'), t('last_month')];
      }
      return [t('today'), t('yesterday'), t('this_month'), t('last_month'), t('this_year'), t('last_year')];
  };

  const mapDropdownValue = (val: string) => {
      // Mapping translation back to english key for logic if needed, 
      // or rely on the translation key being the value. 
      // Current logic `calculateDateRange` uses English keys.
      // So we must pass English keys to `calculateDateRange` but display Translated keys.
      // Refactoring: Let dropdown store keys, display labels.
      return val; 
  };

  return (
    <div className={cn(CLASSES.container, "!px-2 md:!px-4 lg:!px-6 !space-y-4 pb-24")}>
      {/* Welcome Header Area */}
      <div className="w-full pt-2 pb-3 mb-2 -mx-2 px-2 md:-mx-4 md:px-4 lg:-mx-6 lg:px-6 border-b border-gray-200/50 dark:border-dark-border/50 transition-all duration-200 no-print">
        <div className="flex flex-col gap-1">
            <Typography variant="h2" className="text-gray-900 dark:text-white text-lg md:text-xl font-bold">
                {t('welcome_back', { name: currentUser?.name || 'User' })}
            </Typography>
            <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                {t('dashboard_subtitle')}
            </Typography>
        </div>
      </div>

      <ResponsiveGrid className="grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 lg:gap-5 mb-2" variant="dense">
        {/* Total Balance - Always Visible */}
        <div className="col-span-2 md:col-span-1">
            <KPICard 
                variant="primary" 
                title={t('total_balance')} 
                amount={totalBalance} 
                currency={settings.defaultCurrency} 
                icon={Wallet} 
                color="emerald" 
                tooltip={t('total_balance_tooltip')}
                lang={settings.language} 
            />
        </div>

        {/* Income and Expenses Cards */}
        <div className="col-span-1">
            <KPICard 
                title={t('total_income')} 
                amount={rangeIncome} 
                trend={incomeTrend} 
                trendLabel={prevPeriodLabel}
                currency={settings.defaultCurrency} 
                color="emerald" 
                lang={settings.language} 
                tooltip={t('total_income_tooltip')}
            />
        </div>
        <div className="col-span-1">
            <KPICard 
                title={t('total_expenses')} 
                amount={rangeExpense} 
                trend={expenseTrend} 
                trendLabel={prevPeriodLabel}
                currency={settings.defaultCurrency} 
                color="red" 
                lang={settings.language} 
                invertTrendColor 
                tooltip={t('total_expenses_tooltip')}
            />
        </div>
      </ResponsiveGrid>

      {/* New 2-Column Chart Layout with Independent Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-4 animate-in slide-in-from-bottom-2 duration-500">
          {/* Left Column: Income Vs Expense */}
          <div className={cn(CLASSES.card, "p-5 bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 rounded-xl md:rounded-xl")}>
              <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400"><BarChart3 size={16} /></div>
                      <Typography variant="h3" className="font-bold text-sm text-gray-800 dark:text-gray-200">{t('income_vs_expense')}</Typography>
                  </div>
                  <div className="flex gap-2">
                    <DropdownMenu 
                        options={['Daily', 'This Month', 'Last Month']} 
                        value={trendRange} 
                        onChange={setTrendRange} 
                    />
                  </div>
              </div>
              <div className="w-full overflow-x-auto scrollbar-thin pb-2">
                  <div style={{ height: '250px', minWidth: trendChartData.length > 12 ? `${trendChartData.length * 32}px` : '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={2}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.3} />
                              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} dy={10} interval={0} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={(val) => new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(val)} />
                              <Tooltip content={<CustomTooltip currency={settings.defaultCurrency} lang={settings.language} t={t} />} cursor={{ fill: 'transparent' }} />
                              <Bar dataKey="Income" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                              <Bar dataKey="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          </div>

          {/* Right Column: Net Income */}
          <div className={cn(CLASSES.card, "p-5 bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 rounded-xl md:rounded-xl")}>
              <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400"><ArrowUpRight size={16} /></div>
                      <Typography variant="h3" className="font-bold text-sm text-gray-800 dark:text-gray-200">{t('net_income_label')}</Typography>
                  </div>
                  <DropdownMenu 
                    options={['Today', 'Yesterday', 'This Month', 'Last Month', 'This Year', 'Last Year']} 
                    value={periodSummaryFilter} 
                    onChange={setPeriodSummaryFilter} 
                  />
              </div>
              <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summaryChartData} layout="horizontal" margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.3} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} dy={10} tickFormatter={(val) => val === 'Net Income' ? t('net_income_label') : t(val.toLowerCase())} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={(val) => new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(val)} />
                          <Tooltip content={<CustomTooltip currency={settings.defaultCurrency} lang={settings.language} t={t} />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                            {summaryChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* Insights Section */}
      <ResponsiveGrid className="grid-cols-1 lg:grid-cols-3 gap-2 md:gap-4">
        <div className={cn(CLASSES.card, "lg:col-span-2 flex flex-col h-full bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 rounded-xl md:rounded-xl")}>
          <div className="flex justify-between items-center px-4 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/10">
            <Typography variant="h3" className="text-gray-800 dark:text-gray-200 font-semibold">{t('recent_activity')}</Typography>
            <button onClick={() => navigate('/transactions')} className="p-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-dark-border text-gray-400 hover:text-emerald-600 transition-all active:scale-95 shadow-sm"><ChevronRight size={16} /></button>
          </div>
          <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-800 flex-1 overflow-y-auto max-h-[500px] scrollbar-thin">
            {recentTransactions.map(t_row => {
              const isIncome = t_row.type === TransactionType.INCOME;
              return (
                <div key={t_row.id} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group cursor-pointer" onClick={() => setViewingTransaction(t_row)}>
                   <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={cn("p-2 rounded-lg border shrink-0 transition-transform group-hover:scale-110 shadow-sm", isIncome ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800' : 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30 dark:border-red-800')}>
                          {isIncome ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      </div>
                      <div className="min-w-0 flex-1">
                          <Typography variant="body" className="truncate block group-hover:text-emerald-600 transition-colors font-normal text-sm">{getCategoryLabel(t_row.category)}</Typography>
                          <div className="flex items-center gap-2 mt-0.5 opacity-65"><Typography variant="caption" className="tabular-nums text-[10px]">{formatDateTime(t_row.date, settings.language)}</Typography></div>
                      </div>
                   </div>
                   <div className="text-right shrink-0 ml-3">
                      <Typography variant="body" className={cn("mb-0.5 tabular-nums font-semibold text-xs md:text-sm", isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>{isIncome ? '+' : '-'}{formatCurrency(t_row.amount, t_row.currency, settings.language).split(' ')[0]}</Typography>
                      <Typography variant="caption" className="font-black text-gray-500 dark:text-gray-500 text-[10px] uppercase tracking-tighter">{t_row.currency}</Typography>
                   </div>
                </div>
              );
            })}
            {recentTransactions.length === 0 && (<div className="py-16 text-center opacity-30 italic text-sm flex flex-col items-center justify-center gap-4"><History size={40} strokeWidth={1} /><Typography variant="caption" className="font-black tracking-tighter">{t('no_data')}</Typography></div>)}
          </div>
        </div>

        <div className={cn(CLASSES.card, "flex flex-col h-full bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 rounded-xl md:rounded-xl")}>
           <div className="flex justify-between items-center px-4 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/10">
            <Typography variant="h3" className="text-gray-800 dark:text-gray-200 font-semibold">{t('your_accounts')}</Typography>
            <button onClick={() => navigate('/accounts')} className="p-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-dark-border text-gray-400 hover:text-emerald-600 transition-all active:scale-95 shadow-sm"><Settings2 size={16} /></button>
          </div>
          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[500px] scrollbar-thin">
            {accounts.map(acc => (
                <div key={acc.id} onClick={() => navigate(`/accounts/${acc.id}`)} className="p-3.5 border border-gray-100 dark:border-gray-800 rounded-lg hover:border-emerald-500/50 transition-all cursor-pointer bg-gray-50/20 dark:bg-gray-800/20 group shadow-sm flex items-center gap-3.5">
                    <div className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-400 group-hover:text-emerald-50 group-hover:bg-emerald-600 shadow-sm transition-all border border-gray-100 dark:border-gray-700 shrink-0">{getAccountIcon(acc.type)}</div>
                    <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start mb-0.5">
                            <Typography variant="body" className="group-hover:text-emerald-600 truncate font-semibold text-sm">{acc.name}</Typography>
                            <span className="text-[10px] font-black text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-md">{acc.type}</span>
                        </div>
                        <Typography variant="h3" className="text-emerald-600 dark:text-emerald-400 truncate tabular-nums font-semibold text-xs md:text-sm tracking-tight">{formatCurrency(acc.balance, acc.currency, settings.language)}</Typography>
                    </div>
                </div>
            ))}
            {accounts.length === 0 && (<div className="py-16 text-center opacity-30 italic text-sm flex flex-col items-center justify-center gap-4"><Landmark size={40} strokeWidth={1} /><Typography variant="caption" className="font-black">{t('no_history')}</Typography></div>)}
          </div>
        </div>
      </ResponsiveGrid>

      {viewingTransaction && (
          <div className={CLASSES.modalOverlay}>
              <div className={cn(CLASSES.modalContent, "max-w-xl animate-in zoom-in-95 duration-300 rounded-xl")}>
                  <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-5 md:px-6 shrink-0")}>
                    <Typography variant="h3" className="truncate font-black text-lg">{t('transaction_details')}</Typography>
                    <button onClick={() => setViewingTransaction(null)} className={CLASSES.buttonGhost}><X size={20} /></button>
                  </div>
                  <div className={CLASSES.modalBody}>
                      <div className="w-full text-center py-3 md:py-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 mb-2 shadow-sm">
                          <Typography variant="caption" className="mb-2 opacity-65 block text-xs font-black">{t('transaction_amount')}</Typography>
                          <Typography variant="h1" className={cn("text-lg md:text-xl tabular-nums tracking-tighter normal-case font-semibold leading-none", viewingTransaction.type === TransactionType.INCOME ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                            {viewingTransaction.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(viewingTransaction.amount, viewingTransaction.currency, settings.language)}
                          </Typography>
                          {viewingTransaction.currency !== settings.defaultCurrency && (
                              <Typography variant="caption" className="block mt-2 text-xs font-normal italic opacity-65">{t('estimated_valuation')}: {formatCurrency(convertToDefault(viewingTransaction.amount, viewingTransaction.currency, settings.defaultCurrency, settings.exchangeRates), settings.defaultCurrency, settings.language)}</Typography>
                          )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 sm:gap-y-10 gap-x-8 px-2">
                          <DetailItem icon={Clock} label={t('date')} value={formatDateTime(viewingTransaction.date, settings.language)} />
                          <DetailItem icon={Landmark} label={t('payment_source')} value={accounts.find(a => a.id === viewingTransaction.accountId)?.name || 'Registry'} />
                          <DetailItem icon={Tag} label={t('classification')} value={getCategoryLabel(viewingTransaction.category)} />
                          <DetailItem icon={UserIcon} label={t('authoring_agent')} value={viewingTransaction.createdBy || 'Authorized Agent'} />
                      </div>
                      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                          <Typography variant="caption" className="block mb-2 opacity-65 px-1">{t('note')}</Typography>
                          <div className="w-full p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800 min-h-16 shadow-inner italic opacity-65 text-sm">{viewingTransaction.note || t('no_internal_docs')}</div>
                      </div>
                  </div>
                  <div className={cn(CLASSES.modalFooter, "py-4 px-5")}>
                    <button onClick={() => setViewingTransaction(null)} className={cn(CLASSES.buttonPrimary, "w-full text-xs font-black h-11 rounded-xl shadow-xl shadow-emerald-500/10")}>{t('close')}</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const DetailItem: React.FC<{ icon: React.ElementType, label: string, value: string }> = ({ icon: Icon, label, value }) => (
    <div className="space-y-2 min-w-0 flex flex-col">
        <div className="flex items-center gap-2 mb-0.5">
            <Icon size={14} className="text-emerald-500 shrink-0" /> 
            <Typography variant="caption" className="font-normal opacity-75 truncate">{label}</Typography>
        </div>
        <Typography variant="body" className="truncate font-medium text-sm">{value}</Typography>
    </div>
);
