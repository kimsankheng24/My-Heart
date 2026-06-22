
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../store';
import { formatCurrency, convertToDefault, cn, CLASSES, getPhnomPenhNowISO, formatDate } from '../utils';
import { BudgetsMenu } from './menus/BudgetsMenu';
import { 
    X, AlertTriangle, Loader2, Calendar, Trash2, CheckCircle2, ChevronDown, PiggyBank, ChevronRight, FileSpreadsheet, Download, Upload, Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Currency, Budget, TransactionType, BudgetTemplate, ChartOfAccount } from '../types';
import { NumericInput } from './NumericInput';
import { Typography } from './Typography';
import { CustomDatePicker } from './CustomDatePicker';
import { useLocation, useNavigate } from 'react-router-dom';
import { ResponsiveGrid } from './ResponsiveGrid';

// Premium Table classes refined for high-density budget overview - Standardized typography scale
const premiumTh = cn(CLASSES.typography.tableHeader, "px-3 py-2 align-middle bg-[#f9fafb] dark:bg-gray-800/80 border-b border-[#e5e7eb] dark:border-gray-700 first:rounded-tl-2xl last:rounded-tr-2xl whitespace-nowrap text-sm font-semibold");
const premiumTd = cn(CLASSES.typography.body, "px-3 py-1 align-middle border-b border-[#f3f4f6] dark:border-gray-700/50 text-sm font-normal");

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
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-[300px] p-3 bg-gray-900/95 backdrop-blur-md text-white rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 z-[100] ring-1 ring-white/10 text-center">
                <Typography variant="caption" className="text-white text-[13px] leading-relaxed font-medium block whitespace-normal text-left">
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
    lang: string;
    color: 'emerald' | 'red' | 'gray';
}> = ({ title, amount, currency, lang, color }) => {
    const colorClasses = {
        emerald: 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400',
        red: 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400',
        gray: 'bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
    };

    const titleColors = {
        emerald: 'text-emerald-600 dark:text-emerald-400',
        red: 'text-red-600 dark:text-red-400',
        gray: 'text-gray-500'
    };

    return (
        <div className={cn(CLASSES.card, "p-3 rounded-xl md:rounded-xl border shadow-sm flex flex-col justify-center gap-0.5", colorClasses[color])}>
            <Typography variant="caption" className={cn("font-medium text-xs md:text-sm block truncate", titleColors[color])}>
                {title}
            </Typography>
            <Typography variant="h2" className="text-base md:text-lg font-semibold tabular-nums tracking-tight leading-none">
                {formatCurrency(amount, currency, lang)}
            </Typography>
        </div>
    );
};

