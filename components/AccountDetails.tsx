
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useApp } from '../store';
import { TransactionType, Currency, Transaction, AccountType } from '../types';
import { formatCurrency, formatDate, formatDateTime, cn, CLASSES, convertToDefault, computeTermDepositFinancials } from '../utils';
import { ArrowLeft, Landmark, X, Clock, Tag, User as UserIcon, Wallet, PiggyBank, Calendar } from 'lucide-react';
import { Typography } from './Typography';
import { CustomDatePicker } from './CustomDatePicker';
import { ResponsiveGrid } from './ResponsiveGrid';

// Standardized Premium Table classes - text-sm font-semibold / text-sm font-normal
const premiumTh = cn(CLASSES.typography.tableHeader, "px-3 py-2.5 align-middle bg-[#f9fafb] dark:bg-gray-800 border-b border-[#e5e7eb] dark:border-dark-border whitespace-nowrap text-sm font-semibold");
const premiumTd = cn(CLASSES.typography.body, "px-3 py-2.5 align-middle border-b border-[#f3f4f6] dark:border-dark-border/50 text-sm font-normal");

export const AccountDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { accounts, transactions, settings, chartOfAccounts, t } = useApp();
    
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);

    const account = accounts.find(a => a.id === id);

    if (!account) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <Landmark size={64} className="text-gray-400" />
                </div>
                <div className="text-center">
                    <Typography variant="h2" className="mb-1">{t('account_not_found')}</Typography>
                    <Typography variant="body" className="opacity-60 mb-6">{t('account_not_found_desc')}</Typography>
                </div>
                <button onClick={() => navigate('/accounts')} className={cn(CLASSES.buttonPrimary, "px-8 font-semibold rounded-xl")}>
                    {t('back_to_accounts')}
                </button>
            </div>
        );
    }

    const getCategoryLabel = (categoryName: string) => {
        if (categoryName === 'Transfer Out') return t('transfer_out');
        if (categoryName === 'Transfer In') return t('transfer_in');
        const coa = chartOfAccounts.find(c => c.name === categoryName);
        if (!coa) return categoryName;
        const name = settings.language === 'km' && coa.localName ? coa.localName : coa.name;
        return `${coa.code} - ${name}`;
    };

    const accountTransactions = transactions.filter(t_row => {
        const isAccountMatch = t_row.accountId === id;
        const isMonthMatch = t_row.date.startsWith(selectedMonth);
        const coa = chartOfAccounts.find(c => c.name === t_row.category);
        const glCode = coa ? coa.code : '';
        const glName = settings.language === 'km' && coa?.localName ? coa.localName : (coa?.name || t_row.category);
        const searchTarget = `${glCode} ${glName}`.toLowerCase();
        const isSearchMatch = searchTarget.includes(searchTerm.toLowerCase()) || 
                              (t_row.note && t_row.note.toLowerCase().includes(searchTerm.toLowerCase()));
        return isAccountMatch && isMonthMatch && isSearchMatch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const monthDate = new Date(selectedMonth + '-01');
    const monthName = monthDate.toLocaleDateString(settings.language === 'km' ? 'km-KH' : 'en-US', { month: 'long' });
    const sectionTitle = t('transactions_for', { month: monthName });

    return (
        <div className={cn(CLASSES.container, "!px-2 md:!px-4 lg:!px-6 !space-y-4 pb-24")}>
            {/* Context Header Area */}
            <div className="sticky top-[-16px] lg:top-[-32px] z-40 bg-[#f3f4f6]/95 dark:bg-dark-bg/95 backdrop-blur-md py-2 mb-4 -mx-4 px-4 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10 border-b border-gray-200/50 dark:border-dark-border/50 transition-all duration-200 shadow-sm no-print">
                <div className="flex items-center gap-4 w-full">
                    <button 
                        onClick={() => navigate('/accounts')} 
                        // Rule: Rounded-xl for Button
                        className="p-2 md:p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-all active:scale-95 shadow-sm shrink-0"
                        title={t('back_to_accounts')}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 md:gap-3">
                            <Typography variant="h1" className="truncate text-lg md:text-2xl font-black">
                                {account.name}
                            </Typography>
                            {/* Rule: Rounded-xl for Badge */}
                            <span className="text-[9px] md:text-[10px] font-black px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-800 shrink-0 uppercase tracking-widest shadow-sm">
                                {account.currency}
                            </span>
                        </div>
                        <Typography variant="caption" className="font-bold text-gray-400 truncate block mt-0.5 text-[10px] md:text-xs">
                            {t(account.type.toLowerCase().replace(/\s+/g, '_')) || account.type} • {account.note || t('account_book')}
                        </Typography>
                    </div>
                </div>
            </div>

            {/* Conditional Rendering: Term Deposit Dashboard vs Standard Account KPI */}
            {account.type === AccountType.TERM_DEPOSIT || account.termDeposit ? (() => {
                const termDeposit = account.termDeposit || {
                    depositAmount: account.balance,
                    termMonths: 12,
                    interestRate: 7.25,
                    startDate: new Date().toISOString().slice(0, 10),
                    maturityDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
                    taxRate: 6
                };

                const financials = computeTermDepositFinancials(
                    termDeposit.depositAmount || account.balance,
                    termDeposit.interestRate || 7.25,
                    termDeposit.termMonths || 12,
                    termDeposit.taxRate || 6
                );

                const startMs = new Date(termDeposit.startDate).getTime();
                const maturityMs = new Date(termDeposit.maturityDate).getTime();
                const nowMs = new Date().getTime();
                const totalPeriodMs = Math.max(1, maturityMs - startMs);
                const elapsedMs = Math.max(0, Math.min(totalPeriodMs, nowMs - startMs));
                const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalPeriodMs) * 100)));
                const isMatured = nowMs >= maturityMs;
                const daysRemaining = Math.max(0, Math.ceil((maturityMs - nowMs) / (1000 * 60 * 60 * 24)));

                return (
                    <div className="w-full space-y-4 mb-4">
                        {/* 1. A large, prominent deposit balance */}
                        <div className="bg-gradient-to-br from-[#10B981] via-[#059669] to-[#047857] p-6 sm:p-7 rounded-2xl text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
                            <div className="absolute -top-24 -right-24 w-56 h-56 bg-white rounded-full mix-blend-overlay opacity-15 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
                            <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-emerald-950 rounded-full mix-blend-overlay opacity-25 blur-2xl pointer-events-none" />

                            <div className="relative z-10 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-emerald-100 text-xs sm:text-sm font-semibold tracking-wide uppercase flex items-center gap-2">
                                        <PiggyBank size={18} />
                                        {t('deposit_balance', 'Deposit Balance')}
                                    </span>
                                    <span className="text-xs font-black px-2.5 py-1 bg-white/20 backdrop-blur-md text-white rounded-xl uppercase tracking-wider shadow-sm">
                                        {account.currency}
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight tabular-nums text-white my-1 leading-tight">
                                    {formatCurrency(account.balance, account.currency, settings.language)}
                                </div>
                                <div className="flex items-center gap-2 text-emerald-100/90 text-xs font-medium">
                                    <span>{account.owner || 'Kimsan'}</span>
                                    <span>•</span>
                                    <span>{account.name}</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. A horizontal progress indicator showing the deposit period & Start Date and Maturity Date */}
                        <div className="bg-white dark:bg-dark-card rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-dark-border space-y-3.5">
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Clock size={15} className="text-emerald-500" />
                                    {t('deposit_period', 'Deposit Period')}
                                </span>
                                <span className={cn(
                                    "px-2.5 py-1 rounded-full text-[11px] font-bold tabular-nums border",
                                    isMatured
                                        ? "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                        : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800"
                                )}>
                                    {isMatured ? t('matured', 'Matured') : `${progressPercent}% • ${daysRemaining} ${t('days_left', 'days left')}`}
                                </span>
                            </div>

                            {/* Horizontal Progress Bar */}
                            <div className="w-full h-3.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5 border border-gray-200/60 dark:border-gray-700">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-700 shadow-sm"
                                    style={{ width: `${Math.max(2, progressPercent)}%` }}
                                />
                            </div>

                            {/* Start Date and Maturity Date */}
                            <div className="flex items-center justify-between pt-1 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-400 border border-gray-100 dark:border-gray-700">
                                        <Calendar size={14} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-400 font-semibold block uppercase">{t('start_date', 'Start Date')}</span>
                                        <span className="font-bold text-gray-800 dark:text-gray-200 tabular-nums">
                                            {formatDate(termDeposit.startDate, settings.language)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-right">
                                    <div>
                                        <span className="text-[10px] text-gray-400 font-semibold block uppercase">{t('maturity_date', 'Maturity Date')}</span>
                                        <span className="font-bold text-gray-800 dark:text-gray-200 tabular-nums">
                                            {formatDate(termDeposit.maturityDate, settings.language)}
                                        </span>
                                    </div>
                                    <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 border border-emerald-100 dark:border-emerald-800">
                                        <Calendar size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. A rounded white information-card section containing: Deposit Term & Interest Rate */}
                        <div className="bg-white dark:bg-dark-card rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-dark-border">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-2">
                                        {t('deposit_term', 'Deposit Term')}:
                                    </span>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tabular-nums">
                                            {termDeposit.termMonths}
                                        </span>
                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                            [ {t('months', 'Months')} ]
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-2">
                                        {t('interest_rate', 'Interest Rate')}:
                                    </span>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                            [ {termDeposit.interestRate}% ]
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. A lower summary section showing: Deposit Amount, Total Interest, Tax, Net Interest, Total Principal & Interest */}
                        <div className="bg-white dark:bg-dark-card rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-dark-border space-y-3.5">
                            <div className="flex justify-between items-center text-sm py-1.5 border-b border-gray-100 dark:border-gray-800">
                                <span className="font-semibold text-gray-600 dark:text-gray-300">{t('deposit_amount', 'Deposit Amount')}:</span>
                                <span className="font-bold tabular-nums text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                                    {formatCurrency(financials.depositAmount, account.currency, settings.language)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm py-1.5 border-b border-gray-100 dark:border-gray-800">
                                <span className="font-semibold text-gray-600 dark:text-gray-300">{t('total_interest', 'Total Interest')}:</span>
                                <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                                    +{formatCurrency(financials.totalInterest, account.currency, settings.language)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm py-1.5 border-b border-gray-100 dark:border-gray-800">
                                <span className="font-semibold text-gray-600 dark:text-gray-300">{t('tax_on_interest', 'Tax on Interest (6%)')}:</span>
                                <span className="font-bold tabular-nums text-red-500 dark:text-red-400 text-sm sm:text-base">
                                    -{formatCurrency(financials.taxOnInterest, account.currency, settings.language)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm py-1.5 border-b border-gray-100 dark:border-gray-800">
                                <span className="font-semibold text-gray-600 dark:text-gray-300">{t('net_interest_after_tax', 'Net Interest After Tax')}:</span>
                                <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                                    +{formatCurrency(financials.netInterest, account.currency, settings.language)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t-2 border-emerald-500/20 text-gray-900 dark:text-gray-50">
                                <span className="font-extrabold text-sm sm:text-base text-gray-800 dark:text-gray-100 uppercase tracking-tight">
                                    {t('total_principal_and_interest', 'Total Principal & Interest')}:
                                </span>
                                <span className="font-black text-lg sm:text-2xl text-emerald-600 dark:text-emerald-400 tabular-nums">
                                    {formatCurrency(financials.totalPrincipalAndInterest, account.currency, settings.language)}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })() : (
                <div className="w-full mb-4">
                    <div className="bg-[#10B981] p-5 sm:p-6 rounded-xl text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden group flex flex-col justify-between">
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white rounded-full mix-blend-overlay opacity-10 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-900 rounded-full mix-blend-overlay opacity-20 blur-2xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col gap-5">
                            <div>
                                <Typography variant="caption" className="text-emerald-100 dark:text-emerald-100 font-medium mb-1 block">
                                    {t('available_balance_label')}
                                </Typography>
                                <Typography variant="h1" className="text-white text-lg md:text-xl font-semibold tracking-tight tabular-nums leading-none">
                                    {formatCurrency(account.balance, account.currency, settings.language)}
                                </Typography>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Activity Registry Section - Rule: Rounded-lg for Table/List Container */}
            <div className={cn(CLASSES.card, "flex flex-col border-gray-200 dark:border-dark-border overflow-hidden min-h-[500px] h-[60vh] bg-white dark:bg-dark-card rounded-lg md:rounded-lg")}>
                {/* Refined Header: Title and Month Picker in two columns */}
                <div className="flex flex-row items-center justify-between py-3 px-4 md:px-5 border-b border-gray-100 dark:border-gray-800">
                    <Typography variant="h3" className="font-semibold text-gray-900 dark:text-gray-100 text-sm md:text-lg tracking-tight truncate mr-2">
                        {sectionTitle}
                    </Typography>
                    <div className="shrink-0">
                        {/* Rule: Rounded-md for Input inside DatePicker */}
                        <CustomDatePicker
                            type="month"
                            value={selectedMonth}
                            onChange={setSelectedMonth}
                            inputClassName="h-9 w-auto min-w-[120px] text-xs font-normal bg-gray-50 dark:bg-gray-800 border-transparent text-right focus:ring-0 cursor-pointer text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-md"
                            className="w-auto"
                            iconSize={14}
                        />
                    </div>
                </div>

                {/* Unified Data View */}
                <div className="flex-1 overflow-auto scrollbar-thin">
                    
                    {/* Mobile Card List View */}
                    <div className="md:hidden">
                        {accountTransactions.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-dark-border">
                                {accountTransactions.map((t_row, idx) => {
                                    const isIncome = t_row.type === TransactionType.INCOME;
                                    return (
                                        <div 
                                            key={t_row.id} 
                                            onClick={() => setViewingTransaction(t_row)} 
                                            className="p-3 active:bg-gray-50 dark:active:bg-gray-800 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-500"
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex flex-col gap-0.5 min-w-0 pr-4">
                                                    <span className="text-sm font-normal text-gray-800 dark:text-gray-200 truncate block">{getCategoryLabel(t_row.category)}</span>
                                                    <span className="text-[10px] text-gray-400 font-medium">{formatDateTime(t_row.date, settings.language)}</span>
                                                </div>
                                                <div className="flex flex-col items-end gap-0.5 shrink-0">
                                                    {/* Rule: List Item Amount -> text-xs md:text-sm font-medium */}
                                                    <span className={cn("text-xs md:text-sm font-medium tabular-nums", isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                                                        {isIncome ? '+' : '-'}{formatCurrency(t_row.amount, t_row.currency, settings.language)}
                                                    </span>
                                                </div>
                                            </div>
                                            {t_row.note && (
                                                <div className="mt-1 pl-2 border-l-2 border-gray-100 dark:border-gray-700 text-[10px] text-gray-500 dark:text-gray-400 italic truncate max-w-full">
                                                    {t_row.note}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center opacity-30">
                                <Wallet size={48} strokeWidth={1} />
                                <Typography variant="caption" className="font-black tracking-widest mt-4">{t('no_registries')}</Typography>
                            </div>
                        )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block w-full overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-0 table-fixed min-w-[900px]">
                            <thead className="sticky top-0 z-10">
                                <tr>
                                    <th className={cn(premiumTh, "w-40 md:w-44 pl-4")}>{t('date')}</th>
                                    <th className={cn(premiumTh, "w-auto")}>{t('gl_classification')}</th>
                                    <th className={cn(premiumTh, "text-right w-36 md:w-44")}>{t('original_amount')}</th>
                                    <th className={cn(premiumTh, "w-48 md:w-64")}>{t('notes')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                {accountTransactions.length > 0 ? (
                                    accountTransactions.map((t_row, idx) => {
                                        const isIncome = t_row.type === TransactionType.INCOME;
                                        const isNotDefault = t_row.currency !== settings.defaultCurrency;
                                        const convertedAmt = convertToDefault(t_row.amount, t_row.currency, settings.defaultCurrency, settings.exchangeRates);
                                        return (
                                            <tr 
                                                key={t_row.id} 
                                                onClick={() => setViewingTransaction(t_row)}
                                                className="hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10 transition-colors group cursor-pointer animate-in fade-in duration-300"
                                                style={{ animationDelay: `${idx * 20}ms` }}
                                            >
                                                <td className={cn(premiumTd, "pl-4")}>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-800 dark:text-gray-200 tabular-nums leading-tight">{formatDate(t_row.date, settings.language)}</span>
                                                        <span className="text-xs text-gray-400 opacity-60">
                                                            {new Date(t_row.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className={premiumTd}>
                                                    <span className="group-hover:text-emerald-600 transition-colors truncate font-semibold block">{getCategoryLabel(t_row.category)}</span>
                                                </td>
                                                <td className={cn(premiumTd, "text-right")}>
                                                    <div className="flex flex-col items-end">
                                                        {/* Rule: Table Cell -> text-sm md:text-base font-medium */}
                                                        <span className={cn("text-sm md:text-base font-medium tabular-nums", isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                                                            {isIncome ? '+' : '-'}{formatCurrency(t_row.amount, t_row.currency, settings.language).split(' ')[0]}
                                                            <span className="text-xs ml-1 opacity-40">{t_row.currency}</span>
                                                        </span>
                                                        {isNotDefault && (
                                                            <span className={cn("italic opacity-65 text-xs mt-0.5 leading-none", isIncome ? "text-emerald-600/80 dark:text-emerald-400/80" : "text-red-600/80 dark:text-red-400/80")}>
                                                                ≈ {formatCurrency(convertedAmt, settings.defaultCurrency, settings.language)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className={premiumTd}>
                                                    <span className="truncate block opacity-50 italic text-xs max-w-full">{t_row.note || '—'}</span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="h-64 text-center opacity-30 italic">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <Wallet size={48} strokeWidth={1} />
                                                <Typography variant="caption" className="font-black">{t('no_registries')}</Typography>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            {viewingTransaction && (
                <div className={CLASSES.modalOverlay}>
                    {/* Rule: Rounded-xl for Modal */}
                    <div className={cn(CLASSES.modalContent, "max-w-xl animate-in zoom-in-95 duration-300 rounded-xl")}>
                        <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 shrink-0")}>
                            <Typography variant="h3" className="truncate font-black text-base md:text-lg">{t('transaction_details')}</Typography>
                            <button onClick={() => setViewingTransaction(null)} className={CLASSES.buttonGhost}><X size={20} /></button>
                        </div>

                        <div className={CLASSES.modalBody}>
                            {/* Rule: Rounded-xl for inner cards */}
                            <div className="w-full text-center py-3 md:py-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 mb-2 shadow-sm">
                                <Typography variant="caption" className="font-black text-gray-400 mb-2 opacity-60 text-xs block">{t('transaction_amount')}</Typography>
                                {/* Rule: Summary Card Amount -> text-lg md:text-xl font-semibold */}
                                <Typography variant="h1" className={cn("text-lg md:text-xl tabular-nums tracking-tight normal-case font-semibold leading-none", viewingTransaction.type === TransactionType.INCOME ? "text-emerald-600" : "text-red-600")}>
                                    {viewingTransaction.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(viewingTransaction.amount, viewingTransaction.currency, settings.language)}
                                </Typography>
                                {viewingTransaction.currency !== settings.defaultCurrency && (
                                    /* Rule: Tiny footnotes -> text-xs font-normal */
                                    <Typography variant="caption" className="font-normal text-gray-400 mt-2 italic block opacity-50 text-xs">
                                        {t('estimated_valuation')}: {formatCurrency(convertToDefault(viewingTransaction.amount, viewingTransaction.currency, settings.defaultCurrency, settings.exchangeRates), settings.defaultCurrency, settings.language)}
                                    </Typography>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 sm:gap-y-10 gap-x-8 px-2">
                                <DetailItem icon={Clock} label={t('date')} value={formatDateTime(viewingTransaction.date, settings.language)} />
                                <DetailItem icon={Landmark} label={t('payment_source')} value={account.name} />
                                <DetailItem icon={Tag} label={t('classification')} value={getCategoryLabel(viewingTransaction.category)} />
                                <DetailItem icon={UserIcon} label={t('authoring_agent')} value={viewingTransaction.createdBy || t('automated_system')} />
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                                <Typography variant="caption" className="block mb-2 opacity-60 px-1">{t('note')}</Typography>
                                {/* Rule: Rounded-xl for inner container */}
                                <div className="w-full p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800 min-h-16 shadow-inner italic opacity-65 text-sm">
                                    {viewingTransaction.note || t('no_internal_docs')}
                                </div>
                            </div>
                        </div>

                        <div className={cn(CLASSES.modalFooter, "flex-row items-center gap-3 py-2 md:py-2.5 px-4 md:px-5 bg-gray-50 dark:bg-gray-800/20")}>
                            {/* Rule: Rounded-xl for Button */}
                            <button onClick={() => setViewingTransaction(null)} className={cn(CLASSES.buttonPrimary, "flex-1 h-11 md:h-10 text-xs font-black rounded-xl")}>{t('close')}</button>
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
        <Typography variant="body" className="font-medium truncate text-sm">{value}</Typography>
    </div>
);
