
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../store';
import { TransactionType, Currency, Transaction, AccountStatus } from '../types';
import { formatCurrency, formatDate, formatDateTime, convertToDefault, cn, CLASSES, getPhnomPenhNowISO } from '../utils';
import { TransactionsMenu } from './menus/TransactionsMenu';
import { NumericInput } from './NumericInput';
import { Typography } from './Typography';
import * as XLSX from 'xlsx';
import { 
    PlusCircle, Search, X, Info, AlertTriangle, Clock, Tag, User as UserIcon,
    Landmark, Loader2,
    ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Trash2, CheckCircle2,
    ChevronDown,
    Upload,
    History,
    FileSpreadsheet, FileDown,
    TrendingUp,
    TrendingDown, ArrowDown, ArrowUp, ArrowUpDown,
    AlertCircle, Download
} from 'lucide-react';
import { CustomDatePicker } from './CustomDatePicker';
import { useLocation, useNavigate } from 'react-router-dom';

type SortField = 'date' | 'amount' | 'category' | 'paymentSource';
type SortDirection = 'asc' | 'desc';

// Standardized Table classes - text-sm font-semibold for headers, font-normal for data
const premiumTh = cn(CLASSES.typography.tableHeader, "px-3 py-2 align-middle bg-[#f9fafb] dark:bg-gray-800 border-b border-[#e5e7eb] dark:border-dark-border whitespace-nowrap text-sm font-semibold");
const premiumTd = cn(CLASSES.typography.body, "px-3 py-1 align-middle border-b border-[#f3f4f6] dark:border-dark-border/50 text-sm font-normal");

