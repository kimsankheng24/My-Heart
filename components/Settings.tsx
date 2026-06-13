
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../store';
import {
    Currency, UserStatus, User, Role, ChartOfAccount,
    AppModuleName, PermissionAction, ModulePermissions
} from '../types';
import {
    Globe, RefreshCw, X, PlusCircle, Shield,
    Coins, AlertTriangle, Search, Download,
    Settings2, Sun, Moon, User as UserIcon, Camera,
    Clock, MapPin, Check, Fingerprint, ShieldCheck,
    Lock, Loader2, Phone, Home, Upload, ChevronRight, Info,
    CornerDownRight, Edit2, ChevronDown, Monitor,
    FileSpreadsheet, Trash2, CheckCircle2,
    ChevronsLeft, ChevronLeft, ChevronsRight,
    BookOpen
} from 'lucide-react';
import { cn, formatDate, formatDateTime, CLASSES } from '../utils';
import { SettingsMenu } from './menus/SettingsMenu';
import { Typography } from './Typography';
import { NumericInput } from './NumericInput';
import * as XLSX from 'xlsx';

// Standardized Premium Table classes
const premiumTh = cn(CLASSES.typography.tableHeader, "px-3 py-2 align-middle bg-[#f9fafb] dark:bg-gray-800/80 border-b border-[#e5e7eb] dark:border-dark-border first:rounded-tl-lg last:rounded-tr-lg whitespace-nowrap text-sm font-semibold");
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
        const headers = ['Account Code', 'Account Name', 'Local Name', 'Account Type', 'Sub of', 'Description'];
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "ChartOfAccounts_Template.xlsx");
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
                const workbook = XLSX.read(data, { type: 'array' });
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
                    <Typography variant="h2">{t('import_accounts')}</Typography>
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

// Pagination Component
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
                    <Typography variant="label" className="font-semibold text-sm">{t('page_size')}</Typography>
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

