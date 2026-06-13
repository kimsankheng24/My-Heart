
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../store';
import { TransactionType, Currency, ChartOfAccount } from '../types';
import { convertToDefault, formatCurrency, cn, CLASSES, getPhnomPenhNowISO, formatDate } from '../utils';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, Rectangle
} from 'recharts';
import { Typography } from './Typography';
import { CustomDatePicker } from './CustomDatePicker';
import { Download, TrendingUp, TrendingDown, Calendar, ChevronDown, Info } from 'lucide-react';
import * as XLSX from 'xlsx';

// Tooltip Component
const CustomTooltip = ({ active, payload, label, currency, lang, t, activeTab }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-[#161b22] p-4 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl z-50 min-w-[200px]">
                <p className="font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-100 dark:border-gray-800 text-sm">{label}</p>
                {payload.map((p: any) => (
                    <div key={p.name} className="flex items-center justify-between gap-4 text-xs font-semibold mb-2 last:mb-0">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="text-gray-600 dark:text-gray-300 capitalize">{t(p.name.toLowerCase()) || p.name}</span>
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

const TooltipButton: React.FC<{ tooltip: string }> = ({ tooltip }) => {
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
      <div className="relative inline-flex items-center justify-center shrink-0 z-50 ml-1.5" ref={ref}>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
            className="cursor-pointer text-gray-400 hover:text-emerald-500 transition-colors p-0.5 rounded-full outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <Info size={12} />
          </button>
          
          {isOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 md:w-80 p-3 bg-gray-900/95 backdrop-blur-md text-white rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 z-[100] ring-1 ring-white/10 text-left">
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
    value: string;
    color: 'emerald' | 'red' | 'blue' | 'purple';
    tooltip?: string;
}> = ({ title, value, color, tooltip }) => {
    const colorClasses = {
        emerald: 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400',
        red: 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-800/50 text-red-700 dark:text-red-400',
        blue: 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/50 text-blue-700 dark:text-blue-400',
        purple: 'bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800/50 text-purple-700 dark:text-purple-400'
    };

    const titleColors = {
        emerald: 'text-emerald-600 dark:text-emerald-400',
        red: 'text-red-600 dark:text-red-400',
        blue: 'text-blue-600 dark:text-blue-400',
        purple: 'text-purple-600 dark:text-purple-400'
    };

    return (
        <div className={cn(CLASSES.card, "p-3 rounded-xl md:rounded-xl border shadow-sm flex flex-col justify-center", colorClasses[color])}>
            <div className="flex items-center mb-0.5">
                <Typography variant="caption" className={cn("font-medium text-xs md:text-sm block", titleColors[color])}>
                    {title}
                </Typography>
                {tooltip && <TooltipButton tooltip={tooltip} />}
            </div>
            <Typography variant="h2" className="text-base md:text-lg font-semibold tabular-nums tracking-tight leading-none">
                {value}
            </Typography>
        </div>
    );
};

export const Analytics: React.FC = () => {
    const { transactions, budgets, settings, t, chartOfAccounts, accounts } = useApp();
    const [activeTab, setActiveTab] = useState<'Statistics' | 'Budget' | 'Breakdown'>('Statistics');
    const [breakdownType, setBreakdownType] = useState<TransactionType>(TransactionType.EXPENSE);
    
    // Date State with Phnom Penh Time defaults (This Year)
    const [startDate, setStartDate] = useState(() => {
        const nowISO = getPhnomPenhNowISO();
        const year = parseInt(nowISO.split('-')[0]);
        return `${year}-01-01`;
    });
    const [endDate, setEndDate] = useState(() => {
        const nowISO = getPhnomPenhNowISO();
        const year = parseInt(nowISO.split('-')[0]);
        return `${year}-12-31`;
    });

    const [activePreset, setActivePreset] = useState('This Year');
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
    const dateFilterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dateFilterRef.current && !dateFilterRef.current.contains(event.target as Node)) {
                setIsDateFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const applyPreset = (preset: string) => {
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

        switch(preset) {
            case 'Today':
                start = todayStr;
                end = todayStr;
                break;
            case 'Yesterday':
                const yest = new Date(curr);
                yest.setDate(curr.getDate() - 1);
                start = toISO(yest);
                end = toISO(yest);
                break;
            case 'This Week':
                const dayOfWeek = curr.getDay(); // 0 is Sun
                // Adjust to Monday start
                const dist = (dayOfWeek + 6) % 7;
                const monday = new Date(curr);
                monday.setDate(curr.getDate() - dist);
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                start = toISO(monday);
                end = toISO(sunday);
                break;
            case 'Last Week':
                const dayOfWeekLast = curr.getDay();
                const distLast = (dayOfWeekLast + 6) % 7;
                const prevMonday = new Date(curr);
                prevMonday.setDate(curr.getDate() - distLast - 7);
                const prevSunday = new Date(prevMonday);
                prevSunday.setDate(prevMonday.getDate() + 6);
                start = toISO(prevMonday);
                end = toISO(prevSunday);
                break;
            case 'This Month':
                start = `${year}-${String(month).padStart(2, '0')}-01`;
                const lastDayThis = new Date(year, month, 0).getDate();
                end = `${year}-${String(month).padStart(2, '0')}-${lastDayThis}`;
                break;
            case 'Last Month':
                let m = month - 1;
                let y = year;
                if (m === 0) { m = 12; y--; }
                start = `${y}-${String(m).padStart(2, '0')}-01`;
                const lastDayLast = new Date(y, m, 0).getDate();
                end = `${y}-${String(m).padStart(2, '0')}-${lastDayLast}`;
                break;
            case 'This Year':
                start = `${year}-01-01`;
                end = `${year}-12-31`;
                break;
            case 'Last Year':
                start = `${year - 1}-01-01`;
                end = `${year - 1}-12-31`;
                break;
        }
        
        if (start && end) {
            setStartDate(start);
            setEndDate(end);
            setActivePreset(preset);
        }
    };

    const getFilterLabel = () => {
        if (activePreset !== 'Custom') return t(activePreset.toLowerCase().replace(' ', '_')) || activePreset;
        return `${formatDate(startDate, settings.language)} - ${formatDate(endDate, settings.language)}`;
    };

    const presets = [
        'Today', 'This Week', 'This Month', 'This Year',
        'Yesterday', 'Last Week', 'Last Month', 'Last Year'
    ];

    // Helper to get month name
    const getMonthName = (monthIndex: number) => {
        const date = new Date();
        date.setMonth(monthIndex);
        return date.toLocaleDateString(settings.language === 'km' ? 'km-KH' : 'en-US', { month: 'short' });
    };

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const d = tx.date.split('T')[0];
            return d >= startDate && d <= endDate && !tx.isInternalTransfer;
        });
    }, [transactions, startDate, endDate]);

    // Data Processing for Statistics (Income vs Expense)
    const chartData = useMemo(() => {
        const data = Array.from({ length: 12 }, (_, i) => ({
            name: getMonthName(i),
            monthIndex: i,
            income: 0,
            expense: 0,
            netIncome: 0,
        }));

        filteredTransactions.forEach(tx => {
            const date = new Date(tx.date);
            const month = date.getMonth();
            const val = convertToDefault(tx.amount, tx.currency, settings.defaultCurrency, settings.exchangeRates);
            
            if (tx.type === TransactionType.INCOME) {
                data[month].income += val;
            } else {
                data[month].expense += val;
            }
        });

        data.forEach(d => {
            d.netIncome = d.income - d.expense;
        });

        return data;
    }, [filteredTransactions, settings, startDate, endDate]);

    // Data Processing for Budget Chart (Planned vs Spent)
    const budgetChartData = useMemo(() => {
        const data = Array.from({ length: 12 }, (_, i) => ({
            name: getMonthName(i),
            planned: 0,
            spent: 0,
        }));

        const year = new Date(startDate).getFullYear();

        // Fill Spent based on Expenses in the filtered range that match the year
        filteredTransactions.forEach(tx => {
            if (tx.type === TransactionType.EXPENSE) {
                const date = new Date(tx.date);
                if (date.getFullYear() === year) {
                    const month = date.getMonth();
                    const val = convertToDefault(tx.amount, tx.currency, settings.defaultCurrency, settings.exchangeRates);
                    data[month].spent += val;
                }
            }
        });

        // Fill Planned based on Budgets for the matching year
        budgets.forEach(b => {
            if (b.month) {
                const [mStr, yStr] = b.month.split('/');
                const bYear = parseInt(yStr);
                const bMonth = parseInt(mStr) - 1;
                
                if (bYear === year && !isNaN(bMonth) && bMonth >= 0 && bMonth <= 11) {
                    const val = convertToDefault(b.amount, b.currency as string, settings.defaultCurrency, settings.exchangeRates);
                    data[bMonth].planned += val;
                }
            }
        });

        return data;
    }, [filteredTransactions, budgets, settings, startDate]);

    // Breakdown Data
    const breakdownData = useMemo(() => {
        const map: Record<string, number> = {};
        const coaMap = new Map<string, ChartOfAccount>(chartOfAccounts.map(c => [c.name, c]));

        filteredTransactions
            .filter(t => t.type === breakdownType)
            .forEach(tx => {
                const val = convertToDefault(tx.amount, tx.currency, settings.defaultCurrency, settings.exchangeRates);
                
                // Resolve full category label including G/L code
                const coa = coaMap.get(tx.category);
                let label = tx.category;
                if (coa) {
                    const name = settings.language === 'km' && coa.localName ? coa.localName : coa.name;
                    label = `${coa.code} - ${name}`;
                }

                map[label] = (map[label] || 0) + val;
            });
        
        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredTransactions, settings, chartOfAccounts, breakdownType]);

    // Account Breakdown Data
    const accountBreakdownData = useMemo(() => {
        const map: Record<string, number> = {};
        const accountMap = new Map(accounts.map(a => [a.id, a.name]));

        filteredTransactions
            .filter(t => t.type === breakdownType)
            .forEach(tx => {
                const val = convertToDefault(tx.amount, tx.currency, settings.defaultCurrency, settings.exchangeRates);
                const accountName = accountMap.get(tx.accountId) || t('unknown_account');
                map[accountName] = (map[accountName] || 0) + val;
            });

        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredTransactions, settings, accounts, breakdownType, t]);

    // Top Transactions
    const topTransactions = useMemo(() => {
        return [...filteredTransactions]
            .filter(t => t.type === breakdownType)
            .map(tx => ({
                ...tx,
                defaultVal: convertToDefault(tx.amount, tx.currency, settings.defaultCurrency, settings.exchangeRates)
            }))
            .sort((a, b) => b.defaultVal - a.defaultVal)
            .slice(0, 5);
    }, [filteredTransactions, settings, breakdownType]);

    // Metrics Calculation for Breakdown Tab
    const breakdownMetrics = useMemo(() => {
        const totalVal = breakdownData.reduce((acc, item) => acc + item.value, 0);
        // Average Monthly = Total / 12 (assuming annual view context)
        const avgMonthly = totalVal / 12;
        
        // Find highest month from chartData
        const highestMonth = [...chartData].sort((a, b) => 
            breakdownType === TransactionType.INCOME ? b.income - a.income : b.expense - a.expense
        )[0];
        
        const topCategory = breakdownData.length > 0 ? breakdownData[0] : { name: '—', value: 0 };

        return {
            avgMonthly,
            highestMonth,
            topCategory,
            totalVal
        };
    }, [chartData, breakdownData, breakdownType]);

    // Summary Cards Calculations
    const totalIncome = chartData.reduce((acc, curr) => acc + curr.income, 0);
    const totalExpense = chartData.reduce((acc, curr) => acc + curr.expense, 0);
    const netIncome = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    const handleExport = () => {
        let dataToExport: any[] = [];
        if (activeTab === 'Breakdown') {
            dataToExport = breakdownData.map(item => ({
                [t('category')]: item.name,
                [t('amount')]: item.value,
                [t('currency')]: settings.defaultCurrency
            }));
        } else if (activeTab === 'Budget') {
            dataToExport = budgetChartData.map(b => ({
                [t('month')]: b.name,
                [t('planned')]: b.planned,
                [t('spent')]: b.spent,
                [t('variance')]: b.planned - b.spent
            }));
        } else {
            dataToExport = chartData.map(item => ({
                [t('month')]: item.name,
                [t('income')]: item.income,
                [t('expense')]: item.expense,
                [t('net_savings')]: item.netIncome
            }));
        }

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Analytics");
        XLSX.writeFile(wb, `MyHeart_Analytics_${activeTab}.xlsx`);
    };

    const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

    return (
        <div className={cn(CLASSES.container, "!px-2 md:!px-4 lg:!px-6 !space-y-4 pb-24")}>
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Typography variant="h2" className="text-gray-900 dark:text-white text-lg md:text-xl">{t('analytics')}</Typography>
                    <Typography variant="caption">{t('financial_insights')}</Typography>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {activeTab === 'Breakdown' && (
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-1 flex">
                            <button
                                onClick={() => setBreakdownType(TransactionType.EXPENSE)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                                    breakdownType === TransactionType.EXPENSE ? "bg-white dark:bg-gray-700 text-red-600 shadow-sm" : "text-gray-500"
                                )}
                            >
                                {t('expense')}
                            </button>
                            <button
                                onClick={() => setBreakdownType(TransactionType.INCOME)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                                    breakdownType === TransactionType.INCOME ? "bg-white dark:bg-gray-700 text-emerald-600 shadow-sm" : "text-gray-500"
                                )}
                            >
                                {t('income')}
                            </button>
                        </div>
                    )}
                    <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-gray-700 p-1 flex">
                        {(['Statistics', 'Budget', 'Breakdown'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-3 py-1.5 text-sm font-bold rounded-lg transition-all",
                                    activeTab === tab ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                                )}
                            >
                                {t(tab.toLowerCase()) || tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard 
                    title={t('total_income')} 
                    value={formatCurrency(totalIncome, settings.defaultCurrency, settings.language)} 
                    color="emerald"
                    tooltip={t('total_income_tooltip')} 
                />
                <KPICard 
                    title={t('total_expenses')} 
                    value={formatCurrency(totalExpense, settings.defaultCurrency, settings.language)} 
                    color="red"
                    tooltip={t('total_expenses_tooltip')} 
                />
                <KPICard 
                    title={t('net_savings')} 
                    value={formatCurrency(netIncome, settings.defaultCurrency, settings.language)} 
                    color="blue"
                    tooltip={t('net_savings_tooltip')} 
                />
                <KPICard 
                    title={t('savings_rate')} 
                    value={`${savingsRate.toFixed(1)}%`} 
                    color="purple" 
                    tooltip={t('savings_rate_tooltip')} 
                />
            </div>

            {/* Controls Row - Refined Single Row Layout */}
            <div className="flex flex-row justify-end items-center gap-2 mb-4 z-30 relative no-print">
                <button 
                    onClick={handleExport} 
                    className={cn(CLASSES.buttonSecondary, "h-10 w-10 p-0 flex items-center justify-center rounded-xl shadow-sm shrink-0")} 
                    title="Export"
                >
                    <Download size={18} />
                </button>

                <div className="relative flex-1 sm:flex-none" ref={dateFilterRef}>
                    <button 
                        onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                        className="flex items-center gap-2 px-3 h-10 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-200 hover:border-emerald-500 transition-all shadow-sm focus:ring-4 focus:ring-emerald-500/10 w-full sm:min-w-[200px] justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-emerald-500 shrink-0" />
                            <span className="truncate">{getFilterLabel()}</span>
                        </div>
                        <ChevronDown size={12} className={cn("text-gray-400 transition-all duration-300", isDateFilterOpen && "rotate-180")} />
                    </button>
                    
                    {isDateFilterOpen && (
                        <div className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] max-w-[480px] sm:w-[480px] bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-[60] p-4 animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5">
                            {/* 4x2 Grid for Presets */}
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                {presets.map(preset => (
                                    <button
                                        key={preset}
                                        onClick={() => applyPreset(preset)}
                                        className={cn(
                                            "px-2 py-2.5 rounded-lg text-[10px] font-normal transition-all text-center border normal-case truncate",
                                            activePreset === preset
                                                ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20 font-bold"
                                                : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        )}
                                    >
                                        {t(preset.toLowerCase().replace(' ', '_')) || preset}
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex items-center justify-between px-1">
                                    <Typography variant="caption" className="tracking-widest font-bold text-[10px] opacity-50">{t('custom_range')}</Typography>
                                    {activePreset === 'Custom' && (
                                        <button onClick={() => applyPreset('This Year')} className="text-[10px] font-bold text-emerald-600 hover:underline">{t('reset_filter')}</button>
                                    )}
                                </div>
                                {/* 2x2 Grid Layout for Fields (2 columns) */}
                                <div className="grid grid-cols-2 gap-3">
                                    <CustomDatePicker label={t('from_date')} value={startDate} onChange={v => { setStartDate(v); setActivePreset('Custom'); }} inputClassName="text-[0.8rem] h-10 font-normal rounded-md" iconSize={14} />
                                    <CustomDatePicker label={t('to_date')} value={endDate} onChange={v => { setEndDate(v); setActivePreset('Custom'); }} inputClassName="text-[0.8rem] h-10 font-normal rounded-md" iconSize={14} />
                                </div>
                                <button onClick={() => setIsDateFilterOpen(false)} className={cn(CLASSES.buttonPrimary, "w-full h-11 font-bold text-xs rounded-xl md:rounded-xl shadow-lg shadow-emerald-500/10")}>{t('apply_filter')}</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area - New Layouts */}
            <div className="animate-in fade-in duration-500">
                {activeTab === 'Statistics' && (
                    <div className={cn(CLASSES.card, "p-5 md:p-6 dark:border-gray-700")}>
                        <div className="mb-6 flex flex-col gap-1">
                            <Typography variant="h3" className="font-bold text-gray-800 dark:text-gray-200 text-lg">{t('financial_overview')}</Typography>
                            <Typography variant="caption" className="text-gray-500">{t('income_vs_expense_sub')}</Typography>
                        </div>
                        
                        <div className="w-full overflow-x-auto scrollbar-thin pb-2">
                            <div className="min-w-[800px] h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barGap={0}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.4} />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 600 }} 
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#9CA3AF', fontSize: 11 }} 
                                            tickFormatter={(val) => new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(val)}
                                        />
                                        <Tooltip content={<CustomTooltip currency={settings.defaultCurrency} lang={settings.language} t={t} />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '24px', fontSize: '12px', fontWeight: 600 }} formatter={(val) => t(val.toLowerCase()) || val} />
                                        <Bar 
                                            dataKey="income" 
                                            name="Income" 
                                            fill="#10B981" 
                                            radius={[4, 4, 0, 0]} 
                                            barSize={32}
                                        />
                                        <Bar 
                                            dataKey="expense" 
                                            name="Expense" 
                                            fill="#EF4444" 
                                            radius={[4, 4, 0, 0]} 
                                            barSize={32}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Budget' && (
                    <div className={cn(CLASSES.card, "p-5 md:p-6 dark:border-gray-700")}>
                        <div className="mb-6 flex flex-col gap-1">
                            <Typography variant="h3" className="font-bold text-gray-800 dark:text-gray-200 text-lg">{t('budget_performance')}</Typography>
                            <Typography variant="caption" className="text-gray-500">{t('planned_vs_actual')}</Typography>
                        </div>

                        <div className="w-full overflow-x-auto scrollbar-thin pb-2">
                            <div className="min-w-[800px] h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={budgetChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barGap={0}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.4} />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 600 }} 
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#9CA3AF', fontSize: 11 }} 
                                            tickFormatter={(val) => new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(val)}
                                        />
                                        <Tooltip content={<CustomTooltip currency={settings.defaultCurrency} lang={settings.language} t={t} />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '24px', fontSize: '12px', fontWeight: 600 }} formatter={(val) => t(val.toLowerCase()) || val} />
                                        <Bar 
                                            dataKey="planned" 
                                            name="Planned" 
                                            fill="#9CA3AF" 
                                            radius={[4, 4, 0, 0]} 
                                            barSize={32}
                                        />
                                        <Bar 
                                            dataKey="spent" 
                                            name="Spent" 
                                            fill="#F59E0B" 
                                            radius={[4, 4, 0, 0]} 
                                            barSize={32}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Breakdown' && (
                    <div className="space-y-6">
                        {/* Main Chart Card */}
                        <div className={cn(CLASSES.card, "p-5 md:p-6 bg-white dark:bg-dark-card dark:border-gray-700")}>
                            <div className="mb-6">
                                <Typography variant="h3" className="font-bold text-gray-800 dark:text-gray-200">
                                    {breakdownType === TransactionType.INCOME ? t('income_sources') : t('spending_by_category')}
                                </Typography>
                                <Typography variant="caption" className="text-gray-500">
                                    {breakdownType === TransactionType.INCOME ? t('income_breakdown') : t('expense_breakdown')}
                                </Typography>
                            </div>

                            <div className="flex flex-col lg:flex-row items-center gap-8">
                                {/* Donut Chart */}
                                <div className="w-full lg:w-1/2 h-[300px] md:h-[350px] flex items-center justify-center relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={breakdownData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={110}
                                                paddingAngle={4}
                                                dataKey="value"
                                                cornerRadius={6}
                                            >
                                                {breakdownData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip currency={settings.defaultCurrency} lang={settings.language} t={t} />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Center Text for Donut */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <Typography variant="caption" className="font-bold opacity-65 text-sm mb-2">{t('total')}</Typography>
                                        <Typography variant="h3" className="font-black tabular-nums text-lg md:text-xl">{formatCurrency(breakdownMetrics.totalVal, settings.defaultCurrency, settings.language)}</Typography>
                                    </div>
                                </div>

                                {/* List View */}
                                <div className="w-full lg:w-1/2 flex-1 max-h-[400px] overflow-y-auto scrollbar-thin pr-2">
                                    <div className="space-y-3">
                                        {breakdownData.map((item, index) => (
                                            <div key={item.name} className="flex items-center justify-between p-3 rounded-xl md:rouned-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-colors group">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-2 h-8 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                    <div className="min-w-0">
                                                        <Typography variant="body" className="font-medium text-xs md:text-sm truncate block">{item.name}</Typography>
                                                        <div className="flex items-center gap-1.5 opacity-60">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                                            <Typography variant="caption" className="text-[10px] font-medium">{breakdownMetrics.totalVal > 0 ? ((item.value / breakdownMetrics.totalVal) * 100).toFixed(1) : 0}%</Typography>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <Typography variant="body" className="font-medium text-xs md:text-sm tabular-nums text-gray-900 dark:text-gray-100">
                                                        {formatCurrency(item.value, settings.defaultCurrency, settings.language)}
                                                    </Typography>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Breakdown Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Account Distribution */}
                            <div className={cn(CLASSES.card, "p-5 md:p-6 bg-white dark:bg-dark-card dark:border-gray-700")}>
                                <div className="mb-6">
                                    <Typography variant="h3" className="font-bold text-gray-800 dark:text-gray-200">{t('account_distribution')}</Typography>
                                    <Typography variant="caption" className="text-gray-500">{t('top_accounts')}</Typography>
                                </div>
                                <div className="space-y-4">
                                    {accountBreakdownData.map((item, index) => (
                                        <div key={item.name} className="space-y-1.5">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                                                <span className="text-gray-900 dark:text-gray-100">{formatCurrency(item.value, settings.defaultCurrency, settings.language)}</span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={cn("h-full rounded-full transition-all duration-1000", breakdownType === TransactionType.INCOME ? "bg-emerald-500" : "bg-red-500")}
                                                    style={{ width: `${(item.value / breakdownMetrics.totalVal) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {accountBreakdownData.length === 0 && (
                                        <div className="py-8 text-center opacity-50">
                                            <Typography variant="caption">{t('no_data')}</Typography>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Top Transactions */}
                            <div className={cn(CLASSES.card, "p-5 md:p-6 bg-white dark:bg-dark-card dark:border-gray-700")}>
                                <div className="mb-6">
                                    <Typography variant="h3" className="font-bold text-gray-800 dark:text-gray-200">{t('top_transactions')}</Typography>
                                    <Typography variant="caption" className="text-gray-500">{t('recent_activity')}</Typography>
                                </div>
                                <div className="space-y-3">
                                    {topTransactions.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                                    tx.type === TransactionType.INCOME ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : "bg-red-100 text-red-600 dark:bg-red-900/30"
                                                )}>
                                                    {tx.type === TransactionType.INCOME ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                                </div>
                                                <div>
                                                    <Typography variant="body" className="font-bold text-xs md:text-sm">{tx.category}</Typography>
                                                    <Typography variant="caption" className="text-[10px]">{formatDate(tx.date, settings.language)}</Typography>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Typography variant="body" className={cn(
                                                    "font-bold text-xs md:text-sm tabular-nums",
                                                    tx.type === TransactionType.INCOME ? "text-emerald-600" : "text-red-600"
                                                )}>
                                                    {formatCurrency(tx.amount, tx.currency, settings.language)}
                                                </Typography>
                                                <Typography variant="caption" className="text-[10px] opacity-50">
                                                    ≈ {formatCurrency(tx.defaultVal, settings.defaultCurrency, settings.language)}
                                                </Typography>
                                            </div>
                                        </div>
                                    ))}
                                    {topTransactions.length === 0 && (
                                        <div className="py-8 text-center opacity-50">
                                            <Typography variant="caption">{t('no_data')}</Typography>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