const ImportModal: React.FC<{
    onClose: () => void;
    onImport: (data: any[]) => Promise<{ success: number; failed: number; errors: string[] }>;
}> = ({ onClose, onImport }) => {
    const { t } = useApp();
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadTemplate = () => {
        const headers = [
            'Date',
            'Type',
            'Account Code',
            'Account Name',
            'Payment Source',
            'Original Amount',
            'Currency',
            'Internal Note'
        ];
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "Transactions_Template.xlsx");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setImportResult(null);
        }
    };

    const handleImport = async () => {
        if (!file) return;
        setIsAnalyzing(true);
        
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                const result = await onImport(jsonData);
                setImportResult(result);
                setIsAnalyzing(false);
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error(error);
            setIsAnalyzing(false);
            setImportResult({ success: 0, failed: 1, errors: [String(error)] });
        }
    };

    return (
        <div className={cn(CLASSES.modalOverlay, "z-[60]")}>
            <div className={cn(CLASSES.modalContent, "max-w-md")}>
                <div className={CLASSES.modalHeader}>
                    <Typography variant="h2">{t('import_transactions')}</Typography>
                    <button onClick={onClose} className={CLASSES.buttonGhost}><X size={18} /></button>
                </div>
                <div className={CLASSES.modalBody}>
                    {!importResult ? (
                        <div className="space-y-4">
                            <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-center space-y-3 bg-gray-50 dark:bg-gray-800/50">
                                <Upload className="mx-auto text-gray-400" size={32} />
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    <button onClick={() => fileInputRef.current?.click()} className="text-emerald-600 font-bold hover:underline">
                                        {t('click_to_upload')}
                                    </button>
                                    {" "}{t('or_drag_drop')}
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept=".xlsx, .xls" 
                                    onChange={handleFileChange} 
                                />
                                {file && <div className="text-sm font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 py-1 px-3 rounded-full inline-block">{file.name}</div>}
                            </div>
                            <div className="flex justify-center">
                                <button onClick={handleDownloadTemplate} className="text-sm text-emerald-600 font-semibold flex items-center gap-2 hover:underline p-2">
                                    <Download size={16} /> {t('download_template')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 text-center py-4">
                            <div className="flex justify-center gap-8">
                                <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl min-w-[100px]">
                                    <div className="text-3xl font-bold text-emerald-600">{importResult.success}</div>
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">{t('successful')}</div>
                                </div>
                                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl min-w-[100px]">
                                    <div className="text-3xl font-bold text-red-500">{importResult.failed}</div>
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">{t('failed')}</div>
                                </div>
                            </div>
                            {importResult.errors.length > 0 && (
                                <div className="text-left text-xs text-red-500 max-h-40 overflow-y-auto bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                                    <div className="font-bold mb-1">Errors:</div>
                                    {importResult.errors.map((err, i) => <div key={i} className="mb-0.5">• {err}</div>)}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className={CLASSES.modalFooter}>
                    {!importResult ? (
                        <>
                            <button onClick={onClose} className={CLASSES.buttonSecondary}>{t('cancel')}</button>
                            <button onClick={handleImport} disabled={!file || isAnalyzing} className={CLASSES.buttonPrimary}>
                                {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : t('import')}
                            </button>
                        </>
                    ) : (
                        <button onClick={onClose} className={cn(CLASSES.buttonPrimary, "w-full")}>{t('close')}</button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Reusable Category Select Component with Tree Structure
const CategorySelect: React.FC<{
    value: string;
    onChange: (value: string) => void;
    accounts: any[];
    type: TransactionType;
    t: (key: string) => string;
    error?: string;
    disabled?: boolean;
    language: string;
}> = ({ value, onChange, accounts, type, t, error, disabled, language }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Filter accounts based on type
    const filteredAccounts = useMemo(() => accounts.filter(c => c.type === type), [accounts, type]);

    // Initialize expanded state to show the selected item
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
        const initial = new Set<string>();
        if (value) {
            let current = filteredAccounts.find(a => a.name === value);
            while (current && current.isSubOf) {
                initial.add(current.isSubOf);
                current = filteredAccounts.find(a => a.id === current?.isSubOf);
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
        filteredAccounts.forEach(c => {
            if (c.isSubOf && filteredAccounts.some(p => p.id === c.isSubOf)) {
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
    }, [filteredAccounts, expandedIds]);

    const selectedAccount = filteredAccounts.find(a => a.name === value);

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
                    "h-12 rounded-md border-2 flex items-center justify-between cursor-pointer bg-white dark:bg-dark-card pr-10", 
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
                                    "px-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center",
                                    item.depth === 0 ? "py-2.5 font-bold text-base text-gray-900 dark:text-gray-100 bg-gray-50/50 dark:bg-gray-800/20 mt-0.5" : "py-2 text-sm text-gray-600 dark:text-gray-300",
                                    value === item.name && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 font-bold"
                                )}
                                style={{ paddingLeft: `${(item.depth * 16) + 12}px` }}
                                onClick={() => { onChange(item.name); setIsOpen(false); }}
                            >
                                {item.hasChildren ? (
                                    <button
                                        type="button"
                                        onClick={(e) => toggleExpand(e, item.id)}
                                        className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 mr-2 text-gray-800 dark:text-gray-200 transition-colors shrink-0 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center"
                                    >
                                        {expandedIds.has(item.id) ? <ChevronDown size={16} strokeWidth={3} /> : <ChevronRight size={16} strokeWidth={3} />}
                                    </button>
                                ) : (
                                    <span className="w-[26px] mr-2 inline-block shrink-0" />
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

const AccountSelect: React.FC<{
    value: string;
    onChange: (value: string) => void;
    accounts: any[];
    t: (key: string) => string;
    error?: string;
    disabled?: boolean;
}> = ({ value, onChange, accounts, t, error, disabled }) => {
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

    const selectedAccount = accounts.find(a => a.id === value);

    return (
        <div className="relative group" ref={containerRef}>
            <div 
                className={cn(
                    CLASSES.select, 
                    "h-12 rounded-md border-2 flex items-center justify-between cursor-pointer bg-white dark:bg-dark-card pr-10", 
                    isOpen && "ring-8 ring-emerald-500/5 border-emerald-500",
                    error && CLASSES.inputError,
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={cn("block truncate text-sm", !value && "text-gray-500")}>
                    {selectedAccount ? selectedAccount.name : t('select_account')}
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
                        <Typography variant="h3" className="font-bold text-lg">{t('select_account')}</Typography>
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
                            {t('select_account')}
                        </div>
                        {accounts.map(account => (
                            <div 
                                key={account.id}
                                className={cn(
                                    "px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between",
                                    value === account.id && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 font-medium"
                                )}
                                onClick={() => { onChange(account.id); setIsOpen(false); }}
                            >
                                <span className="truncate">{account.name}</span>
                                {value === account.id && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const Pagination: React.FC<{
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalRecords: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    t: (key: string, params?: Record<string, any>) => string;
}> = ({ currentPage, totalPages, pageSize, totalRecords, onPageChange, onPageSizeChange, t }) => {
    if (totalRecords === 0) return null;
    
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-dark-card border-t border-gray-100 dark:border-dark-border rounded-b-lg shadow-inner shrink-0 no-print">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Typography variant="label" className="font-semibold text-xs">{t('page_size')}</Typography>
                    <select 
                        value={pageSize} 
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-md text-sm px-2 py-1 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    >
                        {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
                    </select>
                </div>
                <Typography variant="caption" className="text-sm">
                    {t('showing_range', { start: (currentPage - 1) * pageSize + 1, end: Math.min(currentPage * pageSize, totalRecords), total: totalRecords })}
                </Typography>
            </div>

            <div className="flex items-center gap-1">
                <button 
                    disabled={currentPage === 1} 
                    onClick={() => onPageChange(1)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-30 transition-colors"
                >
                    <ChevronsLeft size={16} />
                </button>
                <button 
                    disabled={currentPage === 1} 
                    onClick={() => onPageChange(currentPage - 1)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-30 transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>
                
                <div className="flex items-center px-4">
                    <Typography variant="caption" className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                        {currentPage} <span className="text-gray-400 mx-1">/</span> {totalPages || 1}
                    </Typography>
                </div>

                <button 
                    disabled={currentPage === totalPages || totalPages === 0} 
                    onClick={() => onPageChange(currentPage + 1)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-30 transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
                <button 
                    disabled={currentPage === totalPages || totalPages === 0} 
                    onClick={() => onPageChange(totalPages)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-30 transition-colors"
                >
                    <ChevronsRight size={16} />
                </button>
            </div>
        </div>
    );
};

export const Transactions: React.FC = () => {
    const { 
        transactions, accounts, chartOfAccounts, settings, t, 
        addTransaction, updateTransaction, deleteTransaction, deleteTransactions, can 
    } = useApp();
    const location = useLocation();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };
    
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [isAddOpen, setAddOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [viewingTx, setViewingTx] = useState<Transaction | null>(null);
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [isBulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
    const [txToDelete, setTxToDelete] = useState<string | null>(null);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [visualViewportHeight, setVisualViewportHeight] = useState(window.innerHeight);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);

    const [formData, setFormData] = useState<{
        type: TransactionType;
        category: string;
        accountId: string;
        amount: string;
        currency: Currency | string;
        date: string;
        note: string;
    }>({
        type: TransactionType.EXPENSE,
        category: '',
        accountId: '',
        amount: '',
        currency: settings.defaultCurrency,
        date: getPhnomPenhNowISO(),
        note: ''
    });

    const exportMenuRef = useRef<HTMLDivElement>(null);
    const addMenuRef = useRef<HTMLDivElement>(null);

    const openAddModal = useCallback((type: TransactionType = TransactionType.EXPENSE) => {
        setEditingTx(null);
        setErrors({});
        setFormError(null);

        const defaultAccount = accounts.find(a => a.status === AccountStatus.DEFAULT) || accounts.find(a => a.status === AccountStatus.ACTIVE);

        setFormData({
            type,
            category: '',
            accountId: defaultAccount ? defaultAccount.id : '',
            amount: '',
            currency: defaultAccount ? defaultAccount.currency : settings.defaultCurrency,
            date: getPhnomPenhNowISO(),
            note: ''
        });
        setAddOpen(true);
        setIsAddMenuOpen(false);
    }, [settings.defaultCurrency, accounts]);

    useEffect(() => {
        if (location.state && (location.state as any).action === 'add') {
            try {
                const type = (location.state as any).type as TransactionType;
                if (type === TransactionType.INCOME || type === TransactionType.EXPENSE) {
                    openAddModal(type);
                    navigate(location.pathname, { replace: true, state: {} });
                }
            } catch (error) {
                console.error("Failed to process FAB action:", error);
            }
        }
    }, [location, navigate, openAddModal]);

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

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
                setIsExportMenuOpen(false);
            }
            if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
                setIsAddMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getCategoryLabel = (categoryName: string) => {
        const coa = chartOfAccounts.find(c => c.name === categoryName);
        if (!coa) return categoryName;
        const name = settings.language === 'km' && coa.localName ? coa.localName : coa.name;
        return `${coa.code} - ${name}`;
    };

    const filteredTransactions = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return transactions.filter(tx => {
            if (tx.isInternalTransfer) return false;
            
            const coa = chartOfAccounts.find(c => c.name === tx.category);
            const categoryLabel = coa ? `${coa.code} ${coa.name} ${coa.localName || ''}` : tx.category;
            const account = accounts.find(a => a.id === tx.accountId);
            const accountName = account ? account.name : '';
            const createdBy = tx.createdBy || '';
            
            const matchesSearch = searchTerm === '' || 
                tx.type.toLowerCase().includes(term) ||
                categoryLabel.toLowerCase().includes(term) ||
                accountName.toLowerCase().includes(term) ||
                tx.currency.toLowerCase().includes(term) ||
                createdBy.toLowerCase().includes(term) ||
                (tx.note && tx.note.toLowerCase().includes(term));

            return matchesSearch;
        }).sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'date':
                    comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
                    break;
                case 'amount':
                    comparison = a.amount - b.amount;
                    break;
                case 'category':
                    const catA = getCategoryLabel(a.category).toLowerCase();
                    const catB = getCategoryLabel(b.category).toLowerCase();
                    comparison = catA.localeCompare(catB);
                    break;
                case 'paymentSource':
                    const accA = accounts.find(acc => acc.id === a.accountId)?.name.toLowerCase() || '';
                    const accB = accounts.find(acc => acc.id === b.accountId)?.name.toLowerCase() || '';
                    comparison = accA.localeCompare(accB);
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [transactions, searchTerm, chartOfAccounts, accounts, sortField, sortDirection, settings]);

    const totalPages = Math.ceil(filteredTransactions.length / pageSize);
    const paginatedTxs = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === paginatedTxs.length && paginatedTxs.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(paginatedTxs.map(tx => tx.id)));
        }
    };

    const handleBulkDelete = () => {
        deleteTransactions(Array.from(selectedIds));
        setSelectedIds(new Set());
        setBulkDeleteConfirmOpen(false);
    };

    const handleExportExcel = () => {
        const itemsToExport = selectedIds.size > 0 
            ? filteredTransactions.filter(tx => selectedIds.has(tx.id))
            : filteredTransactions;

        if (itemsToExport.length === 0) return;

        const data = itemsToExport.map(tx => {
            const account = accounts.find(a => a.id === tx.accountId);
            const dateObj = new Date(tx.date);
            const coa = chartOfAccounts.find(c => c.name === tx.category);
            const accountNameStr = coa ? `${coa.code}-${coa.name}` : tx.category;
            return {
                'Date': dateObj.toISOString().split('T')[0],
                'Type': tx.type,
                'Account Name': accountNameStr,
                'Payment Source': account ? account.name : 'Unknown',
                'Original Amount': tx.amount,
                'Currency': tx.currency,
                'Valuation': tx.defaultAmount || convertToDefault(tx.amount, tx.currency as Currency, settings.defaultCurrency, settings.exchangeRates),
                'Internal Note': tx.note || ''
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        XLSX.writeFile(wb, `MyHeart_Transactions_${timestamp}.xlsx`);
        setIsExportMenuOpen(false);
    };

    const processImport = async (data: any[]) => {
        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const [index, row] of data.entries()) {
            const rowNum = index + 2;
            try {
                const dateVal = row['Date'];
                const typeStr = row['Type'];
                const accountCode = row['Account Code'];
                const accountName = row['Account Name'];
                const paymentSource = row['Payment Source'];
                const originalAmount = parseFloat(row['Original Amount']);
                const currency = row['Currency'];
                const note = row['Internal Note'];

                if (!dateVal || !typeStr || !accountCode || !accountName || !paymentSource || isNaN(originalAmount) || !currency) {
                    failed++;
                    errors.push(`Row ${rowNum}: Missing required fields.`);
                    continue;
                }

                if (originalAmount <= 0) {
                    failed++;
                    errors.push(`Row ${rowNum}: Amount must be greater than 0.`);
                    continue;
                }

                const account = accounts.find(a => a.name === paymentSource);
                if (!account) {
                    failed++;
                    errors.push(`Row ${rowNum}: Payment Source '${paymentSource}' not found.`);
                    continue;
                }

                const coa = chartOfAccounts.find(c => c.code === String(accountCode) && c.name === accountName && c.type === typeStr);
                if (!coa) {
                     failed++;
                     errors.push(`Row ${rowNum}: Chart of Account '${accountCode}-${accountName}' not found for type '${typeStr}'.`);
                     continue;
                }

                const isValidType = typeStr === TransactionType.INCOME || typeStr === TransactionType.EXPENSE;
                if (!isValidType) {
                    failed++;
                    errors.push(`Row ${rowNum}: Invalid Type '${typeStr}'.`);
                    continue;
                }

                const dateObj = new Date(dateVal);
                if (isNaN(dateObj.getTime())) {
                    failed++;
                    errors.push(`Row ${rowNum}: Invalid Date.`);
                    continue;
                }

                addTransaction({
                    type: typeStr as TransactionType,
                    category: coa.name,
                    accountId: account.id,
                    amount: originalAmount,
                    currency: currency,
                    date: dateObj.toISOString(),
                    note: note || '',
                    createdBy: t('imported')
                });
                success++;
            } catch (e) {
                failed++;
                errors.push(`Row ${rowNum}: Unexpected error: ${e}`);
            }
        }
        return { success, failed, errors };
    };

    const clearFieldError = (field: string) => {
        if (errors[field]) {
            const next = { ...errors };
            delete next[field];
            setErrors(next);
        }
        setFormError(null);
    };

    const handleFieldChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        clearFieldError(field);
    };

    const balanceContext = useMemo(() => {
        const account = accounts.find(a => a.id === formData.accountId);
        if (!account) return null;

        const rawAmount = formData.amount.replace(/,/g, '');
        const amount = parseFloat(rawAmount) || 0;
        
        let baseBalance = account.balance;
        if (editingTx && editingTx.accountId === account.id) {
            const oldAmountInAccountCurrency = convertToDefault(
                editingTx.amount, 
                editingTx.currency, 
                account.currency as string, 
                settings.exchangeRates
            );
            baseBalance += (editingTx.type === TransactionType.INCOME ? -oldAmountInAccountCurrency : oldAmountInAccountCurrency);
        }

        const txInAccountCurrency = convertToDefault(
            amount, 
            formData.currency as string, 
            account.currency as string, 
            settings.exchangeRates
        );
        
        const delta = formData.type === TransactionType.INCOME ? txInAccountCurrency : -txInAccountCurrency;
        const projectedBalance = baseBalance + delta;
        const isOverdrawn = projectedBalance < 0;

        return {
            accountCurrency: account.currency,
            baseBalance,
            projectedBalance,
            isOverdrawn,
            impact: delta
        };
    }, [formData.accountId, formData.amount, formData.currency, formData.type, accounts, editingTx, settings.exchangeRates]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setFormError(null);
        setIsSubmitting(true);
        setIsShaking(false);

        const newErrors: Record<string, string> = {};
        
        if (!formData.category) {
            newErrors.category = t('error_select_category');
        }
        
        if (!formData.accountId) {
            newErrors.accountId = t('error_payment_source');
        }

        if (!formData.date) {
            newErrors.date = t('error_date');
        }
        
        const amtStr = formData.amount.replace(/,/g, '');
        const amt = parseFloat(amtStr);
        if (formData.amount === '' || isNaN(amt) || amt <= 0) {
            newErrors.amount = t('error_amount_invalid');
        }

        if (balanceContext && formData.type === TransactionType.EXPENSE && balanceContext.isOverdrawn) {
            newErrors.amount = t('error_insufficient_funds');
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsSubmitting(false);
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 400);
            return;
        }

        try {
            await new Promise(r => setTimeout(r, 600));
            if (editingTx) {
                updateTransaction({
                    ...editingTx,
                    type: formData.type,
                    category: formData.category,
                    accountId: formData.accountId,
                    amount: amt,
                    currency: formData.currency,
                    date: new Date(formData.date).toISOString(),
                    note: formData.note
                });
            } else {
                addTransaction({
                    type: formData.type,
                    category: formData.category,
                    accountId: formData.accountId,
                    amount: amt,
                    currency: formData.currency,
                    date: new Date(formData.date).toISOString(),
                    note: formData.note
                });
            }
            setAddOpen(false);
            setEditingTx(null);
        } catch (err: any) {
            setFormError(t('error_save_failed'));
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 400);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEdit = (tx: Transaction) => {
        setEditingTx(tx);
        setErrors({});
        setFormError(null);
        setFormData({
            type: tx.type,
            category: tx.category,
            accountId: tx.accountId,
            amount: tx.amount.toLocaleString('en-US'),
            currency: tx.currency,
            date: tx.date.split('.')[0], 
            note: tx.note || ''
        });
        setAddOpen(true);
    };

    const transactionToDeleteDetails = txToDelete ? transactions.find(t => t.id === txToDelete) : null;

    return (
        <div className={cn(CLASSES.container, "!px-2 md:!px-4 lg:!px-6 !space-y-4 pb-24")}>
            <div className="w-full py-2 mb-4 -mx-4 px-4 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10 border-b border-gray-200/50 dark:border-dark-border/50 transition-all duration-200 no-print">
                {selectedIds.size > 0 ? (
                    <div className="w-full flex justify-between items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setSelectedIds(new Set())}
                                className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">
                                    {selectedIds.size}
                                </div>
                                <Typography variant="h3" className="text-sm font-bold text-gray-900 dark:text-white hidden sm:block">
                                    {t('selected')}
                                </Typography>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleExportExcel}
                                className={cn(CLASSES.buttonSecondary, "h-10 px-3 sm:px-4 shadow-sm flex items-center gap-2 text-xs font-bold rounded-xl")}
                                title={t('export_selected')}
                            >
                                <FileDown size={16} className="text-blue-500" /> 
                                <span className="hidden sm:inline">{t('export')}</span>
                            </button>
                            
                            <button 
                                onClick={() => setBulkDeleteConfirmOpen(true)}
                                className={cn(CLASSES.buttonDanger, "h-10 px-3 sm:px-4 shadow-sm flex items-center gap-2 text-xs font-bold rounded-xl")}
                                title={t('delete_selected')}
                            >
                                <Trash2 size={16} /> 
                                <span className="hidden sm:inline">{t('delete')}</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex flex-col md:flex-row justify-between items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex flex-1 w-full gap-2">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
                                <input 
                                    className={cn(
                                        CLASSES.input, 
                                        "pl-10 pr-10 h-11 text-sm w-full font-normal rounded-md border-2 focus:ring-8 focus:ring-emerald-500/5 transition-all duration-300"
                                    )} 
                                    placeholder={t('search_placeholder')} 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            {(searchTerm || sortField !== 'date' || sortDirection !== 'desc') && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSortField('date');
                                        setSortDirection('desc');
                                        setCurrentPage(1);
                                    }}
                                    className={cn(CLASSES.buttonSecondary, "h-11 px-4 whitespace-nowrap text-sm font-semibold text-gray-600 dark:text-gray-300")}
                                >
                                    {t('clear_filters')}
                                </button>
                            )}
                        </div>
                        
                        <div className="hidden md:flex items-center gap-2 w-full md:w-auto justify-end">
                            <div className="relative" ref={exportMenuRef}>
                                <button 
                                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} 
                                    className={cn(CLASSES.buttonSecondary, "h-11 w-11 p-0 rounded-xl flex items-center justify-center border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700")}
                                >
                                    <FileSpreadsheet size={20} className="text-gray-500 dark:text-gray-400" />
                                </button>
                                {isExportMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-dark-card border border-gray-200/60 dark:border-dark-border rounded-xl shadow-2xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5 overflow-hidden">
                                        <button 
                                            onClick={handleExportExcel}
                                            className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors h-10"
                                        >
                                            <FileSpreadsheet size={16} className="text-blue-500" /> {t('export_transactions')}
                                        </button>
                                        <button onClick={() => { setIsImportModalOpen(true); setIsExportMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-3 transition-colors h-10">
                                            <Upload size={16} /> {t('import_transactions')}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="relative" ref={addMenuRef}>
                                {can('Transactions', 'add') && (
                                    <button 
                                        onClick={() => setIsAddMenuOpen(!isAddMenuOpen)} 
                                        className={cn(CLASSES.buttonPrimary, "h-11 px-5 shadow-sm font-semibold flex items-center gap-2 rounded-xl")}
                                    >
                                        <PlusCircle size={18} />
                                        <span className="hidden sm:inline">{t('add')}</span>
                                        <ChevronDown size={14} className={cn("transition-transform hidden sm:block", isAddMenuOpen && "rotate-180")} />
                                    </button>
                                )}
                                {isAddMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-dark-card border border-gray-200/60 dark:border-dark-border rounded-xl shadow-2xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5 overflow-hidden">
                                        <button 
                                            onClick={() => openAddModal(TransactionType.INCOME)}
                                            className="w-full text-left px-4 py-2.5 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-3 transition-colors h-10"
                                        >
                                            <ArrowUp size={12} className="text-emerald-600" /> {t('add_income')}
                                        </button>
                                        <button 
                                            onClick={() => openAddModal(TransactionType.EXPENSE)}
                                            className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors h-10"
                                        >
                                            <ArrowDown size={12} className="text-red-600" /> {t('add_expense')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className={cn(CLASSES.card, "flex flex-col border-gray-200 dark:border-dark-border overflow-hidden min-h-[500px] h-[60vh] rounded-lg md:rounded-lg")}>
                <div className="flex-1 overflow-auto scrollbar-thin">
                    <table className="w-full text-left border-separate border-spacing-0 table-fixed min-w-[1500px]">
                        <thead className="sticky top-0 z-20">
                            <tr>
                                <th className={cn(premiumTh, "w-[50px] pl-4 text-center")}>
                                    <div className="flex items-center justify-center">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.size === paginatedTxs.length && paginatedTxs.length > 0} 
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500/20 transition-all cursor-pointer"
                                        />
                                    </div>
                                </th>
                                <th 
                                    className={cn(premiumTh, "w-36 pl-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group")}
                                    onClick={() => handleSort('date')}
                                >
                                    <div className="flex items-center gap-1">
                                        {t('date')}
                                        {sortField === 'date' && (
                                            sortDirection === 'asc' ? <ArrowUp size={14} className="text-emerald-600" /> : <ArrowDown size={14} className="text-emerald-600" />
                                        )}
                                        {sortField !== 'date' && <ArrowUpDown size={14} className="text-gray-400 opacity-0 group-hover:opacity-50 transition-opacity" />}
                                    </div>
                                </th>
                                <th className={cn(premiumTh, "w-32 text-center")}>{t('type')}</th>
                                <th 
                                    className={cn(premiumTh, "w-80 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group")}
                                    onClick={() => handleSort('category')}
                                >
                                    <div className="flex items-center gap-1">
                                        {t('classification')}
                                        {sortField === 'category' && (
                                            sortDirection === 'asc' ? <ArrowUp size={14} className="text-emerald-600" /> : <ArrowDown size={14} className="text-emerald-600" />
                                        )}
                                        {sortField !== 'category' && <ArrowUpDown size={14} className="text-gray-400 opacity-0 group-hover:opacity-50 transition-opacity" />}
                                    </div>
                                </th>
                                <th 
                                    className={cn(premiumTh, "w-44 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group")}
                                    onClick={() => handleSort('paymentSource')}
                                >
                                    <div className="flex items-center gap-1">
                                        {t('payment_source')}
                                        {sortField === 'paymentSource' && (
                                            sortDirection === 'asc' ? <ArrowUp size={14} className="text-emerald-600" /> : <ArrowDown size={14} className="text-emerald-600" />
                                        )}
                                        {sortField !== 'paymentSource' && <ArrowUpDown size={14} className="text-gray-400 opacity-0 group-hover:opacity-50 transition-opacity" />}
                                    </div>
                                </th>
                                <th 
                                    className={cn(premiumTh, "w-40 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group")}
                                    onClick={() => handleSort('amount')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        {t('original_amount')}
                                        {sortField === 'amount' && (
                                            sortDirection === 'asc' ? <ArrowUp size={14} className="text-emerald-600" /> : <ArrowDown size={14} className="text-emerald-600" />
                                        )}
                                        {sortField !== 'amount' && <ArrowUpDown size={14} className="text-gray-400 opacity-0 group-hover:opacity-50 transition-opacity" />}
                                    </div>
                                </th>
                                <th className={cn(premiumTh, "w-20 text-center")}>{t('currency')}</th>
                                <th className={cn(premiumTh, "w-40 text-right")}>{t('valuation')} ({settings.defaultCurrency})</th>
                                <th className={cn(premiumTh, "w-64")}>{t('internal_note')}</th>
                                <th className={cn(premiumTh, "w-32")}>{t('recorded_by')}</th>
                                <th className={cn(premiumTh, "w-12 text-center sticky right-0 shadow-[-4px_0_12px_rgba(0,0,0,0.03)] border-l bg-gray-50 dark:bg-gray-800 pr-4")}></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                            {paginatedTxs.length > 0 ? paginatedTxs.map((tx) => {
                                const isIncome = tx.type === TransactionType.INCOME;
                                const convertedAmt = convertToDefault(tx.amount, tx.currency, settings.defaultCurrency, settings.exchangeRates);
                                const isSelected = selectedIds.has(tx.id);
                                const account = accounts.find(a => a.id === tx.accountId);
                                return (
                                    <tr 
                                        key={tx.id} 
                                        className={cn(
                                            "hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10 transition-colors group cursor-pointer animate-in fade-in duration-300", 
                                            isSelected ? "bg-emerald-50/40 dark:bg-emerald-900/20" : "bg-white dark:bg-[#161b22]"
                                        )} 
                                        onClick={() => setViewingTx(tx)}
                                    >
                                        <td className={cn(premiumTd, "pl-4 text-center")} onClick={e => e.stopPropagation()}>
                                            <input 
                                                type="checkbox" 
                                                checked={isSelected}
                                                onChange={() => toggleSelect(tx.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500/20 transition-all cursor-pointer"
                                            />
                                        </td>
                                        <td className={premiumTd}>
                                            <div className="flex flex-col">
                                                <span className="font-normal tabular-nums text-gray-900 dark:text-gray-100">{formatDate(tx.date, settings.language)}</span>
                                                <span className="text-xs opacity-65">{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td className={cn(premiumTd, "text-center")}>
                                            <span className={cn("px-2 py-0.5 text-xs font-normal rounded-lg border", isIncome ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100")}>{tx.type}</span>
                                        </td>
                                        <td className={cn(premiumTd, "font-normal group-hover:text-emerald-600 transition-colors truncate")}>
                                            {getCategoryLabel(tx.category)}
                                        </td>
                                        <td className={cn(premiumTd, "font-normal text-gray-400 truncate")}>{account?.name || t('manual_registry')}</td>
                                        {/* Rule: Table Cell -> text-sm md:text-base font-medium */}
                                        <td className={cn(premiumTd, "text-right text-sm md:text-base font-medium tabular-nums", isIncome ? "text-emerald-600" : "text-red-600")}>
                                            {isIncome ? '+' : '-'}{new Intl.NumberFormat(settings.language === 'km' ? 'km-KH' : 'en-US', { minimumFractionDigits: 2 }).format(tx.amount)}
                                        </td>
                                        <td className={cn(premiumTd, "text-center font-normal text-gray-400")}>
                                            {tx.currency}
                                        </td>
                                        {/* Rule: Table Cell -> text-sm md:text-base font-medium */}
                                        <td className={cn(premiumTd, "text-right tabular-nums italic text-sm md:text-base font-medium")}>
                                            <span className={isIncome ? "text-emerald-600/80" : "text-red-600/80"}>
                                                {formatCurrency(convertedAmt, settings.defaultCurrency, settings.language)}
                                            </span>
                                        </td>
                                        <td className={premiumTd}>
                                            <span className="truncate block italic opacity-65">{tx.note || '—'}</span>
                                        </td>
                                        <td className={cn(premiumTd, "font-normal text-gray-400 truncate")}>
                                            {tx.createdBy || t('agent')}
                                        </td>
                                        <td className={cn(premiumTd, "text-center sticky right-0 bg-inherit border-l shadow-[-4px_0_12px_rgba(0,0,0,0.03)] pr-4")} onClick={e => e.stopPropagation()}>
                                            <div className="flex justify-center"><TransactionsMenu onView={() => setViewingTx(tx)} onEdit={() => openEdit(tx)} onDelete={() => { setTxToDelete(tx.id); setDeleteConfirmOpen(true); }} /></div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={11} className="py-24 text-center opacity-30 italic">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <History size={48} strokeWidth={1} className="text-gray-400" />
                                            <Typography variant="caption" className="font-bold text-sm">{t('no_transaction_history')}</Typography>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    pageSize={pageSize} 
                    totalRecords={filteredTransactions.length} 
                    onPageChange={setCurrentPage} 
                    onPageSizeChange={setPageSize}
                    t={t}
                />
            </div>

            {viewingTx && (
                <div className={CLASSES.modalOverlay}>
                    <div className={cn(CLASSES.modalContent, "max-w-xl animate-in zoom-in-95 duration-300 rounded-xl")}>
                        <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 shrink-0")}>
                            <div className="min-w-0">
                                <Typography variant="h3" className="truncate font-bold text-base">{t('transaction_details')}</Typography>
                            </div>
                            <button onClick={() => setViewingTx(null)} className={CLASSES.buttonGhost}><X size={18} /></button>
                        </div>

                        <div className={CLASSES.modalBody}>
                            <div className="w-full text-center py-3 md:py-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 mb-2 shadow-sm">
                                <Typography variant="caption" className="mb-2 opacity-60 block text-xs font-black">{t('transaction_amount')}</Typography>
                                {/* Rule: Summary Card Amount -> text-lg md:text-xl font-semibold */}
                                <Typography variant="h1" className={cn("text-lg md:text-xl tabular-nums tracking-tighter normal-case font-semibold leading-none", viewingTx.type === TransactionType.INCOME ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                                    {viewingTx.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(viewingTx.amount, viewingTx.currency, settings.language)}
                                </Typography>
                                {viewingTx.currency !== settings.defaultCurrency && (
                                    /* Rule: Tiny footnotes -> text-xs font-normal */
                                    <Typography variant="caption" className="block mt-2 italic opacity-50 text-xs font-normal">
                                        {t('estimated_valuation')}: {formatCurrency(convertToDefault(viewingTx.amount, viewingTx.currency, settings.defaultCurrency, settings.exchangeRates), settings.defaultCurrency, settings.language)}
                                    </Typography>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 sm:gap-y-8 px-1">
                                <DetailItem icon={Clock} label={t('date')} value={formatDateTime(viewingTx.date, settings.language)} />
                                <DetailItem icon={Landmark} label={t('payment_source')} value={accounts.find(a => a.id === viewingTx.accountId)?.name || t('manual_registry')} />
                                <DetailItem icon={Tag} label={t('classification')} value={getCategoryLabel(viewingTx.category)} />
                                <DetailItem icon={UserIcon} label={t('authoring_agent')} value={viewingTx.createdBy || t('agent')} />
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                                <Typography variant="caption" className="block mb-2 opacity-60 px-1 text-sx font-normal">{t('note')}</Typography>
                                <div className="w-full p-4 bg-gray-50 dark:bg-gray-800/60 rounded-md border border-gray-100 dark:border-gray-800 min-h-16 shadow-inner italic opacity-60 text-xs leading-relaxed">
                                    {viewingTx.note || t('no_internal_docs')}
                                </div>
                            </div>
                        </div>

                        <div className={cn(CLASSES.modalFooter, "flex-row items-center gap-3 py-2 md:py-2.5 px-4 md:px-5 bg-gray-50 dark:bg-gray-800/20")}>
                            <button onClick={() => setViewingTx(null)} className={cn(CLASSES.buttonPrimary, "flex-1 h-11 md:h-10 font-normal rounded-xl")}>{t('close')}</button>
                        </div>
                    </div>
                </div>
            )}



            {isAddOpen && (
                <div className={cn(CLASSES.modalOverlay, "sm:p-4 p-0")}>
                    <div 
                        style={{ height: window.innerWidth < 640 ? `${visualViewportHeight}px` : undefined }}
                        className={cn(CLASSES.modalContent, "max-w-xl sm:h-auto sm:max-h-[90dvh] rounded-none sm:rounded-[2.5rem] animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 relative overflow-hidden flex flex-col rounded-xl", isShaking && "animate-shake")}
                    >
                        <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 shrink-0")}>
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-1.5 rounded-xl border",
                                    formData.type === TransactionType.INCOME ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                                )}>
                                    {formData.type === TransactionType.INCOME ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                </div>
                                <Typography variant="h2" className="text-base md:text-lg font-semibold">
                                    {editingTx ? t('update_transaction') : (formData.type === TransactionType.INCOME ? t('new_income') : t('new_expense'))}
                                </Typography>
                            </div>
                            <button onClick={() => setAddOpen(false)} className={CLASSES.buttonGhost} disabled={isSubmitting}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className={cn(CLASSES.modalBody, "p-4 md:p-5 space-y-4 flex-1 overflow-y-auto")}>
                                {formError && (
                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl flex items-start gap-2.5 text-xs font-bold animate-in slide-in-from-top-2">
                                        <AlertCircle size={16} className="text-red-500 shrink-0" />
                                        <Typography variant="caption" className="text-red-600 dark:text-red-400 font-bold">{formError}</Typography>
                                    </div>
                                )}
                                
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Typography variant="label" className="text-sm font-normal">{t('classification')}</Typography>
                                            <CategorySelect 
                                                value={formData.category}
                                                onChange={v => handleFieldChange('category', v)}
                                                accounts={chartOfAccounts}
                                                type={formData.type}
                                                t={t}
                                                error={errors.category}
                                                language={settings.language}
                                            />
                                            {errors.category && <Typography variant="caption" className="text-red-500 font-bold px-1 block animate-in fade-in slide-in-from-top-1 text-[10px]">{errors.category}</Typography>}
                                        </div>
                                        <div className="space-y-1">
                                            <Typography variant="label" className="text-sm font-normal">{t('payment_source')}</Typography>
                                            <AccountSelect 
                                                value={formData.accountId}
                                                onChange={val => {
                                                    const acc = accounts.find(a => a.id === val);
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        accountId: val,
                                                        currency: acc ? acc.currency : settings.defaultCurrency
                                                    }));
                                                    clearFieldError('accountId');
                                                }}
                                                accounts={accounts.filter(a => a.status === AccountStatus.DEFAULT || a.id === formData.accountId)}
                                                t={t}
                                                error={errors.accountId}
                                            />
                                            {errors.accountId && <Typography variant="caption" className="text-red-500 font-bold px-1 block animate-in fade-in slide-in-from-top-1 text-[10px]">{errors.accountId}</Typography>}
                                            {balanceContext && (
                                                <div className="px-1 pt-0.5 animate-in fade-in slide-in-from-top-1">
                                                    <Typography 
                                                        variant="caption" 
                                                        className={cn(
                                                            "text-[11px] font-bold tabular-nums tracking-tight transition-colors", 
                                                            balanceContext.isOverdrawn ? "text-red-500" : "text-emerald-600 opacity-80"
                                                        )}
                                                    >
                                                        {t('available_balance', { amount: formatCurrency(balanceContext.projectedBalance, balanceContext.accountCurrency as string, settings.language) })}
                                                    </Typography>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        {/* Rule: Form Input -> text-base font-semibold */}
                                        <NumericInput 
                                            label={t('amount')}
                                            required 
                                            value={formData.amount} 
                                            onChange={v => handleFieldChange('amount', v)} 
                                            error={errors.amount} 
                                            inputClassName="h-12 border-2 text-base font-semibold"
                                            suffix={formData.currency as string}
                                        />
                                    </div>

                                    <CustomDatePicker 
                                        type="datetime-local" 
                                        label={t('log_time')}
                                        required 
                                        value={formData.date} 
                                        onChange={v => handleFieldChange('date', v)}
                                        error={errors.date}
                                        inputClassName="h-12 rounded-md border-2 text-sm font-semibold"
                                    />

                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <Typography variant="label" className="text-sm font-normal">{t('internal_note')}</Typography>
                                            <Typography variant="caption" className={cn("font-normal text-xs", formData.note.length >= 110 ? "text-orange-500" : "opacity-40")}>
                                                {formData.note.length} / 120
                                            </Typography>
                                        </div>
                                        <textarea 
                                            maxLength={120}
                                            className={cn(CLASSES.input, "h-20 py-3 resize-none text-sm font-medium rounded-md border-2 focus:ring-8 focus:ring-emerald-500/5 transition-all duration-300 focus:border-emerald-500")} 
                                            value={formData.note} 
                                            onChange={e => handleFieldChange('note', e.target.value)} 
                                            placeholder={t('add_details_placeholder')} 
                                        />
                                    </div>
                                </div>
                            </div>
                        
                            <div className={cn(
                                "border-t border-gray-100 dark:border-gray-800 z-30 shrink-0",
                                "flex flex-row items-center gap-3 bg-white dark:bg-[#161b22]",
                                "transition-all duration-300 ease-in-out px-4 md:px-5",
                                isKeyboardOpen ? "py-2" : "py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
                            )}>
                                <button type="button" onClick={() => setAddOpen(false)} className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-12 border-2 font-bold rounded-xl")}>{t('cancel')}</button>
                                <button type="submit" disabled={isSubmitting} className={cn(CLASSES.buttonPrimary, "flex-1 h-11 md:h-12 text-sm font-bold rounded-xl")}>
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : t('save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isDeleteConfirmOpen && transactionToDeleteDetails && (
                <div className={CLASSES.modalOverlay}>
                    <div className={cn(CLASSES.modalContent, "max-w-md animate-in zoom-in-95 duration-300 rounded-xl")}>
                        <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 shrink-0 justify-center")}>
                            <Typography variant="h2" className="text-base md:text-lg font-semibold">{t('confirm_removal')}</Typography>
                        </div>
                        <div className={cn(CLASSES.modalBody, "p-6 text-center space-y-6")}>
                            
                            <div className="space-y-4">
                                <Typography variant="body" className="font-medium text-gray-600 dark:text-gray-400 text-sm">
                                    {t('delete_confirm_single')}
                                </Typography>
                                
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-dark-border text-left space-y-3 shadow-inner">
                                    <div className="flex justify-between items-center">
                                        <Typography variant="caption" className="font-semibold text-gray-400 text-xs">{t('classification')}</Typography>
                                        <Typography variant="body" className="font-bold text-sm text-gray-900 dark:text-white">{getCategoryLabel(transactionToDeleteDetails.category)}</Typography>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <Typography variant="caption" className="font-semibold text-gray-400 text-xs">{t('amount')}</Typography>
                                        <Typography variant="body" className={cn("font-bold text-sm", transactionToDeleteDetails.type === TransactionType.INCOME ? "text-emerald-600" : "text-red-600")}>
                                            {transactionToDeleteDetails.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(transactionToDeleteDetails.amount, transactionToDeleteDetails.currency, settings.language)}
                                        </Typography>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <Typography variant="caption" className="font-semibold text-gray-400 text-xs">{t('log_time')}</Typography>
                                        <Typography variant="body" className="font-medium text-sm tabular-nums">{formatDate(transactionToDeleteDetails.date, settings.language)}</Typography>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                                    <Info size={14} className="text-red-600 shrink-0" />
                                    <Typography variant="caption" className="text-red-600 font-bold">
                                        {t('action_cannot_be_undone')}
                                    </Typography>
                                </div>
                            </div>
                        </div>
                        <div className={cn(CLASSES.modalFooter, "flex-row items-center gap-3 py-2 md:py-2.5 px-4 md:px-5 bg-gray-50 dark:bg-gray-800/20")}>
                            <button onClick={() => setDeleteConfirmOpen(false)} className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-10 border-2 font-bold rounded-xl")}>{t('cancel')}</button>
                            <button onClick={() => { if(txToDelete) deleteTransaction(txToDelete); setDeleteConfirmOpen(false); setTxToDelete(null); }} className={cn(CLASSES.buttonDanger, "flex-1 h-11 md:h-10 font-bold rounded-xl")}>{t('delete_entry')}</button>
                        </div>
                    </div>
                </div>
            )}

            {isImportModalOpen && (
                <ImportModal 
                    onClose={() => setIsImportModalOpen(false)} 
                    onImport={processImport} 
                />
            )}

            {isBulkDeleteConfirmOpen && (
                <div className={CLASSES.modalOverlay}>
                    <div className={cn(CLASSES.modalContent, "max-w-md animate-in zoom-in-95 duration-300 rounded-xl")}>
                        <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 shrink-0 justify-center")}>
                            <Typography variant="h2" className="text-base md:text-lg font-semibold">{t('batch_deletion')}</Typography>
                        </div>
                        <div className={cn(CLASSES.modalBody, "p-6 text-center space-y-6")}>
                            <div className="space-y-3">
                                <Typography variant="h3" className="text-lg font-semibold">{t('delete_multiple_confirm', { count: selectedIds.size })}</Typography>
                                <Typography variant="body" className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                                    {t('batch_delete_desc')}
                                </Typography>
                                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 mt-4">
                                    <Info size={14} className="text-red-600 shrink-0" />
                                    <Typography variant="caption" className="text-red-600 font-bold text-xs">
                                        {t('action_cannot_be_undone')}
                                    </Typography>
                                </div>
                            </div>
                        </div>
                        <div className={cn(CLASSES.modalFooter, "flex-row items-center gap-3 py-2 md:py-2.5 px-4 md:px-5 bg-gray-50 dark:bg-gray-800/20")}>
                            <button onClick={() => setBulkDeleteConfirmOpen(false)} className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-10 border-2 font-bold rounded-xl")}>{t('cancel')}</button>
                            <button onClick={handleBulkDelete} className={cn(CLASSES.buttonDanger, "flex-1 h-11 md:h-10 font-bold rounded-xl")}>{t('confirm_batch_delete')}</button>
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
            <Typography variant="caption" className="opacity-75 truncate font-normal">{label}</Typography>
        </div>
        <Typography variant="body" className="truncate font-medium text-sm">{value}</Typography>
    </div>
);