const ParentAccountSelect: React.FC<{
    value: string;
    onChange: (value: string) => void;
    accounts: ChartOfAccount[];
    currentAccountId?: string;
    t: (key: string) => string;
}> = ({ value, onChange, accounts, currentAccountId, t }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize expanded state to show the selected item
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
        const initial = new Set<string>();
        if (value) {
            let current = accounts.find(a => a.id === value);
            while (current && current.isSubOf) {
                initial.add(current.isSubOf);
                current = accounts.find(a => a.id === current?.isSubOf);
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
        const childrenMap = new Map<string, ChartOfAccount[]>();
        const roots: ChartOfAccount[] = [];

        // Build hierarchy
        accounts.forEach(c => {
            if (c.id === currentAccountId) return;
            if (c.isSubOf && accounts.some(p => p.id === c.isSubOf)) {
                const list = childrenMap.get(c.isSubOf) || [];
                list.push(c);
                childrenMap.set(c.isSubOf, list);
            } else {
                roots.push(c);
            }
        });

        const flatten = (nodes: ChartOfAccount[], depth: number): Array<ChartOfAccount & { depth: number, hasChildren: boolean }> => {
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
    }, [accounts, currentAccountId, expandedIds]);

    const selectedAccount = accounts.find(a => a.id === value);

    const toggleExpand = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className="relative" ref={containerRef}>
            <div
                className={cn(CLASSES.select, "h-11 rounded-md border-2 flex items-center justify-between cursor-pointer bg-white dark:bg-dark-card", isOpen && "ring-2 ring-emerald-500/20 border-emerald-500")}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={cn("block truncate text-sm", !value && "text-gray-500")}>
                    {selectedAccount ? (
                        <span className="flex items-center gap-2">
                            <span className="font-mono text-emerald-600 font-bold text-xs">{selectedAccount.code}</span>
                            <span>{selectedAccount.name}</span>
                        </span>
                    ) : t('none_top_level')}
                </span>
                <ChevronDown size={14} className="text-gray-400" />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-200">
                    <div
                        className={cn("px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors", value === "" && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600")}
                        onClick={() => { onChange(""); setIsOpen(false); }}
                    >
                        {t('none_top_level')}
                    </div>
                    {treeItems.map(item => (
                        <div
                            key={item.id}
                            className={cn(
                                "px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center",
                                value === item.id && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 font-medium"
                            )}
                            style={{ paddingLeft: `${(item.depth * 16) + 12}px` }}
                            onClick={() => { onChange(item.id); setIsOpen(false); }}
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
                            <span className="font-mono text-xs mr-2 opacity-75 text-emerald-600 font-semibold">{item.code}</span>
                            <span className="truncate">{item.name}</span>
                            {value === item.id && <Check size={14} className="ml-auto text-emerald-600 shrink-0" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ChartOfAccountsModal: React.FC<{
    account?: ChartOfAccount;
    onClose: () => void;
    onSave: (data: Omit<ChartOfAccount, 'id'> & { id?: string }) => void;
}> = ({ account, onClose, onSave }) => {
    const { chartOfAccounts, t } = useApp();
    const [formData, setFormData] = useState({
        code: account?.code || '',
        name: account?.name || '',
        localName: account?.localName || '',
        type: account?.type || 'Expense',
        description: account?.description || '',
        isSubOf: account?.isSubOf || ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    // Build hierarchical options for Parent Account select
    const parentOptions = useMemo(() => {
        const validIds = new Set(chartOfAccounts.map(c => c.id));
        const childrenMap = new Map<string, ChartOfAccount[]>();
        const roots: ChartOfAccount[] = [];

        chartOfAccounts.forEach(c => {
            if (c.isSubOf && validIds.has(c.isSubOf)) {
                const list = childrenMap.get(c.isSubOf) || [];
                list.push(c);
                childrenMap.set(c.isSubOf, list);
            } else {
                roots.push(c);
            }
        });

        const flatten = (nodes: ChartOfAccount[], depth: number): Array<ChartOfAccount & { depth: number }> => {
            return nodes.sort((a, b) => a.code.localeCompare(b.code)).flatMap(node => [
                { ...node, depth },
                ...flatten(childrenMap.get(node.id) || [], depth + 1)
            ]);
        };

        return flatten(roots, 0);
    }, [chartOfAccounts]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        const newErrors: Record<string, string> = {};

        if (!formData.code) newErrors.code = t('gl_code_required');
        else if (chartOfAccounts.some(c => c.code === formData.code && c.id !== account?.id)) {
            newErrors.code = t('gl_code_duplicate');
        }

        if (!formData.name.trim()) newErrors.name = t('name_required');
        if (!formData.localName.trim()) newErrors.localName = t('local_name_required');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            await new Promise(r => setTimeout(r, 500));
            onSave({
                id: account?.id,
                ...formData
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={cn(CLASSES.modalOverlay, "sm:p-4 p-0")}>
            <div
                style={{ height: window.innerWidth < 640 ? `${visualViewportHeight}px` : undefined }}
                className={cn(CLASSES.modalContent, "max-w-xl sm:h-auto sm:max-h-[90dvh] rounded-none sm:rounded-xl animate-in zoom-in-95 duration-300 relative overflow-hidden flex flex-col")}
            >
                <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 shrink-0")}>
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl md:rounded-xl border border-emerald-100 dark:border-emerald-800">
                            <BookOpen size={18} />
                        </div>
                        <Typography variant="h2" className="text-base md:text-lg font-semibold">{account ? t('edit_account') : t('new_account')}</Typography>
                    </div>
                    <button onClick={onClose} className={CLASSES.buttonGhost} disabled={isSubmitting}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className={cn(CLASSES.modalBody, "p-4 md:p-5 space-y-4 flex-1 overflow-y-auto")}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Typography variant="label">{t('account_type')}</Typography>
                                <div className="relative group">
                                    <select
                                        className={cn(CLASSES.select, "h-11 rounded-md border-2")}
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        disabled={isSubmitting || !!formData.isSubOf} // Disable if sub-account
                                    >
                                        {['Asset', 'Liability', 'Equity', 'Income', 'Expense'].map(t_val => (
                                            <option key={t_val} value={t_val}>{t(t_val.toLowerCase()) || t_val}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Typography variant="label">{t('gl_code')}</Typography>
                                <input
                                    className={cn(CLASSES.input, "h-11 rounded-md border-2 font-mono", errors.code && CLASSES.inputError)}
                                    value={formData.code}
                                    onChange={e => {
                                        // Accept alphanumeric characters, max 10 chars
                                        const val = e.target.value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase().slice(0, 10);
                                        setFormData({ ...formData, code: val });
                                        if (errors.code) setErrors({ ...errors, code: '' });
                                    }}
                                    placeholder="10100"
                                    disabled={isSubmitting}
                                />
                                {errors.code && <Typography variant="caption" className="text-red-500 px-1 block mt-0.5">{errors.code}</Typography>}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Typography variant="label">{t('name')}</Typography>
                            <input
                                className={cn(CLASSES.input, "h-11 rounded-md border-2", errors.name && CLASSES.inputError)}
                                value={formData.name}
                                onChange={e => { setFormData({ ...formData, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: '' }); }}
                                placeholder="e.g. Savings Account"
                                disabled={isSubmitting}
                            />
                            {errors.name && <Typography variant="caption" className="text-red-500 px-1 block mt-0.5">{errors.name}</Typography>}
                        </div>

                        <div className="space-y-1">
                            <Typography variant="label">{t('local_name')}</Typography>
                            <input
                                className={cn(CLASSES.input, "h-11 rounded-md border-2 font-khmer", errors.localName && CLASSES.inputError)}
                                value={formData.localName}
                                onChange={e => { setFormData({ ...formData, localName: e.target.value }); if (errors.localName) setErrors({ ...errors, localName: '' }); }}
                                placeholder="ឈ្មោះគណនី (ខ្មែរ)"
                                disabled={isSubmitting}
                            />
                            {errors.localName && <Typography variant="caption" className="text-red-500 px-1 block mt-0.5">{errors.localName}</Typography>}
                        </div>

                        <div className="space-y-1">
                            <Typography variant="label">{t('parent_account')} ({t('optional')})</Typography>
                            <ParentAccountSelect
                                value={formData.isSubOf}
                                onChange={(id) => {
                                    const parent = chartOfAccounts.find(c => c.id === id);
                                    setFormData({
                                        ...formData,
                                        isSubOf: id,
                                        type: parent ? parent.type : formData.type
                                    });
                                }}
                                accounts={chartOfAccounts}
                                currentAccountId={account?.id}
                                t={t}
                            />
                        </div>

                        <div className="space-y-1">
                            <Typography variant="label">{t('description')}</Typography>
                            <textarea
                                className={cn(CLASSES.input, "h-20 py-2 resize-none rounded-md border-2 text-sm")}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder={t('purpose_placeholder')}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                    <div className={cn(
                        "border-t border-gray-100 dark:border-gray-800 z-30 shrink-0",
                        "flex flex-row items-center gap-3 bg-white dark:bg-[#161b22]",
                        "transition-all duration-300 ease-in-out px-4 md:px-5",
                        isKeyboardOpen ? "py-2" : "py-4 pb-[max(1.2rem,env(safe-area-inset-bottom))]"
                    )}>
                        <button type="button" onClick={onClose} disabled={isSubmitting} className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-10 border-2 font-semibold rounded-xl")}>{t('cancel')}</button>
                        <button type="submit" disabled={isSubmitting} className={cn(CLASSES.buttonPrimary, "flex-1 h-11 md:h-10 shadow-md font-semibold rounded-xl")}>
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : t('save_account')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UserModal: React.FC<{
    user?: User;
    onClose: () => void;
    onSave: (userData: any) => void;
}> = ({ user, onClose, onSave }) => {
    const { roles, t, users, currentUser } = useApp();
    const [name, setName] = useState(user?.name || '');
    const [userId, setUserId] = useState(user?.id || '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(user?.role || roles[0]?.name || '');
    const [status, setStatus] = useState(user?.status || UserStatus.ACTIVE);
    const [phone, setPhone] = useState(user?.phone || '');
    const [address, setAddress] = useState(user?.address || '');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [visualViewportHeight, setVisualViewportHeight] = useState(window.innerHeight);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        const newErrors: Record<string, string> = {};

        if (!name.trim()) newErrors.name = t('name_required');
        if (!userId.trim()) newErrors.userId = t('user_id_error_required');
        else if (users.some(u => u.id === userId.toUpperCase() && (!user || u.id !== user.id))) {
            newErrors.userId = t('user_id_error_duplicate');
        }

        if (!user && !password.trim()) newErrors.password = t('password_error_new');
        if (!role) newErrors.role = t('role_error_required');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            await new Promise(r => setTimeout(r, 600));
            onSave({
                id: userId.toUpperCase(),
                name,
                password: password || user?.password,
                role,
                status,
                phone,
                address
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={cn(CLASSES.modalOverlay, "sm:p-4 p-0")}>
            <div
                style={{ height: window.innerWidth < 640 ? `${visualViewportHeight}px` : undefined }}
                className={cn(CLASSES.modalContent, "max-w-xl sm:h-auto sm:max-h-[90dvh] rounded-none sm:rounded-xl animate-in zoom-in-95 duration-300 relative overflow-hidden flex flex-col")}
            >
                <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 shrink-0")}>
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl border border-emerald-100 dark:border-emerald-800">
                            <UserIcon size={18} />
                        </div>
                        <Typography variant="h2" className="text-base md:text-lg font-semibold">{user ? t('edit_member') : t('new_member')}</Typography>
                    </div>
                    <button onClick={onClose} className={CLASSES.buttonGhost} disabled={isSubmitting}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className={cn(CLASSES.modalBody, "p-4 md:p-5 space-y-3 md:space-y-4 flex-1 overflow-y-auto")}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <div className="space-y-1">
                                <Typography variant="label">{t('name')} *</Typography>
                                <div className="relative">
                                    <input required disabled={isSubmitting} className={cn(CLASSES.input, "pl-10 h-11 md:h-10 rounded-md border-2 focus:border-emerald-500", errors.name && CLASSES.inputError)} value={name} onChange={e => setName(e.target.value)} placeholder={t('name_placeholder')} />
                                    <UserIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                </div>
                                {errors.name && <Typography variant="caption" className="text-red-500 px-1 block mt-0.5">{errors.name}</Typography>}
                            </div>
                            <div className="space-y-1">
                                <Typography variant="label">{t('user_id')} *</Typography>
                                <div className="relative">
                                    <input required disabled={isSubmitting || !!user} className={cn(CLASSES.input, "pl-10 h-11 md:h-10 uppercase rounded-md border-2 focus:border-emerald-500", errors.userId && CLASSES.inputError)} value={userId} onChange={e => setUserId(e.target.value.toUpperCase())} placeholder="LOGIN_NAME" />
                                    <Fingerprint size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                </div>
                                {errors.userId && <Typography variant="caption" className="text-red-500 px-1 block mt-0.5">{errors.userId}</Typography>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <div className="space-y-1">
                                <Typography variant="label">{user ? t('update_password') : t('password') + ' *'}</Typography>
                                <div className="relative">
                                    <input type="password" disabled={isSubmitting} className={cn(CLASSES.input, "pl-10 h-11 md:h-10 rounded-md border-2 focus:border-emerald-500", errors.password && CLASSES.inputError)} value={password} onChange={e => setPassword(e.target.value)} placeholder={user ? t('leave_blank_password') : '••••••••'} />
                                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                </div>
                                {errors.password && <Typography variant="caption" className="text-red-500 px-1 block mt-0.5">{errors.password}</Typography>}
                            </div>
                            <div className="space-y-1">
                                <Typography variant="label">{t('role_name')} *</Typography>
                                <div className="relative group">
                                    <select required disabled={isSubmitting} className={cn(CLASSES.select, "pl-10 pr-10 h-11 md:h-10 rounded-md border-2 focus:border-emerald-500")} value={role} onChange={e => setRole(e.target.value)}>
                                        <option value="">{t('choose_role')}</option>
                                        {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                    </select>
                                    <Shield size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-emerald-500 transition-colors" />
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-emerald-500 transition-colors" />
                                </div>
                                {errors.role && <Typography variant="caption" className="text-red-500 px-1 block mt-0.5">{errors.role}</Typography>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <div className="space-y-1">
                                <Typography variant="label">{t('phone')}</Typography>
                                <div className="relative">
                                    <input disabled={isSubmitting} className={cn(CLASSES.input, "pl-10 h-11 md:h-10 rounded-md border-2 focus:border-emerald-500")} value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('phone_placeholder')} />
                                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Typography variant="label">{t('member_status')} * {user?.id === currentUser?.id && <span className="text-gray-400 font-normal ml-1">({t('cannot_change_own_status', { defaultValue: 'Cannot change own status' })})</span>}</Typography>
                                <div className="relative group">
                                    <select required disabled={isSubmitting || user?.id === currentUser?.id} className={cn(CLASSES.select, "h-11 md:h-10 pr-10 rounded-md border-2 focus:border-emerald-500", user?.id === currentUser?.id && "bg-gray-100 dark:bg-gray-800/50 cursor-not-allowed")} value={status} onChange={e => setStatus(e.target.value as UserStatus)}>
                                        {Object.values(UserStatus).map(s => <option key={s} value={s}>{t(s.toLowerCase()) || s}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-emerald-500 transition-colors" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Typography variant="label">{t('address')}</Typography>
                            <div className="relative">
                                <textarea disabled={isSubmitting} className={cn(CLASSES.input, "pl-10 pt-2 h-16 resize-none rounded-md border-2 focus:border-emerald-500")} value={address} onChange={e => setAddress(e.target.value)} placeholder={t('address_placeholder')} />
                                <Home size={14} className="absolute left-3.5 top-3 text-gray-400" />
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-100 dark:border-gray-800 p-4 md:p-5 flex gap-3">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-10 border-2 font-semibold rounded-xl")}>{t('cancel')}</button>
                        <button type="submit" disabled={isSubmitting} className={cn(CLASSES.buttonPrimary, "flex-1 h-11 md:h-10 shadow-md font-semibold rounded-xl")}>
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : (user ? t('update') : t('save'))}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RolePermissionsModal: React.FC<{
    role?: Role;
    onClose: () => void;
    onSave: (roleData: Omit<Role, 'id'> & { id?: string }) => void;
}> = ({ role, onClose, onSave }) => {
    const { t } = useApp();
    const modules: AppModuleName[] = ['Transactions', 'Accounts', 'Budgets', 'Goals', 'Assets', 'Reports', 'Analytics', 'Settings'];
    const actions: PermissionAction[] = ['view', 'add', 'edit', 'delete'];

    const initialPermissions = useMemo(() => {
        const perms: Record<string, ModulePermissions> = {};
        modules.forEach(m => {
            perms[m] = role?.permissions[m] || { view: false, add: false, edit: false, delete: false };
        });
        return perms;
    }, [role]);

    const [name, setName] = useState(role?.name || '');
    const [description, setDescription] = useState(role?.description || '');
    const [permissions, setPermissions] = useState<Record<string, ModulePermissions>>(initialPermissions);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [visualViewportHeight, setVisualViewportHeight] = useState(window.innerHeight);

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

    const togglePermission = (module: string, action: PermissionAction) => {
        setPermissions(prev => {
            const modulePerms = { ...prev[module] };
            const newValue = !modulePerms[action];
            modulePerms[action] = newValue;

            if (newValue && action !== 'view') {
                modulePerms.view = true;
            }
            if (!newValue && action === 'view') {
                modulePerms.add = false;
                modulePerms.edit = false;
                modulePerms.delete = false;
            }

            return { ...prev, [module]: modulePerms };
        });
    };

    const toggleAll = (module: string, checked: boolean) => {
        setPermissions(prev => ({
            ...prev,
            [module]: { view: checked, add: checked, edit: checked, delete: checked }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: role?.id, name, description, permissions });
    };

    return (
        <div className={cn(CLASSES.modalOverlay, "sm:p-4 p-0")}>
            <div
                style={{ height: window.innerWidth < 640 ? `${visualViewportHeight}px` : undefined }}
                className={cn(CLASSES.modalContent, "max-w-3xl sm:h-auto sm:max-h-[90dvh] rounded-none sm:rounded-xl animate-in zoom-in-95 duration-300 relative overflow-hidden flex flex-col")}
            >
                <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 shrink-0")}>
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl border border-emerald-100 dark:border-emerald-800">
                            <ShieldCheck size={18} />
                        </div>
                        <Typography variant="h2" className="text-base md:text-lg font-semibold">{role ? t('edit_role') : t('add_role')}</Typography>
                    </div>
                    <button onClick={onClose} className={CLASSES.buttonGhost}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className={cn(CLASSES.modalBody, "p-4 md:p-5 space-y-4 flex-1 overflow-y-auto")}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Typography variant="label">{t('role_identifier')} *</Typography>
                                <input required className={cn(CLASSES.input, "h-11 md:h-10 rounded-md border-2 font-semibold")} value={name} onChange={e => setName(e.target.value)} placeholder={t('role_placeholder')} />
                            </div>
                            <div className="space-y-1">
                                <Typography variant="label">{t('description')}</Typography>
                                <input className={cn(CLASSES.input, "h-11 md:h-10 rounded-md border-2")} value={description} onChange={e => setDescription(e.target.value)} placeholder={t('role_desc_placeholder')} />
                            </div>
                        </div>

                        <div className="pt-2">
                            <Typography variant="label" className="block mb-2 px-1 font-semibold text-gray-400">{t('functional_permissions')}</Typography>
                            <div className="overflow-hidden border border-gray-100 dark:border-dark-border rounded-lg md:rounded-lg">
                                <table className="w-full border-separate border-spacing-0">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-800/50">
                                            <th className={cn(premiumTh, "pl-4")}>{t('module')}</th>
                                            {actions.map(a => (
                                                <th key={a} className={cn(premiumTh, "text-center capitalize w-20")}>{t(a)}</th>
                                            ))}
                                            <th className={cn(premiumTh, "text-center w-20")}>{t('all')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
                                        {modules.map(m => {
                                            const isAllChecked = actions.every(a => permissions[m][a]);
                                            return (
                                                <tr key={m} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors group">
                                                    <td className={cn(premiumTd, "font-semibold pl-4")}>{t(m.toLowerCase()) || m}</td>
                                                    {actions.map(a => (
                                                        <td key={a} className={cn(premiumTd, "text-center")}>
                                                            <div className="flex items-center justify-center">
                                                                <input
                                                                    type="checkbox"
                                                                    className={cn(
                                                                        "w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer transition-all",
                                                                        "checked:bg-emerald-600 checked:border-emerald-600 accent-emerald-600"
                                                                    )}
                                                                    checked={permissions[m][a]}
                                                                    onChange={() => togglePermission(m, a)}
                                                                />
                                                            </div>
                                                        </td>
                                                    ))}
                                                    <td className={cn(premiumTd, "text-center bg-gray-50/30 dark:bg-gray-800/30")}>
                                                        <div className="flex items-center justify-center">
                                                            <input
                                                                type="checkbox"
                                                                className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer accent-emerald-600"
                                                                checked={isAllChecked}
                                                                onChange={(e) => toggleAll(m, e.target.checked)}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-100 dark:border-gray-800 p-4 md:p-5 flex gap-3">
                        <button type="button" onClick={onClose} className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-10 border-2 font-semibold rounded-xl")}>{t('cancel')}</button>
                        <button type="submit" className={cn(CLASSES.buttonPrimary, "flex-1 h-11 md:h-10 shadow-md font-semibold rounded-xl")}>{t('commit_role')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ChartOfAccountDetailModal: React.FC<{
    account: ChartOfAccount;
    onClose: () => void;
}> = ({ account, onClose }) => {
    const { chartOfAccounts, t } = useApp();
    const parentAccount = account.isSubOf ? chartOfAccounts.find(c => c.id === account.isSubOf) : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div 
                className="bg-white dark:bg-[#161b22] rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh] animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <Typography variant="h3" className="text-lg md:text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                        {t('account_details')}
                    </Typography>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>
                
                <div className="p-4 md:p-6 overflow-y-auto scrollbar-thin space-y-5">
                    <div className="space-y-1">
                        <Typography variant="label" className="text-gray-500">{t('account_code')}</Typography>
                        <div className="font-mono text-emerald-600 font-bold text-lg">{account.code}</div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Typography variant="label" className="text-gray-500">{t('name')}</Typography>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{account.name}</div>
                        </div>
                        <div className="space-y-1">
                            <Typography variant="label" className="text-gray-500">{t('local_name')}</Typography>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{account.localName || '-'}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Typography variant="label" className="text-gray-500">{t('account_type')}</Typography>
                            <div><span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-semibold">{account.type}</span></div>
                        </div>
                        <div className="space-y-1">
                            <Typography variant="label" className="text-gray-500">{t('parent_account')}</Typography>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                {parentAccount ? `${parentAccount.code} - ${parentAccount.name}` : '-'}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Typography variant="label" className="text-gray-500">{t('description')}</Typography>
                        <div className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl min-h-[60px]">
                            {account.description || '-'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ChartOfAccountsTab: React.FC = () => {
    const { chartOfAccounts, addChartOfAccount, addChartOfAccounts, updateChartOfAccount, deleteChartOfAccount, deleteChartOfAccounts, t } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<ChartOfAccount | undefined>(undefined);
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const [viewingAccount, setViewingAccount] = useState<ChartOfAccount | undefined>(undefined);

    // TreeTable State
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleExport = () => {
        const data = chartOfAccounts.map(c => ({
            'Account Code': c.code,
            'Account Name': c.name,
            'Local Name': c.localName,
            'Account Type': c.type,
            'Sub of': c.isSubOf ? chartOfAccounts.find(p => p.id === c.isSubOf)?.code : '',
            'Description': c.description
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Chart of Accounts");
        XLSX.writeFile(wb, `ChartOfAccounts_${new Date().toISOString().split('T')[0]}.xlsx`);
        setIsActionMenuOpen(false);
    };

    const processImport = async (data: any[]) => {
        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        const newAccounts: any[] = [];
        const seenCodes = new Set<string>();
        const validTypes = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];

        // Pre-scan for duplicates in the file
        const fileCodes = new Set<string>();
        const duplicateFileCodes = new Set<string>();
        data.forEach((row) => {
            const code = row['Account Code']?.toString();
            if (code) {
                if (fileCodes.has(code)) {
                    duplicateFileCodes.add(code);
                }
                fileCodes.add(code);
            }
        });

        for (const [index, row] of data.entries()) {
            const rowNum = index + 2; // Assuming header is row 1
            try {
                const code = row['Account Code']?.toString();
                const name = row['Account Name'];
                const localName = row['Local Name'];
                const type = row['Account Type'];
                const parentCode = row['Sub of']?.toString();

                // 1. Required Fields
                if (!code || !name || !type) {
                    failed++;
                    errors.push(`Row ${rowNum}: Missing required fields (Code, Name, Type).`);
                    continue;
                }

                // 2. Code Format
                if (!code.trim()) {
                    failed++;
                    errors.push(`Row ${rowNum}: Invalid Code '${code}'.`);
                    continue;
                }

                // 3. Valid Type
                const normalizedType = validTypes.find(t => t.toLowerCase() === type.toLowerCase());
                if (!normalizedType) {
                    failed++;
                    errors.push(`Row ${rowNum}: Invalid Account Type '${type}'. Valid types: ${validTypes.join(', ')}.`);
                    continue;
                }

                // 4. Duplicate Check (System)
                if (chartOfAccounts.some(c => c.code === code)) {
                    failed++;
                    errors.push(`Row ${rowNum}: Duplicate Code '${code}' already exists in system.`);
                    continue;
                }

                // 5. Duplicate Check (File)
                if (duplicateFileCodes.has(code)) {
                    if (seenCodes.has(code)) {
                        failed++;
                        errors.push(`Row ${rowNum}: Duplicate Code '${code}' found multiple times in file.`);
                        continue;
                    }
                }
                seenCodes.add(code);

                // 6. Parent Code Validation
                if (parentCode) {
                    const parentInSystem = chartOfAccounts.some(c => c.code === parentCode);
                    const parentInFile = fileCodes.has(parentCode);

                    if (!parentInSystem && !parentInFile) {
                        failed++;
                        errors.push(`Row ${rowNum}: Parent Code '${parentCode}' not found in system or import file.`);
                        continue;
                    }
                }

                const newAccount = {
                    id: Math.random().toString(36).substr(2, 9),
                    code,
                    name,
                    localName: localName || name,
                    type: normalizedType,
                    description: row['Description'] || '',
                    isSubOf: undefined as string | undefined,
                    tempParentCode: parentCode
                };

                newAccounts.push(newAccount);

            } catch (e) {
                failed++;
                errors.push(`Row ${rowNum}: Unexpected error: ${e}`);
            }
        }

        // 2. Add accounts and resolve parents
        for (const acc of newAccounts) {
            let parentId = undefined;
            if (acc.tempParentCode) {
                // Check existing
                const existingParent = chartOfAccounts.find(c => c.code === acc.tempParentCode);
                if (existingParent) {
                    parentId = existingParent.id;
                } else {
                    // Check new accounts
                    const newParent = newAccounts.find(n => n.code === acc.tempParentCode);
                    if (newParent) {
                        parentId = newParent.id;
                    }
                }
            }

            acc.isSubOf = parentId;
        }

        if (newAccounts.length > 0) {
            addChartOfAccounts(newAccounts.map(a => ({
                id: a.id,
                code: a.code,
                name: a.name,
                localName: a.localName,
                type: a.type,
                description: a.description,
                isSubOf: a.isSubOf
            })));
            success += newAccounts.length;
        }

        return { success, failed, errors };
    };

    const treeData = useMemo(() => {
        // 1. Search Mode: Flat list, disable tree structure to show matches
        if (searchTerm) {
            return chartOfAccounts.filter(c =>
                c.code.includes(searchTerm) ||
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.localName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
            ).map(c => ({ ...c, depth: 0, hasChildren: false, isExpanded: false }));
        }

        // 2. Tree Mode: Hierarchy with expandable state
        const validIds = new Set(chartOfAccounts.map(c => c.id));
        const childrenMap = new Map<string, ChartOfAccount[]>();
        const roots: ChartOfAccount[] = [];

        chartOfAccounts.forEach(c => {
            if (c.isSubOf && validIds.has(c.isSubOf)) {
                const list = childrenMap.get(c.isSubOf) || [];
                list.push(c);
                childrenMap.set(c.isSubOf, list);
            } else {
                roots.push(c);
            }
        });

        const flatten = (nodes: ChartOfAccount[], depth: number): Array<ChartOfAccount & { depth: number, hasChildren: boolean, isExpanded: boolean }> => {
            return nodes.sort((a, b) => a.code.localeCompare(b.code)).flatMap(node => {
                const children = childrenMap.get(node.id) || [];
                const hasChildren = children.length > 0;
                const isExpanded = expandedIds.has(node.id);

                const item = { ...node, depth, hasChildren, isExpanded };

                // If expanded, include children in the flat list
                if (hasChildren && isExpanded) {
                    return [item, ...flatten(children, depth + 1)];
                }
                return [item];
            });
        };

        return flatten(roots, 0);
    }, [chartOfAccounts, searchTerm, expandedIds]);

    // Pagination Logic
    const totalPages = Math.ceil(treeData.length / pageSize);
    const paginatedCoAs = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return treeData.slice(start, start + pageSize);
    }, [treeData, currentPage, pageSize]);

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleSave = (data: any) => {
        if (data.id) {
            updateChartOfAccount(data);
        } else {
            addChartOfAccount({
                ...data,
                id: Math.random().toString(36).substr(2, 9)
            });
        }
        setIsModalOpen(false);
        setEditingAccount(undefined);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const currentPageIds = paginatedCoAs.map(c => c.id);
        if (e.target.checked) {
            setSelectedAccountIds(prev => {
                const newIds = new Set([...prev, ...currentPageIds]);
                return Array.from(newIds);
            });
        } else {
            setSelectedAccountIds(prev => prev.filter(id => !currentPageIds.includes(id)));
        }
    };

    const handleSelectAccount = (id: string) => {
        setSelectedAccountIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = () => {
        setDeleteTarget(null); // Indicates bulk delete
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = () => {
        if (deleteTarget) {
            deleteChartOfAccount(deleteTarget);
        } else {
            deleteChartOfAccounts(selectedAccountIds);
            setSelectedAccountIds([]);
        }
        setDeleteConfirmOpen(false);
        setDeleteTarget(null);
    };

    return (
        <div className="space-y-6 pb-24">
            <div className="flex flex-row justify-between items-center gap-2 sm:gap-4">
                {selectedAccountIds.length > 0 ? (
                    <div className="flex-1 flex items-center gap-4 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-xl border border-emerald-100 dark:border-emerald-800">
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400 pl-2">
                            {selectedAccountIds.length} {t('selected')}
                        </span>
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors ml-auto"
                        >
                            <Trash2 size={16} />
                            {t('delete')}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-1 w-full gap-2">
                        <div className="relative flex-1 sm:max-w-xs group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500" size={16} />
                            <input className={cn(CLASSES.input, "pl-10 pr-10 h-10 text-sm rounded-xl w-full")} placeholder={t('search_accounts')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        {searchTerm && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setCurrentPage(1);
                                }}
                                className={cn(CLASSES.buttonSecondary, "h-10 px-4 whitespace-nowrap text-sm font-semibold text-gray-600 dark:text-gray-300")}
                            >
                                {t('clear_filters')}
                            </button>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                        <button
                            onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                            className={cn(CLASSES.buttonSecondary, "h-10 w-10 p-0 rounded-xl flex items-center justify-center border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700")}
                        >
                            <FileSpreadsheet size={20} className="text-gray-500 dark:text-gray-400" />
                        </button>
                        {isActionMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsActionMenuOpen(false)} />
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                                    <button onClick={handleExport} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                        <Download size={16} className="text-gray-400" /> {t('export_excel')}
                                    </button>
                                    <button onClick={() => { setIsImportModalOpen(true); setIsActionMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                        <Upload size={16} className="text-gray-400" /> {t('import_excel')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    <button
                        onClick={() => { setEditingAccount(undefined); setIsModalOpen(true); }}
                        className={cn(CLASSES.buttonPrimary, "h-10 px-4 rounded-xl shadow-sm text-sm font-bold")}
                    >
                        <PlusCircle size={16} /> <span className="hidden sm:inline">{t('new_account')}</span><span className="sm:hidden">{t('new')}</span>
                    </button>
                </div>
            </div>

            <div className={cn(CLASSES.card, "overflow-hidden border-gray-200 dark:border-dark-border rounded-xl md:rounded-xl flex flex-col")}>
                <div className="overflow-x-auto scrollbar-thin flex-1">
                    <table className="w-full text-left border-collapse min-w-[1300px]">
                        <thead>
                            <tr>
                                <th className="w-12 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        checked={paginatedCoAs.length > 0 && paginatedCoAs.every(c => selectedAccountIds.includes(c.id))}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className={cn(premiumTh, "w-96")}>{t('name')}</th>
                                <th className={cn(premiumTh, "w-64")}>{t('local_name')}</th>
                                <th className={cn(premiumTh, "w-32")}>{t('account_type')}</th>
                                <th className={cn(premiumTh, "w-121")}>{t('description')}</th>
                                <th className={cn(premiumTh, "w-12")}></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {paginatedCoAs.map((c, i) => (
                                <tr key={c.id} onClick={() => setViewingAccount(c)} className={cn("hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors cursor-pointer", i % 2 === 0 ? "bg-white dark:bg-[#161b22]" : "bg-gray-50/20 dark:bg-gray-800/10")}>
                                    <td className="px-4 py-3 border-b border-gray-50 dark:border-gray-800/50" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                            checked={selectedAccountIds.includes(c.id)}
                                            onChange={() => handleSelectAccount(c.id)}
                                        />
                                    </td>
                                    <td className={premiumTd}>
                                        <div className="flex items-center" style={{ paddingLeft: `${c.depth * 20}px` }}>
                                            {c.hasChildren ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleExpand(c.id); }}
                                                    className={cn(
                                                        "flex items-center justify-center shrink-0 mr-2 rounded transition-colors",
                                                        c.depth === 0 
                                                            ? "w-6 h-6 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700" 
                                                            : "p-0.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                    )}
                                                >
                                                    {c.isExpanded ? <ChevronDown size={c.depth === 0 ? 16 : 14} strokeWidth={c.depth === 0 ? 3 : 2.5} /> : <ChevronRight size={c.depth === 0 ? 16 : 14} strokeWidth={c.depth === 0 ? 3 : 2.5} />}
                                                </button>
                                            ) : (
                                                <span className={cn("mr-2 inline-block shrink-0", c.depth === 0 ? "w-6 h-6" : "w-6")} />
                                            )}
                                            {c.depth > 0 && !c.hasChildren && <CornerDownRight size={14} className="text-gray-300 mr-2 shrink-0" />}
                                            <span className={cn("font-mono text-emerald-600", c.depth === 0 ? "font-bold text-base" : "font-semibold")}>{c.code}</span>
                                            <span className={cn("mx-1", c.depth === 0 ? "font-bold text-base text-gray-500" : "text-gray-400")}>-</span>
                                            <span className={cn("truncate block max-w-[240px]", c.depth === 0 ? "font-bold text-base text-gray-900 dark:text-white" : "font-medium text-gray-700 dark:text-gray-300")}>{c.name}</span>
                                        </div>
                                    </td>
                                    <td className={premiumTd}><span className="truncate block max-w-[240px]">{c.localName}</span></td>
                                    <td className={premiumTd}><span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-semibold">{c.type}</span></td>
                                    <td className={premiumTd}><span className="truncate block max-w-[484px] text-gray-600 dark:text-gray-400">{c.description}</span></td>
                                    <td className={cn(premiumTd, "text-center")} onClick={e => e.stopPropagation()}>
                                        <SettingsMenu
                                            onEdit={() => { setEditingAccount(c); setIsModalOpen(true); }}
                                            onDelete={() => { setDeleteTarget(c.id); setDeleteConfirmOpen(true); }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalRecords={treeData.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    t={t}
                />
            </div>

            {viewingAccount && (
                <ChartOfAccountDetailModal
                    account={viewingAccount}
                    onClose={() => setViewingAccount(undefined)}
                />
            )}

            {isModalOpen && (
                <ChartOfAccountsModal
                    account={editingAccount}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}

            {isDeleteConfirmOpen && (
                <div className={CLASSES.modalOverlay}>
                    <div className={cn(CLASSES.modalContent, "max-w-md rounded-xl")}>
                        <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 justify-center")}>
                            <Typography variant="h2" className="text-lg text-center w-full">{t('confirm_removal')}</Typography>
                        </div>
                        <div className={cn(CLASSES.modalBody, "text-center")}>
                            <Typography variant="body">
                                {deleteTarget
                                    ? t('delete_record_confirm')
                                    : t('delete_selected_records_confirm', { count: selectedAccountIds.length }) || `Are you sure you want to delete ${selectedAccountIds.length} selected records?`
                                }
                            </Typography>
                        </div>
                        <div className={cn(CLASSES.modalFooter, "flex-row items-center gap-3 py-2 md:py-2.5 px-5 md:px-6 bg-gray-50 dark:bg-gray-800/20")}>
                            <button onClick={() => setDeleteConfirmOpen(false)} className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-10 border-2 rounded-xl")}>{t('cancel')}</button>
                            <button onClick={confirmDelete} className={cn(CLASSES.buttonDanger, "flex-1 h-11 md:h-10 rounded-xl")}>{t('confirm')}</button>
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
        </div>
    );
};

const UserRoleTab: React.FC = () => {
    const { users, roles, currentUser, addUser, updateUser, deleteUser, addRole, updateRole, deleteRole, t } = useApp();
    const [activeSubTab, setActiveSubTab] = useState<'Users' | 'Roles'>('Users');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal & Delete States
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
    const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleteTargetType, setDeleteTargetType] = useState<'User' | 'Role' | null>(null);

    const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredRoles = roles.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleSaveUser = (data: any) => {
        if (users.find(u => u.id === data.id && (!editingUser || editingUser.id !== data.id))) {
            alert(t('user_id_error_duplicate'));
            return;
        }
        if (editingUser) updateUser(data);
        else addUser(data);
        setIsUserModalOpen(false);
        setEditingUser(undefined);
    };

    const handleSaveRole = (data: any) => {
        if (data.id) updateRole(data);
        else addRole({ ...data, id: Math.random().toString(36).substr(2, 9) });
        setIsRoleModalOpen(false);
        setEditingRole(undefined);
    };

    return (
        <div className="space-y-6 pb-24">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex gap-2">
                    {['Users', 'Roles'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveSubTab(tab as any)}
                            className={cn(
                                "px-4 py-2 text-sm font-bold rounded-xl transition-all",
                                activeSubTab === tab
                                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                                    : "bg-white dark:bg-dark-card text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                            )}
                        >
                            {t(tab.toLowerCase() + '_tab') || tab}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input className={cn(CLASSES.input, "pl-10 h-10 text-sm rounded-xl")} placeholder={t('search')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <button
                        onClick={() => activeSubTab === 'Users' ? (setEditingUser(undefined), setIsUserModalOpen(true)) : (setEditingRole(undefined), setIsRoleModalOpen(true))}
                        className={cn(CLASSES.buttonPrimary, "h-10 px-4 rounded-xl shadow-sm text-sm font-bold shrink-0")}
                    >
                        <PlusCircle size={16} /> {activeSubTab === 'Users' ? t('add_user') : t('add_role')}
                    </button>
                </div>
            </div>

            <div className={cn(CLASSES.card, "overflow-hidden border-gray-200 dark:border-dark-border rounded-xl md:rounded-xl")}>
                <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr>
                                {activeSubTab === 'Users' ? (
                                    <>
                                        <th className={cn(premiumTh, "w-40")}>{t('user_id')}</th>
                                        <th className={cn(premiumTh, "w-48")}>{t('name')}</th>
                                        <th className={cn(premiumTh, "w-32")}>{t('role_name')}</th>
                                        <th className={cn(premiumTh, "w-32 text-center")}>{t('status')}</th>
                                        <th className={cn(premiumTh, "w-40")}>{t('phone')}</th>
                                        <th className={cn(premiumTh, "w-12")}></th>
                                    </>
                                ) : (
                                    <>
                                        <th className={cn(premiumTh, "w-48")}>{t('role_name')}</th>
                                        <th className={cn(premiumTh, "w-auto")}>{t('description')}</th>
                                        <th className={cn(premiumTh, "w-12")}></th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {activeSubTab === 'Users' ? (
                                filteredUsers.map((u, i) => (
                                    <tr key={u.id} className={cn("hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors", i % 2 === 0 ? "bg-white dark:bg-[#161b22]" : "bg-gray-50/20 dark:bg-gray-800/10")}>
                                        <td className={cn(premiumTd, "font-mono font-semibold")}>{u.id}</td>
                                        <td className={premiumTd}><span className="font-medium">{u.name}</span></td>
                                        <td className={premiumTd}><span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100">{u.role}</span></td>
                                        <td className={cn(premiumTd, "text-center")}>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-lg text-xs font-bold border",
                                                u.status === UserStatus.ACTIVE ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                                                u.status === UserStatus.LOCKED ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                "bg-red-50 text-red-600 border-red-100"
                                            )}>
                                                {u.status}
                                            </span>
                                        </td>
                                        <td className={premiumTd}>{u.phone || '-'}</td>
                                        <td className={cn(premiumTd, "text-center")}>
                                            <SettingsMenu
                                                onEdit={() => { setEditingUser(u); setIsUserModalOpen(true); }}
                                                onDelete={u.id === currentUser?.id ? undefined : () => { setDeleteTargetId(u.id); setDeleteTargetType('User'); setDeleteConfirmOpen(true); }}
                                            />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                filteredRoles.map((r, i) => (
                                    <tr key={r.id} className={cn("hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors", i % 2 === 0 ? "bg-white dark:bg-[#161b22]" : "bg-gray-50/20 dark:bg-gray-800/10")}>
                                        <td className={cn(premiumTd, "font-semibold")}>{r.name}</td>
                                        <td className={premiumTd}>{r.description}</td>
                                        <td className={cn(premiumTd, "text-center")}>
                                            <SettingsMenu
                                                onEdit={() => { setEditingRole(r); setIsRoleModalOpen(true); }}
                                                onDelete={() => { setDeleteTargetId(r.id); setDeleteTargetType('Role'); setDeleteConfirmOpen(true); }}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isUserModalOpen && <UserModal user={editingUser} onClose={() => setIsUserModalOpen(false)} onSave={handleSaveUser} />}
            {isRoleModalOpen && <RolePermissionsModal role={editingRole} onClose={() => setIsRoleModalOpen(false)} onSave={handleSaveRole} />}

            {isDeleteConfirmOpen && (
                <div className={CLASSES.modalOverlay}>
                    <div className={cn(CLASSES.modalContent, "max-w-md rounded-xl")}>
                        <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 justify-center")}>
                            <Typography variant="h2" className="text-lg text-center w-full">{t('confirm_removal')}</Typography>
                        </div>
                        <div className={cn(CLASSES.modalBody, "text-center")}>
                            <Typography variant="body">{t('delete_record_confirm')}</Typography>
                        </div>
                        <div className={cn(CLASSES.modalFooter, "flex-row items-center gap-3 py-2 md:py-2.5 px-5 md:px-6 bg-gray-50 dark:bg-gray-800/20")}>
                            <button onClick={() => setDeleteConfirmOpen(false)} className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-10 border-2 rounded-xl")}>{t('cancel')}</button>
                            <button
                                onClick={() => {
                                    if (deleteTargetId && deleteTargetType === 'User') deleteUser(deleteTargetId);
                                    if (deleteTargetId && deleteTargetType === 'Role') deleteRole(deleteTargetId);
                                    setDeleteConfirmOpen(false);
                                }}
                                className={cn(CLASSES.buttonDanger, "flex-1 h-11 md:h-10 rounded-xl")}
                            >
                                {t('confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SetupSystemTab: React.FC = () => {
    const { settings, updateSettings, t } = useApp();
    const [formData, setFormData] = useState({ ...settings });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                alert(t('error_file_too_large') || 'File size exceeds 10MB limit');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, profilePhoto: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 800));
        updateSettings(formData);
        setIsSubmitting(false);
    };

    return (
        <div className="max-w-4xl mx-auto pb-24">
            <div className={cn(CLASSES.card, "p-6 md:p-8 space-y-8")}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Typography variant="label">{t('profile_name')}</Typography>
                            <div className="relative">
                                <input
                                    className={cn(CLASSES.input, "pl-10 h-12 rounded-xl")}
                                    value={formData.profileName}
                                    onChange={e => setFormData({ ...formData, profileName: e.target.value })}
                                />
                                <UserIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Typography variant="label">{t('upload_photo')}</Typography>
                            <div className="flex items-center gap-4">
                                <div className="relative group">
                                    <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden flex items-center justify-center transition-all group-hover:border-emerald-500">
                                        {formData.profilePhoto ? (
                                            <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                            <UserIcon size={32} className="text-gray-400" />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                        >
                                            <Camera size={20} />
                                        </button>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                    />
                                </div>
                                <div className="flex-1">
                                    <Typography variant="caption" className="block mb-1">{t('click_to_upload')}</Typography>
                                    <Typography variant="caption" className="text-[10px] opacity-50">JPG, PNG. Max 10MB</Typography>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Typography variant="label">{t('language')}</Typography>
                            <div className="relative group">
                                <select
                                    className={cn(CLASSES.select, "pl-10 h-12 rounded-xl")}
                                    value={formData.language}
                                    onChange={e => setFormData({ ...formData, language: e.target.value as any })}
                                >
                                    <option value="en">English (អង់គ្លេស)</option>
                                    <option value="km">Khmer (ខ្មែរ)</option>
                                </select>
                                <Globe size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Typography variant="label">{t('date_format')}</Typography>
                            <div className="relative group">
                                <select
                                    className={cn(CLASSES.select, "pl-10 h-12 rounded-xl")}
                                    value={formData.dateFormat}
                                    onChange={e => setFormData({ ...formData, dateFormat: e.target.value })}
                                >
                                    <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                                    <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                                    <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                                </select>
                                <Clock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Typography variant="label">{t('timezone')}</Typography>
                            <div className="relative group">
                                <select
                                    className={cn(CLASSES.select, "pl-10 h-12 rounded-xl")}
                                    value={formData.timezone}
                                    onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                                >
                                    <option value="Asia/Phnom_Penh">Asia/Phnom_Penh (GMT+7)</option>
                                    <option value="UTC">UTC</option>
                                </select>
                                <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Typography variant="label">{t('theme')}</Typography>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'light', icon: Sun, label: 'Light' },
                                    { id: 'dark', icon: Moon, label: 'Dark' },
                                    { id: 'system', icon: Monitor, label: 'System' }
                                ].map(theme => (
                                    <button
                                        key={theme.id}
                                        onClick={() => {
                                            setFormData({ ...formData, theme: theme.id as any });
                                            updateSettings({ theme: theme.id as any });
                                        }}
                                        className={cn(
                                            "flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all gap-1.5",
                                            formData.theme === theme.id
                                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                                                : "border-transparent bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        )}
                                    >
                                        <theme.icon size={20} />
                                        <span className="text-xs font-bold">{t(theme.label.toLowerCase())}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                onClick={handleSave}
                                disabled={isSubmitting}
                                className={cn(CLASSES.buttonPrimary, "w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-emerald-500/20")}
                            >
                                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : t('save_changes')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CurrencyTab: React.FC = () => {
    const { settings, updateCurrencyRate, toggleCurrencyActive, updateSettings, syncRates, t } = useApp();
    const [editingRate, setEditingRate] = useState<string | null>(null);
    const [newRate, setNewRate] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; currency: string; rate: number } | null>(null);

    const handleRateUpdate = (currency: string) => {
        const rate = parseFloat(newRate);
        if (!isNaN(rate) && rate > 0) {
            setConfirmDialog({ isOpen: true, currency, rate });
        }
    };

    const confirmRateUpdate = () => {
        if (confirmDialog) {
            updateCurrencyRate(confirmDialog.currency, confirmDialog.rate);
            setEditingRate(null);
            setNewRate('');
            setConfirmDialog(null);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await syncRates();
        } catch (error) {
            alert(t('sync_error') || "Failed to sync rates");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="space-y-6 pb-24">
            {confirmDialog && (
                <div className={cn(CLASSES.modalOverlay, "z-50")}>
                    <div className={cn(CLASSES.modalContent, "max-w-md rounded-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200")}>
                        <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 justify-center")}>
                            <Typography variant="h2" className="text-lg text-center w-full">{t('confirm_rate_change') || "Confirm Rate Change"}</Typography>
                        </div>

                        <div className={cn(CLASSES.modalBody, "p-4 md:p-5")}>
                            <Typography variant="body" className="mb-4 text-center text-gray-600 dark:text-gray-300">
                                {t('rate_change_warning') || "Changing the exchange rate will affect all historical data and financial reports. Are you sure you want to proceed?"}
                            </Typography>

                            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg mb-2 border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-500">{t('currency')}:</span>
                                    <span className="font-bold">{confirmDialog.currency}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">{t('new_rate')}:</span>
                                    <span className="font-bold text-emerald-600">{confirmDialog.rate}</span>
                                </div>
                            </div>
                        </div>

                        <div className={cn(CLASSES.modalFooter, "flex-row items-center gap-3 py-2 md:py-2.5 px-5 md:px-6 bg-gray-50 dark:bg-gray-800/20")}>
                            <button
                                onClick={() => setConfirmDialog(null)}
                                className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-10 border-2 rounded-xl")}
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={confirmRateUpdate}
                                className={cn(CLASSES.buttonDanger, "flex-1 h-11 md:h-10 rounded-xl")}
                            >
                                {t('proceed') || "Proceed"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={cn(CLASSES.card, "p-6 md:p-8")}>
                    <Typography variant="h3" className="mb-4">{t('system_default_currency')}</Typography>
                    <div className="flex gap-4">
                        {[Currency.USD, Currency.KHR].map(c => (
                            <button
                                key={c}
                                onClick={() => updateSettings({ defaultCurrency: c })}
                                className={cn(
                                    "flex-1 py-4 rounded-xl border-2 font-bold text-lg transition-all",
                                    settings.defaultCurrency === c
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-600 shadow-md"
                                        : "border-gray-200 dark:border-gray-700 hover:border-emerald-300 bg-white dark:bg-gray-800"
                                )}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                    <Typography variant="caption" className="mt-2 block opacity-60">
                        {t('base_currency_desc')}
                    </Typography>
                </div>

                <div className={cn(CLASSES.card, "p-6 md:p-8 flex flex-col justify-between")}>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Typography variant="h3">{t('auto_sync_rates')}</Typography>
                            <div
                                onClick={() => updateSettings({ autoSyncRates: !settings.autoSyncRates })}
                                className={cn(
                                    "w-12 h-6 rounded-full p-1 transition-colors cursor-pointer flex items-center",
                                    settings.autoSyncRates ? "bg-emerald-500 justify-end" : "bg-gray-300 dark:bg-gray-700 justify-start"
                                )}
                            >
                                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>
                        <Typography variant="caption" className="block opacity-60 mb-4">
                            {t('auto_sync_desc')}
                        </Typography>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div>
                            {settings.lastRatesSync && (
                                <Typography variant="caption" className="block text-[10px]">
                                    {t('last_synced')}: {formatDateTime(settings.lastRatesSync)}
                                </Typography>
                            )}
                        </div>
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                isSyncing
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            )}
                        >
                            {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                            {t('sync_now')}
                        </button>
                    </div>
                </div>
            </div>

            <div className={cn(CLASSES.card, "overflow-hidden border-gray-200 dark:border-dark-border rounded-xl md:rounded-xl flex flex-col")}>
                <div className="overflow-x-auto scrollbar-thin flex-1">
                    <table className="w-full text-left min-w-[600px]">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                                <th className={cn(premiumTh, "pl-6 w-32")}>{t('active')}</th>
                                <th className={cn(premiumTh, "w-32")}>{t('currency')}</th>
                                <th className={cn(premiumTh, "text-right")}>{t('exchange_rate')} (1 {settings.defaultCurrency} =)</th>
                                <th className={cn(premiumTh, "text-right pr-6")}>{t('exchange_back')} (1 {t('currency')} =)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {[Currency.USD, Currency.KHR].map(c => {
                                const isBase = c === settings.defaultCurrency;
                                const isActive = settings.activeCurrencies.includes(c);
                                const currentRate = settings.exchangeRates[c] || 1;

                                return (
                                    <tr key={c} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div
                                                onClick={() => !isBase && toggleCurrencyActive(c, !isActive)}
                                                className={cn(
                                                    "w-12 h-6 rounded-full p-1 transition-colors cursor-pointer flex items-center",
                                                    isActive ? "bg-emerald-500 justify-end" : "bg-gray-300 dark:bg-gray-700 justify-start",
                                                    isBase && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 font-bold text-gray-700 dark:text-gray-200">{c}</td>
                                        <td className="px-6 py-4 text-right">
                                            {isBase ? (
                                                <span className="text-gray-400 font-mono">1.00</span>
                                            ) : editingRate === c ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <input
                                                        autoFocus
                                                        className="w-32 text-right p-1 border rounded text-sm bg-white dark:bg-dark-bg"
                                                        value={newRate}
                                                        onChange={e => setNewRate(e.target.value)}
                                                        placeholder={currentRate.toString()}
                                                    />
                                                    <button onClick={() => handleRateUpdate(c)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><CheckCircle2 size={18} /></button>
                                                    <button onClick={() => setEditingRate(null)} className="p-1 text-red-500 hover:bg-red-50 rounded"><X size={18} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-3 group">
                                                    <span className="font-mono tabular-nums font-medium">{currentRate.toLocaleString()}</span>
                                                    <button
                                                        onClick={() => { setEditingRate(c); setNewRate(currentRate.toString()); }}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-all"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right pr-6">
                                            <span className="font-mono tabular-nums text-gray-500">
                                                {(1 / currentRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export const Settings: React.FC = () => {
    const { t } = useApp();
    const [activeTab, setActiveTab] = useState<'CoA' | 'UserRole' | 'System' | 'Currency'>('CoA');

    const renderContent = () => {
        switch (activeTab) {
            case 'CoA': return <ChartOfAccountsTab />;
            case 'UserRole': return <UserRoleTab />;
            case 'System': return <SetupSystemTab />;
            case 'Currency': return <CurrencyTab />;
            default: return null;
        }
    };

    return (
        <div className={cn(CLASSES.container, "!px-2 md:!px-4 lg:!px-6 !space-y-4 pb-24")}>
            {/* Header Area - Removed to save space */}

            {/* Navigation Tabs */}
            <div className="grid grid-cols-2 lg:flex w-full md:w-auto p-1.5 gap-1 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-sm mb-6 sticky top-0 z-20">
                {[
                    { id: 'CoA', label: 'chart_of_accounts', icon: BookOpen },
                    { id: 'UserRole', label: 'user_role', icon: UserIcon },
                    { id: 'System', label: 'setup_system', icon: Settings2 },
                    { id: 'Currency', label: 'currency_mgmt', icon: Coins },
                ].map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex-1 w-full flex items-center justify-center gap-2 px-2 sm:px-3 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all",
                                activeTab === tab.id
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 shadow-sm"
                                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            )}
                        >
                            <Icon size={16} />
                            <span className="truncate">{t(tab.label)}</span>
                        </button>
                    )
                })}
            </div>

            {/* Content Area */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {renderContent()}
            </div>
        </div>
    );
};
