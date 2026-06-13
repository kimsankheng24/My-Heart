
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store';
import { Currency, Goal, GoalStatus, GoalPriority, TransactionType } from '../types';
import { formatCurrency, formatDate, convertToDefault, cn, CLASSES, getPhnomPenhNowISO } from '../utils';
import { GoalsMenu } from './menus/GoalsMenu';
import { NumericInput } from './NumericInput';
import { Typography } from './Typography';
import { CustomDatePicker } from './CustomDatePicker';
import { ResponsiveGrid } from './ResponsiveGrid';
import { 
    PlusCircle, X, Target, 
    AlertTriangle, Loader2, 
    ChevronDown, AlertCircle, Info, PiggyBank,
    CheckCircle2, History
} from 'lucide-react';

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
                "cursor-pointer transition-colors p-0.5 rounded-full outline-none focus:ring-2 focus:ring-white/20", 
                variant === 'primary' 
                    ? "text-white/60 hover:text-white hover:bg-white/10" 
                    : "text-gray-400 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <Info size={12} />
          </button>
          
          {isOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-3 bg-gray-900/95 backdrop-blur-md text-white rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 z-[100] ring-1 ring-white/10 text-center">
                <Typography variant="caption" className="text-white/90 text-[10px] leading-relaxed font-medium block">
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
    value: string | number;
    subValue?: string;
    tooltip?: string;
}> = ({ title, value, subValue, tooltip }) => {
    return (
        <div className={cn(CLASSES.card, "p-3 rounded-xl md:rounded-xl border shadow-sm flex flex-col justify-center gap-1")}>
            <div className="flex items-center gap-2">
                <Typography variant="caption" className="font-medium text-gray-500 dark:text-gray-400 text-xs md:text-sm">{title}</Typography>
                {tooltip && <TooltipButton tooltip={tooltip} />}
            </div>
            <Typography variant="h2" className="text-base md:text-lg font-semibold tabular-nums tracking-tight leading-none text-gray-900 dark:text-white">
                {value}
            </Typography>
            {subValue && (
                <Typography variant="caption" className="text-xs font-medium opacity-60 block">
                    {subValue}
                </Typography>
            )}
        </div>
    );
};