// Reusable Category Select Component with Tree Structure
const CategorySelect: React.FC<{
    value: string;
    onChange: (value: string) => void;
    accounts: any[];
    t: (key: string) => string;
    error?: string;
    disabled?: boolean;
    language: string;
}> = ({ value, onChange, accounts, t, error, disabled, language }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Filter only Expense accounts
    const expenseAccounts = useMemo(() => accounts.filter(c => c.type === 'Expense'), [accounts]);

    // Initialize expanded state to show the selected item
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
        const initial = new Set<string>();
        if (value) {
            let current = expenseAccounts.find(a => a.name === value);
            while (current && current.isSubOf) {
                initial.add(current.isSubOf);
                current = expenseAccounts.find(a => a.id === current?.isSubOf);
            }
        }
        return initial;
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const treeItems = useMemo(() => {
        const childrenMap = new Map<string, any[]>();
        const roots: any[] = [];

        // Build hierarchy
        expenseAccounts.forEach(c => {
            if (c.isSubOf && expenseAccounts.some(p => p.id === c.isSubOf)) {
                const list = childrenMap.get(c.isSubOf) || [];
                list.push(c);
                childrenMap.set(c.isSubOf, list);
            } else {
                roots.push(c);
            }
        });

        const flatten = (nodes: any[], depth: number): Array<any & { depth: number, hasChildren: boolean }> => {
            return nodes.sort((a, b) => a.code.localeCompare(b.code)).flatMap(node => {
                const children = childrenMap.get(node.id) || [];
                const hasChildren = children.length > 0;
                const isExpanded = expandedIds.has(node.id);
                
                const item = { ...node, depth, hasChildren };
                
                if (hasChildren && isExpanded) {
                    return [item, ...flatten(children, depth + 1)];
                }
                return [item];
            });
        };

        return flatten(roots, 0);
    }, [expenseAccounts, expandedIds]);

    const selectedAccount = expenseAccounts.find(a => a.name === value);

    const toggleExpand = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const getDisplayName = (account: any) => {
        const name = language === 'km' && account.localName ? account.localName : account.name;
        return `${account.code}-${name}`;
    };

    return (
        <div className="relative group" ref={containerRef}>
            <div 
                className={cn(
                    CLASSES.select, 
                    "h-11 md:h-10 rounded-md border-2 flex items-center justify-between cursor-pointer bg-white dark:bg-dark-card pr-10", 
                    isOpen && "ring-8 ring-emerald-500/5 border-emerald-500",
                    error && CLASSES.inputError,
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={cn("block truncate text-sm", !value && "text-gray-500")}>
                    {selectedAccount ? getDisplayName(selectedAccount) : t('select_category')}
                </span>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {isOpen && !disabled && (
                <div className={cn(
                    "bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200",
                    "fixed inset-0 z-[60] flex flex-col rounded-none border-0",
                    "sm:absolute sm:inset-auto sm:top-full sm:left-0 sm:z-50 sm:w-full sm:mt-1 sm:rounded-xl sm:max-h-60 sm:border sm:flex sm:flex-col"
                )}>
                    <div className="flex sm:hidden items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 shrink-0 bg-white dark:bg-[#1c2128]">
                        <Typography variant="h3" className="font-bold text-lg">{t('select_category')}</Typography>
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} 
                            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto sm:overflow-auto p-2 sm:p-0">
                        <div 
                            className={cn("px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors", value === "" && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600")}
                            onClick={() => { onChange(""); setIsOpen(false); }}
                        >
                            {t('select_category')}
                        </div>
                        {treeItems.map(item => (
                            <div 
                                key={item.id}
                                className={cn(
                                    "px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center",
                                    value === item.name && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 font-medium"
                                )}
                                style={{ paddingLeft: `${(item.depth * 16) + 12}px` }}
                                onClick={() => { onChange(item.name); setIsOpen(false); }}
                            >
                                {item.hasChildren ? (
                                    <button
                                        type="button"
                                        onClick={(e) => toggleExpand(e, item.id)}
                                        className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 mr-1.5 text-gray-500 transition-colors shrink-0"
                                    >
                                        {expandedIds.has(item.id) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                    </button>
                                ) : (
                                    <span className="w-4 mr-1.5 inline-block shrink-0" />
                                )}
                                <span className="truncate">{getDisplayName(item)}</span>
                                {value === item.name && <CheckCircle2 size={14} className="ml-auto text-emerald-600 shrink-0" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const CustomSelect: React.FC<{
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    disabled?: boolean;
    error?: boolean;
    t: (key: string) => string;
}> = ({ value, onChange, options, placeholder, disabled, error, t }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="relative group" ref={containerRef}>
            <div 
                className={cn(
                    CLASSES.select, 
                    "h-11 md:h-10 rounded-md border-2 flex items-center justify-between cursor-pointer bg-white dark:bg-dark-card pr-10", 
                    isOpen && "ring-8 ring-emerald-500/5 border-emerald-500",
                    error && CLASSES.inputError,
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={cn("block truncate text-sm", !value && "text-gray-500")}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {isOpen && !disabled && (
                <div className={cn(
                    "bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200",
                    "fixed inset-0 z-[60] flex flex-col rounded-none border-0",
                    "sm:absolute sm:inset-auto sm:top-full sm:left-0 sm:z-50 sm:w-full sm:mt-1 sm:rounded-xl sm:max-h-60 sm:border sm:flex sm:flex-col"
                )}>
                    <div className="flex sm:hidden items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 shrink-0 bg-white dark:bg-[#1c2128]">
                        <Typography variant="h3" className="font-bold text-lg">{placeholder}</Typography>
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} 
                            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto sm:overflow-auto p-2 sm:p-0">
                        {options.map(option => (
                            <div 
                                key={option.value}
                                className={cn(
                                    "px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between",
                                    value === option.value && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 font-medium"
                                )}
                                onClick={() => { onChange(option.value); setIsOpen(false); }}
                            >
                                <span className="truncate">{option.label}</span>
                                {value === option.value && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

interface TreeNode {
    id: string;
    coa?: ChartOfAccount;
    budgets: any[];
    children: TreeNode[];
    aggAmount: number;
    aggSpent: number;
    aggRemaining: number;
    aggProgress: number;
    aggPerformanceStatus: string;
    aggColor: string;
    aggCurrency?: string;
}

interface FlatRow {
    id: string;
    type: 'coa' | 'budget';
    level: number;
    isExpanded: boolean;
    hasChildren: boolean;
    month: string;
    glCode: string;
    glName: string;
    amount: number;
    spent: number;
    remaining: number;
    progress: number;
    performanceStatus: string;
    color: string;
    currency: string;
    budget?: any;
}

export const Budgets: React.FC = () => {
    const { 
        budgets = [], 
        transactions = [], 
        budgetTemplates = [], 
        addBudget, 
        addBudgets, 
        updateBudget, 
        deleteBudget, 
        addBudgetTemplate, 
        updateBudgetTemplate,
        deleteBudgetTemplate, 
        settings, 
        chartOfAccounts = [], 
        can, 
        t
    } = useApp();
    const location = useLocation();
    const navigate = useNavigate();
    
    // View State
    const [activeTab, setActiveTab] = useState<'Budgets' | 'Templates'>('Budgets');
    const [isAddOpen, setAddOpen] = useState(false);
    
    // Edit/Action State
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<BudgetTemplate | null>(null);
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [isTemplateDeleteConfirmOpen, setIsTemplateDeleteConfirmOpen] = useState(false);
    const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

    // Form State
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [visualViewportHeight, setVisualViewportHeight] = useState(window.innerHeight);
    const [formMode, setFormMode] = useState<'budget' | 'template'>('budget');

    // Menu State
    const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
    const newMenuRef = useRef<HTMLDivElement>(null);

    // Import/Export State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importResults, setImportResults] = useState<{
        success: number;
        failed: number;
        errors: string[];
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter State - Initialized with Phnom Penh Time
    const [selectedMonth, setSelectedMonth] = useState(() => {
        return getPhnomPenhNowISO().slice(0, 7);
    });

    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const [formData, setFormData] = useState<{
        name: string;
        category: string;
        amount: string;
        currency: Currency | string;
        month: string;
        repeatFrequency: 'None' | 'Monthly' | 'Yearly';
        saveTemplate: boolean;
    }>({
        name: '', category: '', amount: '', currency: '', month: new Date().toISOString().slice(0, 7), repeatFrequency: 'None', saveTemplate: false
    });

    // Helper functions for month parsing
    const getMonthKey = (dateStr: string) => { 
        if (!dateStr) return '';
        const [y, m] = dateStr.split('-'); 
        return `${m}/${y}`; 
    };
    
    const fromMonthKey = (monthKey: string) => { 
        if (!monthKey || !monthKey.includes('/')) return '';
        const [m, y] = monthKey.split('/'); 
        return `${y}-${m}`; 
    };

    const openEdit = (b: Budget) => {
        setFormMode('budget');
        setEditingBudget(b);
        setEditingTemplate(null);
        setErrors({});
        setFormError(null);
        setFormData({ 
            name: '',
            category: b.category, 
            amount: b.amount.toLocaleString('en-US'), 
            currency: b.currency, 
            month: fromMonthKey(b.month), 
            repeatFrequency: 'None', 
            saveTemplate: false
        });
        setAddOpen(true);
    };

    const openEditTemplate = (tmpl: BudgetTemplate) => {
        setFormMode('template');
        setEditingTemplate(tmpl);
        setEditingBudget(null);
        setErrors({});
        setFormError(null);
        setFormData({ 
            name: tmpl.name,
            category: tmpl.category, 
            amount: tmpl.amount.toLocaleString('en-US'), 
            currency: tmpl.currency, 
            month: new Date().toISOString().slice(0, 7), // Not used for template but required for form state
            repeatFrequency: 'None', 
            saveTemplate: false
        });
        setAddOpen(true);
    };

    const handleSaveAsTemplate = (b: Budget) => {
        if (addBudgetTemplate) {
            addBudgetTemplate({
                name: b.category, // Use category as template name by default
                category: b.category,
                amount: b.amount,
                currency: b.currency,
                rollover: false // Rollover removed from UI, defaulting to false
            });
            alert("Template saved successfully!");
        } else {
            console.error("addBudgetTemplate function not available");
        }
    };

    const handleUseTemplate = (tmpl: BudgetTemplate) => {
        setFormMode('budget');
        setFormData({
            name: '',
            category: tmpl.category,
            amount: tmpl.amount.toLocaleString('en-US'),
            currency: tmpl.currency,
            month: new Date().toISOString().slice(0, 7),
            repeatFrequency: 'None', 
            saveTemplate: false
        });
        setAddOpen(true);
        setActiveTab('Budgets');
    };

    const openAdd = (mode: 'budget' | 'template') => {
        setFormMode(mode);
        setEditingBudget(null);
        setEditingTemplate(null);
        setErrors({});
        setFormError(null);
        setFormData({ 
            name: '',
            category: '', 
            amount: '', 
            currency: '', 
            month: new Date().toISOString().slice(0, 7), 
            repeatFrequency: 'None', 
            saveTemplate: false 
        });
        setAddOpen(true);
        setIsNewMenuOpen(false);
    };

    // Effect to handle navigation state from Layout FAB
    useEffect(() => {
        if (location.state && (location.state as any).action === 'add') {
            try {
                openAdd('budget');
                // Clear state
                navigate(location.pathname, { replace: true, state: {} });
            } catch (error) {
                console.error("Failed to process FAB action:", error);
            }
        }
    }, [location, navigate, settings.defaultCurrency]);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (newMenuRef.current && !newMenuRef.current.contains(event.target as Node)) {
                setIsNewMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Robust Viewport tracking for mobile pinning
    useEffect(() => {
        const handleResize = () => {
            if (window.visualViewport) {
                setVisualViewportHeight(window.visualViewport.height);
                const isOpen = window.visualViewport.height < window.innerHeight * 0.85;
                setIsKeyboardOpen(isOpen);
            } else {
                setVisualViewportHeight(window.innerHeight);
            }
        };

        window.visualViewport?.addEventListener('resize', handleResize);
        window.addEventListener('resize', handleResize);
        return () => {
            window.visualViewport?.removeEventListener('resize', handleResize);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const budgetStats = useMemo(() => {
        const targetMonthKey = getMonthKey(selectedMonth);

        return budgets
            .filter(b => b.month === targetMonthKey)
            .map(b => {
                const [m, y] = b.month.split('/');
                const monthPrefix = `${y}-${m}`;
                const spent = transactions
                    .filter(tx => !tx.isInternalTransfer && tx.type === TransactionType.EXPENSE && tx.category === b.category && tx.date.startsWith(monthPrefix))
                    .reduce((sum, tx) => sum + convertToDefault(tx.amount, tx.currency, b.currency as string, settings.exchangeRates), 0);
                const progress = b.amount > 0 ? (spent / b.amount) * 100 : 0;
                
                let performanceStatus: 'Safe' | 'Warning' | 'Critical' | 'Over Budget' | 'Perfect' = 'Safe';
                let color = 'bg-emerald-500';
                
                if (progress >= 101) { performanceStatus = 'Over Budget'; color = 'bg-red-500'; }
                else if (progress >= 100) { performanceStatus = 'Perfect'; color = 'bg-emerald-500'; }
                else if (progress >= 90) { performanceStatus = 'Critical'; color = 'bg-orange-500'; }
                else if (progress >= 70) { performanceStatus = 'Warning'; color = 'bg-yellow-500'; }

                const coa = chartOfAccounts.find(c => c.name === b.category);
                const glCode = coa ? coa.code : '—';
                const glName = coa ? (settings.language === 'km' && coa.localName ? coa.localName : coa.name) : b.category;
                
                return { 
                    ...b, 
                    spent, 
                    glCode,
                    glName,
                    remaining: b.amount - spent, 
                    variance: b.amount - spent, 
                    progress, 
                    performanceStatus, 
                    color 
                };
            });
    }, [budgets, transactions, settings, chartOfAccounts, selectedMonth]);

    const budgetHierarchy = useMemo(() => {
        const coaMap = new Map<string, ChartOfAccount>();
        chartOfAccounts.forEach(c => coaMap.set(c.id, c));
        const coaByName = new Map<string, ChartOfAccount>();
        chartOfAccounts.forEach(c => coaByName.set(c.name, c));

        const coaBudgets = new Map<string, any[]>();
        const involvedCoaIds = new Set<string>();

        budgetStats.forEach(b => {
            const coa = coaByName.get(b.category);
            if (coa) {
                if (!coaBudgets.has(coa.id)) coaBudgets.set(coa.id, []);
                coaBudgets.get(coa.id)!.push(b);
                
                let current: ChartOfAccount | undefined = coa;
                while (current) {
                    involvedCoaIds.add(current.id);
                    current = current.isSubOf ? coaMap.get(current.isSubOf) : undefined;
                }
            } else {
                const dummyId = `dummy-${b.category}`;
                if (!coaBudgets.has(dummyId)) coaBudgets.set(dummyId, []);
                coaBudgets.get(dummyId)!.push(b);
                involvedCoaIds.add(dummyId);
            }
        });

        const nodes = new Map<string, TreeNode>();
        involvedCoaIds.forEach(id => {
            const coa = coaMap.get(id);
            nodes.set(id, {
                id,
                coa,
                budgets: coaBudgets.get(id) || [],
                children: [],
                aggAmount: 0,
                aggSpent: 0,
                aggRemaining: 0,
                aggProgress: 0,
                aggPerformanceStatus: 'Safe',
                aggColor: 'bg-emerald-500',
                aggCurrency: undefined
            });
        });

        const roots: TreeNode[] = [];
        nodes.forEach(node => {
            if (node.coa && node.coa.isSubOf && nodes.has(node.coa.isSubOf)) {
                nodes.get(node.coa.isSubOf)!.children.push(node);
            } else {
                roots.push(node);
            }
        });

        const calculateAggregations = (node: TreeNode) => {
            let totalAmount = 0;
            let totalSpent = 0;
            let currency: string | undefined = undefined;

            node.budgets.forEach(b => {
                totalAmount += b.amount;
                totalSpent += b.spent;
                if (!currency) currency = b.currency;
            });

            node.children.forEach(child => {
                calculateAggregations(child);
                totalAmount += child.aggAmount;
                totalSpent += child.aggSpent;
                if (!currency && child.aggCurrency) currency = child.aggCurrency;
            });

            node.aggAmount = totalAmount;
            node.aggSpent = totalSpent;
            node.aggRemaining = totalAmount - totalSpent;
            node.aggProgress = totalAmount > 0 ? (totalSpent / totalAmount) * 100 : 0;
            node.aggCurrency = currency || settings.defaultCurrency;

            if (node.aggProgress >= 101) { node.aggPerformanceStatus = 'Over Budget'; node.aggColor = 'bg-red-500'; }
            else if (node.aggProgress >= 100) { node.aggPerformanceStatus = 'Perfect'; node.aggColor = 'bg-emerald-500'; }
            else if (node.aggProgress >= 90) { node.aggPerformanceStatus = 'Critical'; node.aggColor = 'bg-orange-500'; }
            else if (node.aggProgress >= 70) { node.aggPerformanceStatus = 'Warning'; node.aggColor = 'bg-yellow-500'; }
            else { node.aggPerformanceStatus = 'Safe'; node.aggColor = 'bg-emerald-500'; }
        };

        roots.forEach(calculateAggregations);

        return roots;
    }, [budgetStats, chartOfAccounts, settings]);

    const flattenedRows: FlatRow[] = useMemo(() => {
        const flatten = (nodes: TreeNode[], level: number = 0): FlatRow[] => {
            let result: FlatRow[] = [];
            nodes.forEach(node => {
                const hasChildren = node.children.length > 0 || node.budgets.length > 1;
                const isExpanded = expandedNodes.has(node.id);
                const glName = node.coa ? (settings.language === 'km' && node.coa.localName ? node.coa.localName : node.coa.name) : node.id.replace('dummy-', '');
                
                const isLeafBudget = !hasChildren && node.budgets.length === 1;
                const primaryBudget = node.budgets[0];

                result.push({
                    id: node.id,
                    type: 'coa',
                    level,
                    isExpanded,
                    hasChildren,
                    month: getMonthKey(selectedMonth),
                    glCode: node.coa ? node.coa.code : '—',
                    glName: glName,
                    amount: isLeafBudget ? primaryBudget.amount : node.aggAmount,
                    spent: isLeafBudget ? primaryBudget.spent : node.aggSpent,
                    remaining: isLeafBudget ? primaryBudget.remaining : node.aggRemaining,
                    progress: isLeafBudget ? primaryBudget.progress : node.aggProgress,
                    performanceStatus: isLeafBudget ? primaryBudget.performanceStatus : node.aggPerformanceStatus,
                    color: isLeafBudget ? primaryBudget.color : node.aggColor,
                    currency: isLeafBudget ? primaryBudget.currency : (node.aggCurrency || settings.defaultCurrency),
                    budget: isLeafBudget ? primaryBudget : undefined
                });
                
                if (isExpanded) {
                    const childRows = flatten(node.children, level + 1);
                    result = result.concat(childRows);
                    
                    if (hasChildren && node.budgets.length > 0) {
                        node.budgets.forEach(b => {
                            result.push({
                                id: `budget-${b.id}`,
                                type: 'budget',
                                level: level + 1,
                                isExpanded: false,
                                hasChildren: false,
                                month: b.month,
                                glCode: b.glCode,
                                glName: b.glName,
                                amount: b.amount,
                                spent: b.spent,
                                remaining: b.remaining,
                                progress: b.progress,
                                performanceStatus: b.performanceStatus,
                                color: b.color,
                                currency: b.currency,
                                budget: b
                            });
                        });
                    }
                }
            });
            return result;
        };
        return flatten(budgetHierarchy);
    }, [budgetHierarchy, expandedNodes, selectedMonth, settings.language, settings.defaultCurrency]);

    const totals = useMemo(() => {
        return budgetStats.reduce((acc, b) => {
            const bDef = convertToDefault(b.amount, b.currency as string, settings.defaultCurrency, settings.exchangeRates);
            const sDef = convertToDefault(b.spent, b.currency as string, settings.defaultCurrency, settings.exchangeRates);
            return { budgeted: acc.budgeted + bDef, spent: acc.spent + sDef, remaining: acc.remaining + (bDef - sDef) };
        }, { budgeted: 0, spent: 0, remaining: 0 });
    }, [budgetStats, settings]);

    const handleExportExcel = () => {
        const flattenForExport = (nodes: TreeNode[], level: number = 0): any[] => {
            let result: any[] = [];
            nodes.forEach(node => {
                const hasChildren = node.children.length > 0 || node.budgets.length > 1;
                const glName = node.coa ? (settings.language === 'km' && node.coa.localName ? node.coa.localName : node.coa.name) : node.id.replace('dummy-', '');
                const indent = '  '.repeat(level);
                
                const isLeafBudget = !hasChildren && node.budgets.length === 1;
                const primaryBudget = node.budgets[0];

                result.push({
                    'Month': getMonthKey(selectedMonth),
                    'Category': `${indent}${node.coa ? `${node.coa.code}-${glName}` : glName}`,
                    'Account Code': node.coa ? node.coa.code : '',
                    'Planned': isLeafBudget ? primaryBudget.amount : node.aggAmount,
                    'Spent': isLeafBudget ? primaryBudget.spent : node.aggSpent,
                    'Remaining': isLeafBudget ? primaryBudget.remaining : node.aggRemaining,
                    'Currency': isLeafBudget ? primaryBudget.currency : (node.aggCurrency || settings.defaultCurrency)
                });
                
                result = result.concat(flattenForExport(node.children, level + 1));
                
                if (hasChildren && node.budgets.length > 0) {
                    node.budgets.forEach(b => {
                        const budgetIndent = '  '.repeat(level + 1);
                        result.push({
                            'Month': b.month,
                            'Category': `${budgetIndent}${b.glCode !== '—' ? `${b.glCode}-${b.glName}` : b.glName}`,
                            'Account Code': b.glCode !== '—' ? b.glCode : '',
                            'Planned': b.amount,
                            'Spent': b.spent,
                            'Remaining': b.remaining,
                            'Currency': b.currency
                        });
                    });
                }
            });
            return result;
        };

        const data = flattenForExport(budgetHierarchy);

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Budgets");
        XLSX.writeFile(wb, `Budgets_${getMonthKey(selectedMonth)}.xlsx`);
    };

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const arrayBuffer = evt.target?.result as ArrayBuffer;
                const dataArray = new Uint8Array(arrayBuffer);
                const wb = XLSX.read(dataArray, { type: 'array', cellDates: true });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                let successCount = 0;
                let failedCount = 0;
                const importErrors: string[] = [];
                const allNewBudgets: any[] = [];

                for (let i = 0; i < data.length; i++) {
                    const row: any = data[i];
                    const rowNum = i + 2; // Excel rows are 1-indexed, +1 for header

                    try {
                        // Validate required fields
                        if (!row['Month'] || !row['Account Code'] || !row['Planned'] || !row['Currency']) {
                            throw new Error(`Row ${rowNum}: Missing required fields (Month, Account Code, Planned, Currency).`);
                        }

                        // Validate Month format (MM/YYYY)
                        let monthStr = '';
                        const rawMonth = row['Month'];
                        if (rawMonth instanceof Date) {
                            const monthVal = String(rawMonth.getUTCMonth() + 1).padStart(2, '0');
                            const yearVal = rawMonth.getUTCFullYear();
                            monthStr = `${monthVal}/${yearVal}`;
                        } else {
                            const valStr = String(rawMonth).trim();
                            if (/^\d{1,2}\/\d{4}$/.test(valStr)) {
                                const [mPart, yPart] = valStr.split('/');
                                monthStr = `${mPart.padStart(2, '0')}/${yPart}`;
                            } else {
                                const parsedDate = new Date(valStr);
                                if (!isNaN(parsedDate.getTime())) {
                                    const monthVal = String(parsedDate.getUTCMonth() + 1).padStart(2, '0');
                                    const yearVal = parsedDate.getUTCFullYear();
                                    monthStr = `${monthVal}/${yearVal}`;
                                } else {
                                    throw new Error(`Row ${rowNum}: Invalid Month format. Expected MM/YYYY, got ${valStr}.`);
                                }
                            }
                        }

                        // Validate Account Code
                        const accountCode = String(row['Account Code']);
                        const coa = chartOfAccounts.find(c => c.code === accountCode);
                        if (!coa) {
                            throw new Error(`Row ${rowNum}: Account Code '${accountCode}' not found in Chart of Accounts.`);
                        }

                        // Validate Planned amount
                        const planned = parseFloat(row['Planned']);
                        if (isNaN(planned) || planned <= 0) {
                            throw new Error(`Row ${rowNum}: Invalid Planned amount.`);
                        }

                        // Validate Currency
                        const currency = String(row['Currency']).toUpperCase();
                        if (!Object.values(Currency).includes(currency as Currency)) {
                            throw new Error(`Row ${rowNum}: Invalid Currency '${currency}'.`);
                        }

                        // Prepare budget data
                        const budgetData = {
                            category: coa.name,
                            amount: planned,
                            currency: currency as Currency,
                            month: monthStr,
                            rollover: false
                        };

                        allNewBudgets.push(budgetData);

                        // Handle Repeat
                        const repeat = String(row['Repeat'] || 'None');
                        if (repeat !== 'None') {
                            const [mStr, yStr] = monthStr.split('/');
                            let year = parseInt(yStr);
                            let month = parseInt(mStr);
                            let nextMonthKey = '';

                            if (repeat === 'Monthly') {
                                month++;
                                if (month > 12) {
                                    month = 1;
                                    year++;
                                }
                                nextMonthKey = `${String(month).padStart(2, '0')}/${year}`;
                            } else if (repeat === 'Yearly') {
                                year++;
                                nextMonthKey = `${String(month).padStart(2, '0')}/${year}`;
                            }

                            if (nextMonthKey) {
                                allNewBudgets.push({
                                    ...budgetData,
                                    month: nextMonthKey
                                });
                            }
                        }

                        successCount++;
                    } catch (err: any) {
                        failedCount++;
                        importErrors.push(err.message);
                    }
                }

                if (allNewBudgets.length > 0) {
                    addBudgets(allNewBudgets);
                }

                setImportResults({ success: successCount, failed: failedCount, errors: importErrors });
                setIsImportModalOpen(true);
            } catch (error) {
                console.error("Error parsing Excel file:", error);
                alert("Failed to parse Excel file. Please ensure it's a valid format.");
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''; // Reset file input
                }
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setFormError(null);
        setIsSubmitting(true);
        setIsShaking(false);

        const newErrors: Record<string, string> = {};

        if (!formData.category) newErrors.category = t('error_select_category');

        const amountRaw = formData.amount.replace(/,/g, '');
        const amountVal = parseFloat(amountRaw);
        if (formData.amount === '' || isNaN(amountVal) || amountVal <= 0) newErrors.amount = t('error_amount_invalid');
        if (!formData.currency) newErrors.currency = t('select_currency');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsSubmitting(false);
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            return;
        }

        try {
            await new Promise(resolve => setTimeout(resolve, 600));
            
            if (formMode === 'template') {
                const templateData = {
                    name: formData.category,
                    category: formData.category,
                    amount: amountVal,
                    currency: formData.currency,
                    rollover: false
                };

                if (editingTemplate) {
                     if (updateBudgetTemplate) updateBudgetTemplate({ ...editingTemplate, ...templateData });
                } else {
                    if (addBudgetTemplate) {
                        addBudgetTemplate(templateData);
                    }
                }
            } else {
                // Rollover is removed from UI, hardcoded to false
                const budgetData = { 
                    category: formData.category, 
                    amount: amountVal, 
                    currency: formData.currency, 
                    month: getMonthKey(formData.month), 
                    rollover: false 
                };

                if (editingBudget) {
                    updateBudget({ ...editingBudget, ...budgetData } as Budget);
                } else {
                    const budgetsToCreate: any[] = [budgetData];
                    
                    // Repeat Logic
                    if (formData.repeatFrequency !== 'None') {
                        const [yStr, mStr] = formData.month.split('-');
                        let year = parseInt(yStr);
                        let month = parseInt(mStr);
                        
                        let nextMonthKey = '';

                        if (formData.repeatFrequency === 'Monthly') {
                            month++;
                            if (month > 12) {
                                month = 1;
                                year++;
                            }
                            nextMonthKey = `${String(month).padStart(2, '0')}/${year}`;
                        } else if (formData.repeatFrequency === 'Yearly') {
                            year++;
                            nextMonthKey = `${String(month).padStart(2, '0')}/${year}`;
                        }
                        
                        if (nextMonthKey) {
                            budgetsToCreate.push({
                                ...budgetData,
                                month: nextMonthKey
                            });
                        }
                    }

                    if (budgetsToCreate.length > 0) {
                        addBudgets(budgetsToCreate);
                    }

                    if (formData.saveTemplate && addBudgetTemplate) {
                        addBudgetTemplate({
                            name: formData.category, // Use category as template name if not provided
                            category: formData.category,
                            amount: amountVal,
                            currency: formData.currency,
                            rollover: false
                        });
                    }
                }
            }
            setAddOpen(false);
            setEditingBudget(null);
            setEditingTemplate(null);
        } catch (err: any) {
            setFormError(t('error_save_failed'));
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
        } finally { setIsSubmitting(false); }
    };

    return (
        <div className={cn(CLASSES.container, "!px-2 md:!px-4 lg:!px-6 !space-y-4 pb-24")}>
            {/* Hidden File Input for Import */}
            <input 
                type="file" 
                accept=".xlsx, .xls" 
                ref={fileInputRef} 
                onChange={handleImportExcel} 
                className="hidden" 
            />

            {/* Header Area - Refined Responsiveness */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-2">
                <div>
                    <Typography variant="h2" className="text-gray-900 dark:text-white text-lg md:text-xl">{t('budgets')}</Typography>
                    <Typography variant="caption">{t('manage_spending')}</Typography>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    {/* View Switcher */}
                    <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-gray-700 p-1 flex shrink-0">
                        {(['Budgets', 'Templates'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "flex-1 sm:flex-none px-4 py-1.5 text-sm font-bold rounded-lg transition-all",
                                    activeTab === tab ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                                )}
                            >
                                {t(tab.toLowerCase()) || tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="flex-1 sm:w-48 sm:flex-none">
                            <CustomDatePicker
                                type="month"
                                value={selectedMonth}
                                onChange={setSelectedMonth}
                                inputClassName="font-normal text-sm h-10 bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 rounded-md w-full"
                                iconSize={16}
                                disabled={activeTab === 'Templates'}
                            />
                        </div>

                        {can('Budgets', 'add') && (
                            <div className="relative" ref={newMenuRef}>
                                <button 
                                    onClick={() => setIsNewMenuOpen(!isNewMenuOpen)} 
                                    // Rule: Rounded-xl for Buttons
                                    className={cn(CLASSES.buttonPrimary, "px-4 h-10 shadow-sm whitespace-nowrap text-sm font-bold shrink-0 rounded-xl flex items-center gap-2")}
                                >
                                    <FileSpreadsheet size={16} /> 
                                    <span className="hidden sm:inline">{t('actions')}</span>
                                    <ChevronDown size={14} className={cn("transition-transform duration-300", isNewMenuOpen && "rotate-180")} />
                                </button>
                                {isNewMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-dark-card border border-gray-200/60 dark:border-gray-700 rounded-xl shadow-2xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5 overflow-hidden">
                                        <button 
                                            onClick={() => openAdd('budget')}
                                            className="w-full text-left px-4 py-2.5 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-3 transition-colors h-10"
                                        >
                                            <PiggyBank size={16} /> {t('new_budget')}
                                        </button>
                                        <button 
                                            onClick={() => openAdd('template')}
                                            className="w-full text-left px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-3 transition-colors h-10"
                                        >
                                            {t('new_template')}
                                        </button>
                                        <div className="h-px bg-gray-100 dark:bg-gray-800 my-1"></div>
                                        <button 
                                            onClick={() => { setIsNewMenuOpen(false); fileInputRef.current?.click(); }}
                                            className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors h-10"
                                        >
                                            <Upload size={16} /> {t('import')}
                                        </button>
                                        <button 
                                            onClick={() => { 
                                                setIsNewMenuOpen(false); 
                                                const ws = XLSX.utils.json_to_sheet([{
                                                    'Month': '01/2024',
                                                    'Account Code': '10100',
                                                    'Account Name': 'Example Account',
                                                    'Planned': 1000,
                                                    'Currency': 'USD',
                                                    'Repeat': 'None'
                                                }]);
                                                const wb = XLSX.utils.book_new();
                                                XLSX.utils.book_append_sheet(wb, ws, "Template");
                                                XLSX.writeFile(wb, "Budget_Import_Template.xlsx");
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors h-10"
                                        >
                                            <Download size={16} /> Download Template
                                        </button>
                                        <button 
                                            onClick={() => { setIsNewMenuOpen(false); handleExportExcel(); }}
                                            className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors h-10"
                                        >
                                            <Download size={16} /> {t('export')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {activeTab === 'Budgets' && (
                <>
                    <div className="animate-in fade-in duration-500">
                        {/* Mobile View: Combined Card */}
                        <div className="md:hidden mb-4">
                            <div className={cn(CLASSES.card, "w-full p-4 bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 shadow-sm rounded-xl")}>
                                <div className="flex flex-col gap-0.5 mb-3">
                                    <Typography variant="caption" className="text-xs font-medium">
                                        {t('budget_planned')}
                                    </Typography>
                                    <Typography variant="h1" className="text-base font-semibold tabular-nums tracking-tight text-gray-900 dark:text-white">
                                        {formatCurrency(totals.budgeted, settings.defaultCurrency, settings.language)}
                                    </Typography>
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                    <div>
                                        <Typography variant="caption" className="opacity-87 text-xs font-medium block mb-0.5">
                                            {t('budget_used')}
                                        </Typography>
                                        <Typography variant="h3" className="text-base font-semibold tabular-nums text-red-600 dark:text-red-400">
                                            {formatCurrency(totals.spent, settings.defaultCurrency, settings.language)}
                                        </Typography>
                                    </div>
                                    <div>
                                        <Typography variant="caption" className="opacity-87 text-xs font-medium block mb-0.5">
                                            {t('budget_left')}
                                        </Typography>
                                        <Typography variant="h3" className="text-base font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(totals.remaining, settings.defaultCurrency, settings.language)}
                                        </Typography>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tablet/Desktop View: 3-Column Grid */}
                        <div className="hidden md:grid grid-cols-3 gap-4 mb-4">
                            <KPICard 
                                title={t('budget_planned')} 
                                amount={totals.budgeted} 
                                currency={settings.defaultCurrency} 
                                lang={settings.language} 
                                color="gray" 
                            />
                            <KPICard 
                                title={t('budget_used')} 
                                amount={totals.spent} 
                                currency={settings.defaultCurrency} 
                                lang={settings.language} 
                                color="red" 
                            />
                            <KPICard 
                                title={t('budget_left')} 
                                amount={totals.remaining} 
                                currency={settings.defaultCurrency} 
                                lang={settings.language} 
                                color="emerald" 
                            />
                        </div>
                    </div>

                    <div className="space-y-4 animate-in fade-in duration-500 delay-100">
                        {/* Standardized Table View - Scaled Typography Applied */}
                        {/* Rule: Rounded-lg for Table container */}
                        <div className={cn(CLASSES.card, "flex flex-col border-gray-200 dark:border-gray-700 overflow-hidden min-h-[500px] h-[60vh] rounded-lg md:rounded-lg")}>
                            <div className="flex-1 overflow-auto scrollbar-thin">
                                <table className="w-full text-left border-separate border-spacing-0 table-fixed min-w-[1500px]">
                                    <thead className="sticky top-0 z-20">
                                        <tr>
                                            <th className={cn(premiumTh, "w-80 pl-4")}>{t('category')}</th>
                                            <th className={cn(premiumTh, "w-56")}>{t('progress')}</th>
                                            <th className={cn(premiumTh, "w-32 text-center")}>
                                                <div className="flex items-center justify-center gap-1">
                                                    {t('status')}
                                                    <TooltipButton tooltip={t('budget_status_tooltip') || "Progress statuses are defined by thresholds: Over Budget (≥101, red), Perfect (≥100, emerald), Critical (≥90, orange), and Warning (≥70, yellow)."} />
                                                </div>
                                            </th>
                                            <th className={cn(premiumTh, "w-28")}>{t('month')}</th>
                                            <th className={cn(premiumTh, "text-right w-44")}>{t('budget_limit')}</th>
                                            <th className={cn(premiumTh, "text-right w-44")}>{t('budget_used')}</th>
                                            <th className={cn(premiumTh, "text-right w-44")}>{t('budget_left')}</th>
                                            <th className={cn(premiumTh, "w-12 text-center sticky right-0 bg-gray-50 dark:bg-gray-800 shadow-[-4px_0_12px_rgba(0,0,0,0.03)] border-l pr-4")}></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-transparent">
                                        {flattenedRows.length > 0 ? (
                                            flattenedRows.map((row, i) => (
                                                <tr 
                                                    key={row.id} 
                                                    className={cn("hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10 transition-colors group", i % 2 === 0 ? "bg-white dark:bg-[#161b22]" : "bg-gray-50/40 dark:bg-gray-800/20")}
                                                >
                                                    <td className={cn(premiumTd, "pl-4")}>
                                                        <div className="flex items-center gap-2" style={{ paddingLeft: `${row.level * 1.5}rem` }}>
                                                            {row.type === 'coa' && row.hasChildren && (
                                                                <button onClick={() => toggleExpand(row.id)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                                                                    {row.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                                </button>
                                                            )}
                                                            {row.type === 'coa' && !row.hasChildren && (
                                                                <div className="w-6" /> // spacer
                                                            )}
                                                            <span className={cn("truncate font-medium block text-gray-700 dark:text-gray-300", row.type === 'coa' ? "font-bold" : "")}>
                                                                {row.glCode !== '—' ? `${row.glCode}-${row.glName}` : row.glName}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className={premiumTd}>
                                                        <div className="space-y-2 max-w-[200px]">
                                                            <div className="flex justify-between items-center px-0.5">
                                                                <span className="text-xs font-semibold">{t('usage')}</span>
                                                                <span className="text-xs tabular-nums font-bold">{row.progress.toFixed(1)}%</span>
                                                            </div>
                                                            <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner border border-gray-100 dark:border-gray-700/50">
                                                                <motion.div 
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${Math.min(100, row.progress)}%` }}
                                                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                                                    className={cn("h-full", row.color)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className={cn(premiumTd, "text-center")}>
                                                        {/* Rule: Rounded-lg for Badges */}
                                                        <span className={cn(
                                                            "px-3 py-1 text-[11px] rounded-lg border leading-none inline-block font-bold",
                                                            (row.performanceStatus === 'Safe' || row.performanceStatus === 'Perfect') ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                                                            row.performanceStatus === 'Warning' ? "bg-yellow-50 text-yellow-600 border-yellow-100" :
                                                            row.performanceStatus === 'Critical' ? "bg-orange-50 text-orange-600 border-orange-100" :
                                                            "bg-red-50 text-red-600 border-red-100"
                                                        )}>
                                                            {t(row.performanceStatus.toLowerCase().replace(' ', '_')) || row.performanceStatus}
                                                        </span>
                                                    </td>
                                                    <td className={premiumTd}>
                                                    <span className="text-emerald-600 tabular-nums font-bold">{row.month}</span>
                                                    </td>
                                                    {/* Rule: Table Cell -> text-sm md:text-base font-medium */}
                                                    <td className={cn(premiumTd, "text-right tabular-nums text-gray-400 text-sm md:text-base font-medium")}>
                                                    {formatCurrency(row.amount, row.currency as string, settings.language)}
                                                    </td>
                                                    <td className={cn(premiumTd, "text-right tabular-nums text-red-600 dark:text-red-400 bg-red-50/[0.02] dark:bg-red-900/[0.02] text-sm md:text-base font-medium")}>
                                                    {formatCurrency(row.spent, row.currency as string, settings.language)}
                                                    </td>
                                                    <td className={cn(premiumTd, "text-right text-emerald-600 dark:text-emerald-400 tabular-nums text-sm md:text-base font-medium")}>
                                                    {formatCurrency(row.remaining, row.currency as string, settings.language)}
                                                    </td>
                                                    <td className={cn(premiumTd, "text-center sticky right-0 bg-inherit shadow-[-4px_0_12px_rgba(0,0,0,0.03)] border-l pr-4")} onClick={e => e.stopPropagation()}>
                                                        {row.budget && (
                                                            <div className="flex justify-center">
                                                                <BudgetsMenu 
                                                                    onEdit={() => openEdit(row.budget!)} 
                                                                    onDelete={() => { setBudgetToDelete(row.budget!.id); setDeleteConfirmOpen(true); }} 
                                                                    onSaveAsTemplate={() => handleSaveAsTemplate(row.budget!)}
                                                                />
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={9} className="py-24 text-center opacity-30 italic">
                                                    <div className="flex flex-col items-center justify-center gap-3">
                                                        <Calendar size={48} strokeWidth={1} className="text-gray-400" />
                                                        <Typography variant="caption" className="font-bold text-lg">{t('no_data')}</Typography>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'Templates' && (
                <div className="animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {budgetTemplates.map((tmpl) => {
                            const coa = chartOfAccounts.find(c => c.name === tmpl.category);
                            const displayName = coa ? `${coa.code}-${settings.language === 'km' && coa.localName ? coa.localName : coa.name}` : tmpl.category;
                            return (
                                <div key={tmpl.id} className={cn(CLASSES.card, "p-3 rounded-xl md:rounded-xl flex flex-col gap-2 group hover:border-emerald-500/50 transition-all shadow-sm relative")}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className="min-w-0">
                                                <Typography variant="h3" className="font-medium text-xs md:text-sm truncate">{displayName}</Typography>
                                            </div>
                                        </div>
                                        <BudgetsMenu 
                                            onUseTemplate={() => handleUseTemplate(tmpl)}
                                            onEdit={() => openEditTemplate(tmpl)}
                                            onDelete={() => { setTemplateToDelete(tmpl.id); setIsTemplateDeleteConfirmOpen(true); }}
                                        />
                                    </div>
                                    <div className="pt-0.5">
                                        <Typography variant="h2" className="text-xs md:text-sm font-bold tabular-nums text-gray-800 dark:text-gray-200">
                                            {formatCurrency(tmpl.amount, tmpl.currency as string, settings.language)}
                                        </Typography>
                                    </div>
                                </div>
                            );
                        })}
                        {budgetTemplates.length === 0 && (
                            <div className="col-span-full py-20 text-center flex flex-col items-center justify-center gap-4 opacity-40">
                                <Typography variant="caption" className="text-lg">{t('no_templates')}</Typography>
                                <Typography variant="caption" className="max-w-xs">{t('create_template_hint') || "Create a budget and save it as a template to reuse it later."}</Typography>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modals - Standardized Typography Scale */}
            {isAddOpen && (
                <div className={cn(CLASSES.modalOverlay, "sm:p-4 p-0")}>
                    <div 
                        style={{ height: window.innerWidth < 640 ? `${visualViewportHeight}px` : undefined }}
                        // Rule: Rounded-xl for Modal Container
                        className={cn(CLASSES.modalContent, "max-w-md md:h-auto md:max-h-[90dvh] rounded-none md:rounded-xl animate-in slide-in-from-bottom md:zoom-in-95 duration-300 relative overflow-hidden flex flex-col", isShaking && "animate-shake")}
                    >
                        <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 shrink-0")}>
                            <Typography variant="h2" className="text-base md:text-lg">
                                {editingBudget ? t('update_budget') : (formMode === 'template' ? (editingTemplate ? t('edit_template') : t('new_template')) : t('set_budget'))}
                            </Typography>
                            <button onClick={() => setAddOpen(false)} className={CLASSES.buttonGhost} disabled={isSubmitting}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className={cn(CLASSES.modalBody, "p-4 md:p-5 space-y-5 md:space-y-4 flex-1 overflow-y-auto")}>
                                {formError && <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 flex gap-2.5 text-[10px] font-bold animate-in slide-in-from-top-2 mb-4"><AlertTriangle size={16} />{formError}</div>}
                                <div className="space-y-5 md:space-y-4">
                                    <div className="space-y-1">
                                        <Typography variant="label">{t('category')}</Typography>
                                        <CategorySelect 
                                            value={formData.category}
                                            onChange={(val) => { 
                                                setFormData({ ...formData, category: val }); 
                                                if(errors.category) setErrors({...errors, category: ''}); 
                                            }}
                                            accounts={chartOfAccounts}
                                            t={t}
                                            error={errors.category}
                                            disabled={isSubmitting}
                                            language={settings.language}
                                        />
                                        {errors.category && <Typography variant="caption" className="text-red-500 font-bold px-1 block animate-in fade-in slide-in-from-top-1 text-[10px]">{errors.category}</Typography>}
                                    </div>
                                    
                                    {formMode === 'budget' && (
                                        <CustomDatePicker 
                                            type="month" 
                                            label={t('month')} 
                                            disabled={isSubmitting}
                                            value={formData.month} 
                                            onChange={v => setFormData({...formData, month: v})} 
                                            inputClassName="h-11 md:h-10 rounded-md border-2 font-normal text-sm"
                                        />
                                    )}

                                    {/* Rule: Form Input -> text-base font-semibold */}
                                    <NumericInput 
                                        label={formMode === 'template' ? t('default_amount') : t('budget_limit')} 
                                        disabled={isSubmitting}
                                        value={formData.amount} 
                                        onChange={v => { setFormData({...formData, amount: v}); if(errors.amount) setErrors({...errors, amount: ''}); }} 
                                        error={errors.amount} 
                                        inputClassName="h-11 md:h-10 rounded-md border-2 text-base font-semibold"
                                    />
                                    <div className="space-y-1">
                                        <Typography variant="label">{t('currency')}</Typography>
                                        <CustomSelect
                                            value={formData.currency}
                                            onChange={(value) => { 
                                                setFormData({ ...formData, currency: value as Currency }); 
                                                if(errors.currency) setErrors({...errors, currency: ''}); 
                                            }}
                                            options={[Currency.USD, Currency.KHR].map(c => ({ value: c, label: c }))}
                                            t={t}
                                            placeholder={t('select_currency')}
                                            disabled={isSubmitting}
                                            error={!!errors.currency}
                                        />
                                        {errors.currency && <Typography variant="caption" className="text-red-500 font-bold px-1 block mt-0.5">{errors.currency}</Typography>}
                                    </div>

                                    {/* Repeat Selection - Only for Budget mode */}
                                    {formMode === 'budget' && (
                                        <div className="space-y-1">
                                            <Typography variant="label">{t('repeat')}</Typography>
                                            <CustomSelect
                                                    value={formData.repeatFrequency}
                                                    onChange={(value) => setFormData({ ...formData, repeatFrequency: value as any })}
                                                    options={[
                                                        { value: "None", label: t('none') },
                                                        { value: "Monthly", label: t('monthly') },
                                                        { value: "Yearly", label: t('yearly') }
                                                    ]}
                                                    t={t}
                                                    placeholder={t('select_repeat')}
                                                    disabled={isSubmitting}
                                                />
                                        </div>
                                    )}
                                    
                                    <div className="flex flex-col gap-3 pt-2">
                                        {!editingBudget && formMode === 'budget' && (
                                            <div className="flex items-center gap-3">
                                                <button type="button" disabled={isSubmitting} onClick={() => setFormData({...formData, saveTemplate: !formData.saveTemplate})} className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", formData.saveTemplate ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300 bg-white dark:bg-gray-800")}>
                                                    {formData.saveTemplate && <CheckCircle2 size={14} strokeWidth={3} />}
                                                </button>
                                                <Typography variant="caption" className="font-bold flex items-center gap-1.5">{t('save_as_template')}</Typography>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className={cn(
                                "border-t border-gray-100 dark:border-gray-800 z-30 shrink-0",
                                "flex flex-row items-center gap-3 bg-white dark:bg-[#161b22]",
                                "transition-all duration-300 ease-in-out px-4 md:px-5",
                                isKeyboardOpen ? "py-2" : "py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
                            )}>
                                {/* Rule: Rounded-xl for Buttons */}
                                <button type="button" disabled={isSubmitting} onClick={() => setAddOpen(false)} className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-10 border-2 font-bold rounded-xl")}>{t('cancel')}</button>
                                <button type="submit" disabled={isSubmitting} className={cn(CLASSES.buttonPrimary, "flex-1 h-11 md:h-10 font-bold rounded-xl")}>{isSubmitting ? <Loader2 size={16} className="animate-spin" /> : t('save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteConfirmOpen && (
                <div className={CLASSES.modalOverlay}>
                    {/* Rule: Rounded-xl for Modal Container */}
                    <div className={cn(CLASSES.modalContent, "max-w-md rounded-none md:rounded-xl animate-in slide-in-from-bottom md:zoom-in-95 duration-300 relative overflow-hidden flex flex-col")}>
                        <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 justify-center")}>
                            <Typography variant="h2" className="text-base md:text-lg">{t('confirm_removal')}</Typography>
                        </div>
                        <div className={cn(CLASSES.modalBody, "p-4 md:p-5")}>
                            <div className="flex flex-col items-center text-center pt-2">
                                <Typography variant="body" className="mb-3 px-4 block">
                                    {t('delete_budget_confirm')}
                                    <Typography variant="caption" className="text-red-600 font-bold block mt-4 ring-1 ring-red-100 dark:ring-red-900/30 py-2 rounded-xl bg-red-50 dark:bg-red-900/20">{t('action_cannot_be_undone')}</Typography>
                                </Typography>
                            </div>
                        </div>
                        <div className={cn(CLASSES.modalFooter, "flex-row items-center gap-3 py-2 md:py-2.5 px-5 md:px-6 bg-gray-50 dark:bg-gray-800/20")}>
                            {/* Rule: Rounded-xl for Buttons */}
                            <button onClick={() => setDeleteConfirmOpen(false)} className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-10 border-2 rounded-xl")}>{t('cancel')}</button>
                            <button onClick={() => { if(budgetToDelete) deleteBudget(budgetToDelete); setDeleteConfirmOpen(false); }} className={cn(CLASSES.buttonDanger, "flex-1 h-11 md:h-10 rounded-xl")}>{t('confirm')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Template Delete Confirmation Modal */}
            {isTemplateDeleteConfirmOpen && (
                <div className={CLASSES.modalOverlay}>
                    <div className={cn(CLASSES.modalContent, "max-w-md rounded-none md:rounded-xl animate-in slide-in-from-bottom md:zoom-in-95 duration-300 relative overflow-hidden flex flex-col")}>
                        <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 justify-center")}>
                            <Typography variant="h2" className="text-base md:text-lg">{t('delete_template')}</Typography>
                        </div>
                        <div className={cn(CLASSES.modalBody, "p-4 md:p-5")}>
                            <div className="flex flex-col items-center text-center pt-2">
                                <Typography variant="body" className="mb-3 px-4 block">
                                    {t('delete_template_confirm')}
                                </Typography>
                            </div>
                        </div>
                        <div className={cn(CLASSES.modalFooter, "flex-row items-center gap-3 py-2 md:py-2.5 px-5 md:px-6 bg-gray-50 dark:bg-gray-800/20")}>
                            <button onClick={() => setIsTemplateDeleteConfirmOpen(false)} className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-10 border-2 rounded-xl")}>{t('cancel')}</button>
                            <button onClick={() => { if(templateToDelete && deleteBudgetTemplate) deleteBudgetTemplate(templateToDelete); setIsTemplateDeleteConfirmOpen(false); }} className={cn(CLASSES.buttonDanger, "flex-1 h-11 md:h-10 rounded-xl")}>{t('delete_template')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Results Modal */}
            {isImportModalOpen && (
                <div className={CLASSES.modalOverlay}>
                    <div className={cn(CLASSES.modalContent, "max-w-2xl rounded-none md:rounded-xl animate-in slide-in-from-bottom md:zoom-in-95 duration-300 relative overflow-hidden flex flex-col")}>
                        <div className={cn(CLASSES.modalHeader, "py-3 md:py-4 px-5 md:px-6")}>
                            <Typography variant="h2" className="text-lg md:text-xl">Import Results</Typography>
                            <button onClick={() => setIsImportModalOpen(false)} className={CLASSES.buttonGhost}><X size={20} /></button>
                        </div>
                        <div className={cn(CLASSES.modalBody, "p-5 md:p-6")}>
                            <div className="flex gap-4 mb-6">
                                <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                                    <Typography variant="caption" className="text-emerald-600 dark:text-emerald-400 font-semibold mb-1 block">Successful Imports</Typography>
                                    <Typography variant="h2" className="text-3xl text-emerald-700 dark:text-emerald-300">{importResults.success}</Typography>
                                </div>
                                <div className="flex-1 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800/30">
                                    <Typography variant="caption" className="text-red-600 dark:text-red-400 font-semibold mb-1 block">Failed Imports</Typography>
                                    <Typography variant="h2" className="text-3xl text-red-700 dark:text-red-300">{importResults.failed}</Typography>
                                </div>
                            </div>

                            {importResults.errors.length > 0 && (
                                <div>
                                    <Typography variant="h3" className="mb-3 text-red-600 dark:text-red-400 flex items-center gap-2">
                                        <AlertTriangle size={18} />
                                        Error Details
                                    </Typography>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 max-h-[40vh] overflow-y-auto">
                                        <ul className="space-y-2">
                                            {importResults.errors.map((error, index) => (
                                                <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                                    <span className="text-red-500 mt-0.5">•</span>
                                                    <span>{error}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className={cn(CLASSES.modalFooter, "py-3 md:py-4 px-5 md:px-6 bg-gray-50 dark:bg-gray-800/20")}>
                            <button onClick={() => setIsImportModalOpen(false)} className={cn(CLASSES.buttonPrimary, "w-full md:w-auto px-8 h-11 md:h-10 rounded-xl")}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