export const Goals: React.FC = () => {
    const { goals, addGoal, updateGoal, deleteGoal, settings, t, accounts, addTransaction } = useApp();
    
    const [isAddOpen, setAddOpen] = useState(false);
    const [isContributeOpen, setContributeOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [viewingGoal, setViewingGoal] = useState<Goal | null>(null);
    const [contributingGoal, setContributingGoal] = useState<Goal | null>(null);
    
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        targetAmount: '',
        currentAmount: '',
        currency: settings.defaultCurrency as Currency,
        startDate: getPhnomPenhNowISO().split('T')[0],
        endDate: '',
        status: GoalStatus.ACTIVE,
        note: ''
    });

    const [contributeForm, setContributeForm] = useState({
        amount: '',
        date: getPhnomPenhNowISO().split('T')[0],
        accountId: '',
        note: '',
        createTransaction: false
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const [visualViewportHeight, setVisualViewportHeight] = useState(window.innerHeight);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.visualViewport) {
                setVisualViewportHeight(window.visualViewport.height);
                setIsKeyboardOpen(window.visualViewport.height < window.innerHeight * 0.85);
            }
        };
        window.visualViewport?.addEventListener('resize', handleResize);
        return () => window.visualViewport?.removeEventListener('resize', handleResize);
    }, []);

    const filteredGoals = useMemo(() => {
        return [...goals].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    }, [goals]);

    const summary = useMemo(() => {
        let totalSaved = 0;
        let totalRemaining = 0;

        filteredGoals.forEach(g => {
            const saved = convertToDefault(g.currentAmount, g.currency as string, settings.defaultCurrency, settings.exchangeRates);
            const target = convertToDefault(g.targetAmount, g.currency as string, settings.defaultCurrency, settings.exchangeRates);
            
            if (g.status !== GoalStatus.CANCELLED) {
                totalSaved += saved;
                totalRemaining += Math.max(0, target - saved);
            }
        });

        return {
            totalSaved,
            totalRemaining
        };
    }, [filteredGoals, settings]);

    const openAdd = () => {
        setEditingGoal(null);
        setErrors({});
        setFormData({
            name: '',
            targetAmount: '',
            currentAmount: '0',
            currency: settings.defaultCurrency,
            startDate: getPhnomPenhNowISO().split('T')[0],
            endDate: '',
            status: GoalStatus.ACTIVE,
            note: ''
        });
        setAddOpen(true);
    };

    const openEdit = (g: Goal) => {
        setEditingGoal(g);
        setErrors({});
        setFormData({
            name: g.name,
            targetAmount: g.targetAmount.toString(),
            currentAmount: g.currentAmount.toString(),
            currency: g.currency as Currency,
            startDate: g.startDate,
            endDate: g.endDate,
            status: g.status,
            note: g.note || ''
        });
        setAddOpen(true);
    };

    const openContribute = (g: Goal) => {
        setContributingGoal(g);
        setErrors({});
        setContributeForm({
            amount: '',
            date: getPhnomPenhNowISO().split('T')[0],
            accountId: '', 
            note: '',
            createTransaction: false
        });
        setContributeOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = t('error_goal_name');
        
        const target = parseFloat(formData.targetAmount.replace(/,/g, ''));
        if (isNaN(target) || target <= 0) newErrors.targetAmount = t('error_target_amount');
        
        // Use existing current amount logic (defaults to 0 if new, or keeps existing if edit)
        // Since we removed the field, we rely on state.
        const current = parseFloat(formData.currentAmount.replace(/,/g, '')); 
        // Validation for current isn't strictly needed if user can't edit it, but good for safety
        if (isNaN(current) || current < 0) newErrors.currentAmount = t('error_current_amount');

        if (!formData.endDate) newErrors.endDate = t('error_end_date');
        else if (formData.startDate && formData.endDate < formData.startDate) newErrors.endDate = t('error_end_date_invalid');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            return;
        }

        setIsSubmitting(true);
        try {
            await new Promise(r => setTimeout(r, 600));
            
            // Auto status update logic
            let finalStatus = formData.status;
            if (current >= target && finalStatus !== GoalStatus.CANCELLED) {
                finalStatus = GoalStatus.COMPLETED;
            } else if (current > 0 && finalStatus === GoalStatus.ACTIVE) {
                // Keep active/in progress
            }

            const goalData = {
                name: formData.name,
                targetAmount: target,
                currentAmount: current,
                currency: formData.currency,
                startDate: formData.startDate,
                endDate: formData.endDate,
                status: finalStatus,
                note: formData.note,
                priority: GoalPriority.MEDIUM 
            };

            if (editingGoal) {
                updateGoal({ ...editingGoal, ...goalData });
            } else {
                addGoal(goalData);
            }
            setAddOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleContributeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contributingGoal) return;
        setErrors({});
        const newErrors: Record<string, string> = {};

        const amountVal = parseFloat(contributeForm.amount.replace(/,/g, ''));
        if (isNaN(amountVal) || amountVal <= 0) newErrors.amount = t('error_amount_invalid');

        if (contributeForm.createTransaction) {
            if (!contributeForm.accountId) newErrors.accountId = t('error_payment_source');
            
            // Check balance if linking
            const acc = accounts.find(a => a.id === contributeForm.accountId);
            if (acc) {
                // Calculate equivalent amount in account currency for balance check
                let checkAmount = amountVal;
                if (acc.currency !== contributingGoal.currency) {
                    const rateFrom = settings.exchangeRates[contributingGoal.currency as string] || 1;
                    const rateTo = settings.exchangeRates[acc.currency as string] || 1;
                    checkAmount = (amountVal / rateFrom) * rateTo;
                }
                if (checkAmount > acc.balance) newErrors.amount = t('error_insufficient_funds');
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            return;
        }

        setIsSubmitting(true);
        try {
            await new Promise(r => setTimeout(r, 600));

            // 1. Update Goal
            const newCurrent = contributingGoal.currentAmount + amountVal;
            const newStatus = newCurrent >= contributingGoal.targetAmount ? GoalStatus.COMPLETED : contributingGoal.status;

            updateGoal({
                ...contributingGoal,
                currentAmount: newCurrent,
                status: newStatus,
                progressHistory: [
                    ...(contributingGoal.progressHistory || []),
                    {
                        id: Math.random().toString(36).substr(2, 9),
                        date: contributeForm.date,
                        addedAmount: amountVal,
                        newCurrentAmount: newCurrent,
                        note: contributeForm.note
                    }
                ]
            });

            // 2. Create Transaction if requested
            if (contributeForm.createTransaction && contributeForm.accountId) {
                const acc = accounts.find(a => a.id === contributeForm.accountId);
                if (acc) {
                    // Convert goal amount to account currency amount
                    let txAmount = amountVal;
                    if (acc.currency !== contributingGoal.currency) {
                        const rateFrom = settings.exchangeRates[contributingGoal.currency as string] || 1;
                        const rateTo = settings.exchangeRates[acc.currency as string] || 1;
                        txAmount = (amountVal / rateFrom) * rateTo;
                    }

                    addTransaction({
                        type: TransactionType.EXPENSE,
                        category: 'Savings', 
                        accountId: acc.id,
                        amount: txAmount,
                        currency: acc.currency,
                        date: new Date(contributeForm.date).toISOString(),
                        note: `Contribution to ${contributingGoal.name}. ${contributeForm.note}`,
                        goalId: contributingGoal.id
                    });
                }
            }

            setContributeOpen(false);
            setContributingGoal(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getProgressColor = (percent: number, status: GoalStatus) => {
        if (status === GoalStatus.CANCELLED) return 'bg-gray-400';
        if (status === GoalStatus.COMPLETED || percent >= 100) return 'bg-emerald-500';
        if (percent < 30) return 'bg-red-500';
        if (percent < 70) return 'bg-yellow-500';
        return 'bg-blue-500';
    };

    const getDaysRemaining = (endDate: string) => {
        const end = new Date(endDate);
        const today = new Date();
        const diff = end.getTime() - today.getTime();
        const days = Math.ceil(diff / (1000 * 3600 * 24));
        return days;
    };

    return (
        <div className={cn(CLASSES.container, "!px-2 md:!px-4 lg:!px-6 !space-y-4 pb-24")}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Typography variant="h2" className="text-gray-900 dark:text-white text-lg md:text-xl">{t('goals')}</Typography>
                    <Typography variant="caption">{t('milestone_subtitle')}</Typography>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <button 
                        onClick={openAdd}
                        className={cn(CLASSES.buttonPrimary, "h-10 px-4 shadow-sm text-sm font-bold w-full md:w-auto rounded-xl flex items-center gap-2")}
                    >
                        <PlusCircle size={16} /> <span>{t('new_goal')}</span>
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
                <KPICard 
                    title={t('total_saved')} 
                    value={formatCurrency(summary.totalSaved, settings.defaultCurrency, settings.language)}
                    tooltip="Total amount accumulated across all active goals."
                />
                <KPICard 
                    title={t('goal_remaining')} 
                    value={formatCurrency(summary.totalRemaining, settings.defaultCurrency, settings.language)}
                    tooltip="Amount needed to reach all active goal targets."
                />
            </div>

            {/* Goals Grid */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <ResponsiveGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                    {filteredGoals.map(goal => {
                        const percent = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                        const daysLeft = getDaysRemaining(goal.endDate);
                        const isOverdue = daysLeft < 0 && goal.status !== GoalStatus.COMPLETED && goal.status !== GoalStatus.CANCELLED;

                        return (
                            <motion.div 
                                key={goal.id} 
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ 
                                    opacity: 1, 
                                    y: 0,
                                    scale: goal.status === GoalStatus.COMPLETED ? [1, 1.02, 1] : 1,
                                    boxShadow: goal.status === GoalStatus.COMPLETED 
                                        ? "0 0 20px rgba(16, 185, 129, 0.2)" 
                                        : "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                                }}
                                transition={{ 
                                    duration: 0.3,
                                    scale: { duration: 0.5, ease: "easeOut" }
                                }}
                                onClick={() => setViewingGoal(goal)}
                                className={cn(
                                    CLASSES.card, 
                                    "p-3 rounded-xl md:rounded-xl border transition-all cursor-pointer group relative flex flex-col justify-between h-full min-h-[120px]",
                                    goal.status === GoalStatus.COMPLETED ? "border-emerald-500/50 bg-emerald-50/5 dark:bg-emerald-900/5" : "hover:border-emerald-500/50"
                                )}
                            >
                                <div className="flex justify-between items-center mb-1.5">
                                    <div className="min-w-0 pr-2 flex items-center gap-2">
                                        <Typography variant="h3" className="font-bold text-sm truncate">{goal.name}</Typography>
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={goal.status}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="flex items-center gap-1"
                                            >
                                                <span className={cn(
                                                    "text-[9px] font-bold px-1.5 py-px rounded-md border shrink-0 flex items-center gap-1",
                                                    goal.status === GoalStatus.COMPLETED ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                    goal.status === GoalStatus.CANCELLED ? "bg-gray-100 text-gray-500 border-gray-200" :
                                                    goal.status === GoalStatus.PAUSED ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                    "bg-blue-50 text-blue-600 border-blue-100"
                                                )}>
                                                    {goal.status === GoalStatus.COMPLETED && <CheckCircle2 size={10} className="animate-pulse" />}
                                                    {t(goal.status.toLowerCase()) || goal.status}
                                                </span>
                                            </motion.div>
                                        </AnimatePresence>
                                        {isOverdue && (
                                            <span className="text-[9px] font-bold text-red-500 flex items-center gap-1 shrink-0">
                                                <AlertCircle size={10} /> {t('overdue')}
                                            </span>
                                        )}
                                    </div>
                                    <div onClick={e => e.stopPropagation()}>
                                        <GoalsMenu 
                                            onView={() => setViewingGoal(goal)}
                                            onEdit={() => openEdit(goal)}
                                            onDelete={() => { setGoalToDelete(goal.id); setDeleteConfirmOpen(true); }}
                                            isActive={goal.status !== GoalStatus.COMPLETED && goal.status !== GoalStatus.CANCELLED}
                                            onContribute={() => openContribute(goal)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <Typography variant="body" className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-sm">
                                                {formatCurrency(goal.currentAmount, goal.currency as string, settings.language)}
                                            </Typography>
                                        </div>
                                        <div className="text-right flex items-center gap-1.5">
                                            <Typography variant="caption" className="text-[10px] text-gray-400 font-medium">Target</Typography>
                                            <Typography variant="body" className="font-bold text-gray-700 dark:text-gray-300 tabular-nums text-sm">
                                                {formatCurrency(goal.targetAmount, goal.currency as string, settings.language)}
                                            </Typography>
                                        </div>
                                    </div>

                                    <div className="relative h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-100 dark:border-gray-700">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percent}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className={cn("h-full", getProgressColor(percent, goal.status))} 
                                        />
                                    </div>

                                    <div className="flex justify-between items-center text-[9px] font-bold text-gray-400">
                                        <span>{percent.toFixed(1)}% Done</span>
                                        <span>{daysLeft > 0 ? `${daysLeft} ${t('days_left')}` : (goal.status === GoalStatus.COMPLETED ? t('achieved') : t('ended'))}</span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                    {filteredGoals.length === 0 && (
                        <div className="col-span-full py-20 text-center flex flex-col items-center justify-center gap-4 opacity-40">
                            <Target size={48} strokeWidth={1} />
                            <Typography variant="caption" className="text-lg font-bold">{t('no_goals_found')}</Typography>
                        </div>
                    )}
                </ResponsiveGrid>
            </div>

            {/* Add/Edit Modal */}
            {isAddOpen && (
                <div className={cn(CLASSES.modalOverlay, "sm:p-4 p-0")}>
                    <div 
                        style={{ height: window.innerWidth < 640 ? `${visualViewportHeight}px` : undefined }}
                        className={cn(CLASSES.modalContent, "max-w-md sm:h-auto sm:max-h-[90dvh] rounded-none sm:rounded-xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 relative overflow-hidden flex flex-col", isShaking && "animate-shake")}
                    >
                        <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 shrink-0")}>
                            <Typography variant="h2" className="text-base md:text-lg">
                                {editingGoal ? t('amend_goal') : t('establish_goal')}
                            </Typography>
                            <button onClick={() => setAddOpen(false)} className={CLASSES.buttonGhost} disabled={isSubmitting}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className={cn(CLASSES.modalBody, "p-4 md:p-5 space-y-4 flex-1 overflow-y-auto")}>
                                <div className="space-y-1">
                                    <Typography variant="label">{t('goal_form_name')}</Typography>
                                    <input 
                                        required 
                                        disabled={isSubmitting} 
                                        className={cn(CLASSES.input, "h-11 md:h-10 rounded-xl border-2 focus:border-emerald-500", errors.name && CLASSES.inputError)} 
                                        value={formData.name} 
                                        onChange={e => { setFormData({...formData, name: e.target.value}); if(errors.name) setErrors({...errors, name: ''}); }} 
                                        placeholder="e.g. New Toyota" 
                                    />
                                    {errors.name && <Typography variant="caption" className="text-red-500 font-bold px-1 block mt-0.5">{errors.name}</Typography>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <NumericInput 
                                        label={t('goal_form_target')} 
                                        value={formData.targetAmount} 
                                        onChange={v => setFormData({...formData, targetAmount: v})} 
                                        error={errors.targetAmount} 
                                        inputClassName="h-11 md:h-10 rounded-xl border-2 font-bold"
                                        suffix={formData.currency as string}
                                    />
                                    <div className="space-y-1">
                                        <Typography variant="label">{t('currency')}</Typography>
                                        <div className="relative group">
                                            <select 
                                                disabled={isSubmitting}
                                                className={cn(CLASSES.select, "h-11 md:h-10 pr-10 rounded-xl border-2 focus:border-emerald-500 font-bold")} 
                                                value={formData.currency} 
                                                onChange={e => setFormData({ ...formData, currency: e.target.value as Currency })}
                                            >
                                                <option value="" disabled>{t('select_currency')}</option>
                                                {[Currency.USD, Currency.KHR].map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-emerald-500 transition-colors" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <CustomDatePicker 
                                        label={t('start_date')} 
                                        value={formData.startDate} 
                                        onChange={v => setFormData({...formData, startDate: v})} 
                                        inputClassName="h-11 md:h-10 rounded-xl border-2 focus:border-emerald-500 font-medium" 
                                    />
                                    <div className="space-y-1">
                                        <CustomDatePicker 
                                            label={t('goal_target_date')} 
                                            value={formData.endDate} 
                                            onChange={v => setFormData({...formData, endDate: v})} 
                                            error={errors.endDate} 
                                            placeholder={t('select_date')}
                                            inputClassName="h-11 md:h-10 rounded-xl border-2 focus:border-emerald-500 font-medium" 
                                        />
                                    </div>
                                </div>

                                {/* Note - Full Width */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center px-1">
                                        <Typography variant="label" className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('notes')}</Typography>
                                        <Typography variant="caption" className={cn("text-xs font-medium transition-colors", formData.note.length > 100 ? "text-orange-500" : "text-gray-400")}>
                                            {formData.note.length} / 120
                                        </Typography>
                                    </div>
                                    <textarea 
                                        maxLength={120}
                                        className={cn(CLASSES.input, "h-24 py-3 resize-none rounded-xl border-2 text-sm focus:border-emerald-500 transition-all font-normal leading-relaxed")} 
                                        value={formData.note} 
                                        onChange={e => setFormData({...formData, note: e.target.value})} 
                                        placeholder={t('add_details_placeholder')} 
                                    />
                                </div>
                            </div>
                            <div className={cn(
                                "border-t border-gray-100 dark:border-gray-800 z-30 shrink-0",
                                "flex flex-row items-center gap-3 bg-white dark:bg-[#161b22]",
                                "transition-all duration-300 ease-in-out px-4 md:px-5",
                                isKeyboardOpen ? "py-2" : "py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
                            )}>
                                <button type="button" disabled={isSubmitting} onClick={() => setAddOpen(false)} className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-10 border-2 font-bold rounded-xl")}>{t('cancel')}</button>
                                <button type="submit" disabled={isSubmitting} className={cn(CLASSES.buttonPrimary, "flex-1 h-11 md:h-10 font-bold rounded-xl")}>
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : t('goal_save_action')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Contribute Modal */}
            {isContributeOpen && contributingGoal && (
                <div className={cn(CLASSES.modalOverlay, "sm:p-4 p-0")}>
                    <div 
                        style={{ height: window.innerWidth < 640 ? `${visualViewportHeight}px` : undefined }}
                        className={cn(CLASSES.modalContent, "max-w-md sm:h-auto sm:max-h-[90dvh] rounded-none sm:rounded-xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 relative overflow-hidden flex flex-col", isShaking && "animate-shake")}
                    >
                        <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 shrink-0")}>
                            <Typography variant="h2" className="text-base md:text-lg">{t('contribute_funds')}</Typography>
                            <button onClick={() => setContributeOpen(false)} className={CLASSES.buttonGhost} disabled={isSubmitting}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleContributeSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className={cn(CLASSES.modalBody, "p-4 md:p-5 space-y-4 flex-1 overflow-y-auto")}>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50 mb-2">
                                    <Typography variant="caption" className="text-emerald-600 dark:text-emerald-400 font-bold block mb-1">Target: {contributingGoal.name}</Typography>
                                    <div className="flex justify-between items-end">
                                        <Typography variant="h2" className="text-lg font-black text-emerald-700 dark:text-emerald-300 tabular-nums">{formatCurrency(contributingGoal.currentAmount, contributingGoal.currency as string, settings.language)}</Typography>
                                        <Typography variant="caption" className="text-xs font-semibold opacity-60">of {formatCurrency(contributingGoal.targetAmount, contributingGoal.currency as string, settings.language)}</Typography>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <NumericInput 
                                        label={t('contribution_amount')} 
                                        required 
                                        value={contributeForm.amount} 
                                        onChange={v => setContributeForm({...contributeForm, amount: v})} 
                                        error={errors.amount} 
                                        inputClassName="h-11 md:h-10 rounded-xl border-2 font-bold text-lg"
                                        suffix={contributingGoal.currency as string}
                                        placeholder="0.00"
                                    />
                                </div>

                                <CustomDatePicker 
                                    label={t('date')} 
                                    required 
                                    value={contributeForm.date} 
                                    onChange={v => setContributeForm({...contributeForm, date: v})} 
                                    inputClassName="h-11 md:h-10 rounded-xl border-2 font-medium" 
                                />

                                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-3 mb-3">
                                        <button 
                                            type="button" 
                                            onClick={() => setContributeForm({...contributeForm, createTransaction: !contributeForm.createTransaction})}
                                            className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0", contributeForm.createTransaction ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300 bg-white dark:bg-gray-800")}
                                        >
                                            {contributeForm.createTransaction && <CheckCircle2 size={14} strokeWidth={3} />}
                                        </button>
                                        <Typography variant="body" className="text-sm font-bold text-gray-700 dark:text-gray-300" onClick={() => setContributeForm({...contributeForm, createTransaction: !contributeForm.createTransaction})}>
                                            {t('record_as_transaction')}
                                        </Typography>
                                    </div>

                                    {contributeForm.createTransaction && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                            <div className="space-y-1">
                                                <Typography variant="label" className="text-xs">{t('payment_source_required')}</Typography>
                                                <div className="relative group">
                                                    <select 
                                                        required 
                                                        className={cn(CLASSES.select, "h-10 rounded-lg border-2 text-sm pr-8", errors.accountId && CLASSES.inputError)} 
                                                        value={contributeForm.accountId} 
                                                        onChange={e => setContributeForm({ ...contributeForm, accountId: e.target.value })}
                                                    >
                                                        <option value="">{t('select_account')}</option>
                                                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>)}
                                                    </select>
                                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                </div>
                                                {errors.accountId && <Typography variant="caption" className="text-red-500 font-bold px-1 block mt-0.5">{errors.accountId}</Typography>}
                                            </div>
                                            <div className="flex gap-2 items-start p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                                <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                                                <Typography variant="caption" className="text-blue-600 dark:text-blue-400 text-[10px] leading-tight">
                                                    {t('contribution_info')}
                                                </Typography>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between items-center px-1">
                                        <Typography variant="label">{t('note')}</Typography>
                                        <Typography variant="caption" className={cn("text-xs font-medium transition-colors", contributeForm.note.length > 100 ? "text-orange-500" : "text-gray-400")}>
                                            {contributeForm.note.length} / 120
                                        </Typography>
                                    </div>
                                    <textarea 
                                        maxLength={120}
                                        className={cn(CLASSES.input, "h-16 py-2 resize-none rounded-xl border-2 text-xs focus:border-emerald-500 transition-all font-normal leading-relaxed")} 
                                        value={contributeForm.note} 
                                        onChange={e => setContributeForm({...contributeForm, note: e.target.value})} 
                                        placeholder={t('add_details')} 
                                    />
                                </div>
                            </div>
                            <div className={cn(
                                "border-t border-gray-100 dark:border-gray-800 z-30 shrink-0",
                                "flex flex-row items-center gap-3 bg-white dark:bg-[#161b22]",
                                "transition-all duration-300 ease-in-out px-4 md:px-5",
                                isKeyboardOpen ? "py-2" : "py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
                            )}>
                                <button type="button" disabled={isSubmitting} onClick={() => setContributeOpen(false)} className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-10 border-2 font-bold rounded-xl")}>{t('cancel')}</button>
                                <button type="submit" disabled={isSubmitting} className={cn(CLASSES.buttonPrimary, "flex-1 h-11 md:h-10 font-bold rounded-xl")}>
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : t('confirm')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {viewingGoal && (
                <div className={CLASSES.modalOverlay}>
                    <div className={cn(CLASSES.modalContent, "max-w-md animate-in zoom-in-95 duration-300 rounded-xl")}>
                        <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 shrink-0")}>
                            <Typography variant="h2" className="text-base md:text-lg font-bold truncate pr-4">{viewingGoal.name}</Typography>
                            <button onClick={() => setViewingGoal(null)} className={CLASSES.buttonGhost}><X size={18}/></button>
                        </div>
                        <div className={cn(CLASSES.modalBody, "p-4 md:p-5 space-y-4")}>
                            <div className="w-full text-center py-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 shadow-inner relative overflow-hidden">
                                <div className="relative z-10">
                                    <Typography variant="caption" className="mb-1 opacity-60 block text-[10px] font-bold text-gray-500">{t('progress')}</Typography>
                                    <div className="flex items-center justify-center gap-1">
                                        <Typography variant="h1" className="text-xl md:text-2xl tabular-nums font-black text-emerald-600 dark:text-emerald-400">
                                            {((viewingGoal.currentAmount / viewingGoal.targetAmount) * 100).toFixed(1)}%
                                        </Typography>
                                    </div>
                                    <Typography variant="caption" className="block mt-1 font-medium opacity-60 text-xs">
                                        {formatCurrency(viewingGoal.currentAmount, viewingGoal.currency as string, settings.language)} of {formatCurrency(viewingGoal.targetAmount, viewingGoal.currency as string, settings.language)}
                                    </Typography>
                                </div>
                                {/* Background progress bar effect */}
                                <div 
                                    className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-1000" 
                                    style={{ width: `${(viewingGoal.currentAmount / viewingGoal.targetAmount) * 100}%` }} 
                                />
                            </div>

                            {(() => {
                                const remaining = viewingGoal.targetAmount - viewingGoal.currentAmount;
                                const end = new Date(viewingGoal.endDate);
                                const today = new Date();
                                const diffTime = end.getTime() - today.getTime();
                                const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                const isActive = viewingGoal.status !== GoalStatus.COMPLETED && viewingGoal.status !== GoalStatus.CANCELLED;
                                
                                if (isActive && remaining > 0 && daysDiff > 0) {
                                    const months = Math.ceil(daysDiff / 30.44);
                                    const monthlySave = remaining / months;
                                    const endDateStr = end.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
                                    
                                    return (
                                        <div className="p-3.5 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
                                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shrink-0 mt-0.5">
                                                <PiggyBank size={16} />
                                            </div>
                                            <div className="space-y-1">
                                                <Typography variant="caption" className="text-blue-700 dark:text-blue-300 font-medium text-xs leading-relaxed block">
                                                    {t('you_need_to_save')} <span className="font-bold text-blue-800 dark:text-blue-200">{formatCurrency(monthlySave, viewingGoal.currency as string, settings.language)}</span> {t('per_month')}
                                                </Typography>
                                                <Typography variant="caption" className="text-blue-500 dark:text-blue-400/60 text-[10px] font-medium block">
                                                    {t('savings_end')} {endDateStr}
                                                </Typography>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-dark-card shadow-sm">
                                    <Typography variant="caption" className="text-[10px] font-bold text-gray-400 block mb-0.5">{t('start_date')}</Typography>
                                    <Typography variant="body" className="font-semibold text-sm tabular-nums">{formatDate(viewingGoal.startDate, settings.language)}</Typography>
                                </div>
                                <div className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-dark-card shadow-sm">
                                    <Typography variant="caption" className="text-[10px] font-bold text-gray-400 block mb-0.5">{t('goal_target_date')}</Typography>
                                    <Typography variant="body" className="font-semibold text-sm tabular-nums">{formatDate(viewingGoal.endDate, settings.language)}</Typography>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Typography variant="label" className="text-[10px] font-bold text-gray-400 px-1">{t('description')}</Typography>
                                <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800 min-h-[60px] italic text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {viewingGoal.note || t('no_internal_docs')}
                                </div>
                            </div>

                            {/* History Section */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between px-1">
                                    <Typography variant="label" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <History size={10} /> {t('history')}
                                    </Typography>
                                </div>
                                <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                                     {viewingGoal.progressHistory && viewingGoal.progressHistory.length > 0 ? (
                                        <div className="max-h-[160px] overflow-y-auto scrollbar-thin">
                                            {[...viewingGoal.progressHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item) => (
                                                <div key={item.id} className="flex justify-between items-center p-3 border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                    <div className="min-w-0 pr-2">
                                                        <Typography variant="caption" className="font-bold text-gray-700 dark:text-gray-300 block text-xs">
                                                            {formatDate(item.date, settings.language)}
                                                        </Typography>
                                                        {item.note && (
                                                            <Typography variant="caption" className="text-[10px] text-gray-400 italic truncate block max-w-[180px]">
                                                                {item.note}
                                                            </Typography>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <Typography variant="body" className="font-bold text-emerald-600 dark:text-emerald-400 text-xs tabular-nums">
                                                            +{formatCurrency(item.addedAmount, viewingGoal.currency as string, settings.language)}
                                                        </Typography>
                                                        <Typography variant="caption" className="text-[9px] text-gray-400 block tabular-nums">
                                                            {t('available_balance_label')}: {formatCurrency(item.newCurrentAmount, viewingGoal.currency as string, settings.language)}
                                                        </Typography>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                     ) : (
                                        <div className="py-6 text-center flex flex-col items-center justify-center gap-2 opacity-40">
                                            <History size={24} strokeWidth={1} />
                                            <Typography variant="caption" className="text-xs">{t('no_contributions')}</Typography>
                                        </div>
                                     )}
                                </div>
                            </div>
                        </div>
                        <div className={cn(CLASSES.modalFooter, "py-3 px-5 bg-gray-50 dark:bg-gray-800/20")}>
                            <button onClick={() => setViewingGoal(null)} className={cn(CLASSES.buttonPrimary, "w-full h-10 font-bold rounded-xl shadow-lg shadow-emerald-500/10 text-sm")}>{t('close_details')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {isDeleteConfirmOpen && (
                <div className={CLASSES.modalOverlay}>
                    <div className={cn(CLASSES.modalContent, "max-w-md animate-in zoom-in-95 duration-300 rounded-xl")}>
                        <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 shrink-0 justify-center")}>
                            <Typography variant="h2" className="text-base md:text-lg font-semibold">{t('confirm_removal')}</Typography>
                        </div>
                        <div className={cn(CLASSES.modalBody, "p-6 text-center space-y-6")}>
                            <Typography variant="body" className="font-medium text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                {t('delete_multiple_confirm').replace('{{count}}', 'this goal')} {t('action_cannot_be_undone')}
                            </Typography>
                        </div>
                        <div className={cn(CLASSES.modalFooter, "flex-row items-center gap-3 py-2 md:py-2.5 px-4 md:px-5 bg-gray-50 dark:bg-gray-800/20")}>
                            <button onClick={() => setDeleteConfirmOpen(false)} className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-10 border-2 font-bold rounded-xl")}>{t('cancel')}</button>
                            <button onClick={() => { if(goalToDelete) deleteGoal(goalToDelete); setDeleteConfirmOpen(false); }} className={cn(CLASSES.buttonDanger, "flex-1 h-11 md:h-10 font-bold rounded-xl")}>{t('delete')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
