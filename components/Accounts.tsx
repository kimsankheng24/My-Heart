
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../store';
import { Account, AccountType, Currency, TransactionType, AccountStatus, TermDepositDetails } from '../types';
import { formatCurrency, cn, CLASSES, convertToDefault, getPhnomPenhNowISO, computeMaturityDate, computeTermDepositFinancials, formatDate } from '../utils';
import { AccountsMenu } from './menus/AccountsMenu';
import {
    PlusCircle, Landmark, Wallet, ChevronDown, X, Loader2, AlertTriangle, Info, Coins,
    CalendarSync, CheckCircle2, PiggyBank, Calendar, Percent, Eye, EyeOff, ShieldAlert,
    Users, User, Edit2, Trash2, Settings2, Check
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NumericInput } from './NumericInput';
import { Typography } from './Typography';
import { ResponsiveGrid } from './ResponsiveGrid';
import { CustomDatePicker } from './CustomDatePicker';

const CustomSelect: React.FC<{
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    disabled?: boolean;
    error?: string;
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
        <div className="relative group w-full flex flex-col" ref={containerRef}>
            <div
                className={cn(
                    CLASSES.select,
                    "h-11 rounded-md border-2 flex items-center justify-between cursor-pointer bg-white dark:bg-dark-card pr-10",
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
                        {options.map(option => {
                            const isAddNew = option.value === '__ADD_NEW__';
                            return (
                                <div
                                    key={option.value}
                                    className={cn(
                                        "px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between",
                                        isAddNew
                                            ? "text-emerald-600 dark:text-emerald-400 font-bold border-t border-gray-100 dark:border-gray-800 bg-emerald-50/40 dark:bg-emerald-950/20"
                                            : value === option.value && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 font-medium"
                                    )}
                                    onClick={() => { onChange(option.value); setIsOpen(false); }}
                                >
                                    <span className="truncate flex items-center gap-1.5">
                                        {isAddNew && <PlusCircle size={14} className="shrink-0 text-emerald-600" />}
                                        {option.label}
                                    </span>
                                    {value === option.value && !isAddNew && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {error && (
                <Typography variant="caption" className="text-red-500 font-bold mt-1.5 px-1 block animate-in fade-in slide-in-from-top-1 text-[11px]">
                    {error}
                </Typography>
            )}
        </div>
    );
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
        <div className="relative inline-flex items-center justify-center shrink-0 z-50" ref={ref}>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className="cursor-pointer text-gray-400 hover:text-emerald-500 transition-colors p-0.5 rounded-full outline-none focus:ring-2 focus:ring-emerald-500/50"
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
    defaultCurrency: Currency;
    exchangeRates: Record<string, number>;
    lang: string;
    onClick?: () => void;
    isSelected?: boolean;
    tooltip?: string;
    t: (key: string) => string;
}> = ({ title, amount, currency, defaultCurrency, exchangeRates, lang, onClick, isSelected, tooltip, t }) => {

    const convertedValue = convertToDefault(amount, currency, defaultCurrency, exchangeRates);
    const isDifferentCurrency = currency !== defaultCurrency;

    return (
        <div
            onClick={onClick}
            className={cn(
                "relative w-full h-[140px] flex flex-col justify-between rounded-[24px] border transition-all duration-300 cursor-pointer group overflow-hidden select-none",
                "bg-white dark:bg-[#18181b] border-gray-100 dark:border-gray-700",
                isSelected
                    ? "ring-2 ring-emerald-500 border-transparent shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                    : "hover:border-emerald-500/30 hover:shadow-lg dark:hover:shadow-black/50"
            )}
        >
            {/* Top Content */}
            <div className="flex flex-col px-6 pt-5 relative z-10">
                <div className="flex items-center gap-1.5 mb-1.5">
                    <Typography variant="caption" className="font-medium text-gray-800 dark:text-gray-200 text-xs md:text-sm">
                        {title}
                    </Typography>
                    {tooltip && <TooltipButton tooltip={tooltip} />}
                </div>
                <Typography variant="h2" className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight tabular-nums leading-none">
                    {formatCurrency(amount, currency, lang)}
                </Typography>
            </div>

            {/* Footer Area */}
            <div className="flex items-end justify-between w-full mt-auto">
                {/* Converted Valuation (Bottom Left) */}
                <div className="pl-6 pb-4">
                    {isDifferentCurrency && (
                        <div className="flex flex-col justify-end">
                            <span className="text-[10px] md:text-xs font-medium text-gray-400 leading-none mb-0.5">{t('est_valuation')}</span>
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 tabular-nums">
                                ≈ {formatCurrency(convertedValue, defaultCurrency, lang)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Currency Badge (Bottom Right) */}
                <div className="bg-emerald-500 text-white pl-6 pr-5 py-2.5 rounded-tl-[24px] shadow-lg shadow-emerald-500/20 z-20 group-hover:bg-emerald-400 transition-colors">
                    <span className="text-sm font-bold tracking-widest uppercase">{currency}</span>
                </div>
            </div>
        </div>
    );
};

// Quick Add Owner Modal for on-the-fly owner creation
const QuickAddOwnerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAdd: (name: string) => void;
    existingOwners: string[];
    t: (key: string, params?: any) => string;
}> = ({ isOpen, onClose, onAdd, existingOwners, t }) => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setError(t('owner_name_required'));
            return;
        }
        if (existingOwners.some(o => o.toLowerCase() === trimmed.toLowerCase())) {
            setError(t('owner_already_exists'));
            return;
        }
        onAdd(trimmed);
        setName('');
        setError('');
        onClose();
    };

    return (
        <div className={cn(CLASSES.modalOverlay, "p-4 z-[70]")}>
            <div className={cn(CLASSES.modalContent, "max-w-sm p-5 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200")}>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-100 dark:border-emerald-800">
                            <PlusCircle size={18} />
                        </div>
                        <Typography variant="h3" className="font-bold text-base text-gray-900 dark:text-gray-100">
                            {t('add_owner')}
                        </Typography>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div className="space-y-1">
                        <Typography variant="label">{t('owner_name')} *</Typography>
                        <div className="relative">
                            <input
                                autoFocus
                                value={name}
                                onChange={e => { setName(e.target.value); setError(''); }}
                                placeholder={t('enter_owner_name')}
                                className={cn(CLASSES.input, "pl-10 h-10 rounded-xl border-2 focus:border-emerald-500", error && CLASSES.inputError)}
                            />
                            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                        {error && <Typography variant="caption" className="text-red-500 px-1 mt-0.5 block">{error}</Typography>}
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className={cn(CLASSES.buttonSecondary, "px-4 py-2 text-xs font-semibold rounded-xl")}>
                            {t('cancel')}
                        </button>
                        <button type="submit" className={cn(CLASSES.buttonPrimary, "px-4 py-2 text-xs font-bold rounded-xl shadow-md")}>
                            {t('add_owner')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Comprehensive Manage Owners Modal
const ManageOwnersModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    accountOwners: string[];
    accounts: Account[];
    onAddOwner: (name: string) => void;
    onUpdateOwner: (oldName: string, newName: string) => void;
    onDeleteOwner: (name: string) => void;
    t: (key: string, params?: any) => string;
}> = ({ isOpen, onClose, accountOwners, accounts, onAddOwner, onUpdateOwner, onDeleteOwner, t }) => {
    const [newOwnerName, setNewOwnerName] = useState('');
    const [newOwnerError, setNewOwnerError] = useState('');
    const [editingOwner, setEditingOwner] = useState<{ oldName: string; newName: string } | null>(null);
    const [editingError, setEditingError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<{ owner: string; accountCount: number } | null>(null);

    if (!isOpen) return null;

    const handleAdd = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = newOwnerName.trim();
        if (!trimmed) {
            setNewOwnerError(t('owner_name_required'));
            return;
        }
        if (accountOwners.some(o => o.toLowerCase() === trimmed.toLowerCase())) {
            setNewOwnerError(t('owner_already_exists'));
            return;
        }
        onAddOwner(trimmed);
        setNewOwnerName('');
        setNewOwnerError('');
    };

    const handleStartEdit = (owner: string) => {
        setEditingOwner({ oldName: owner, newName: owner });
        setEditingError('');
    };

    const handleSaveEdit = () => {
        if (!editingOwner) return;
        const trimmed = editingOwner.newName.trim();
        if (!trimmed) {
            setEditingError(t('owner_name_required'));
            return;
        }
        if (accountOwners.some(o => o.toLowerCase() === trimmed.toLowerCase() && o.toLowerCase() !== editingOwner.oldName.toLowerCase())) {
            setEditingError(t('owner_already_exists'));
            return;
        }
        onUpdateOwner(editingOwner.oldName, trimmed);
        setEditingOwner(null);
        setEditingError('');
    };

    const handlePromptDelete = (owner: string) => {
        const count = accounts.filter(a => a.owner === owner).length;
        if (count > 0) {
            setDeleteConfirm({ owner, accountCount: count });
        } else {
            onDeleteOwner(owner);
        }
    };

    const handleConfirmDelete = () => {
        if (deleteConfirm) {
            onDeleteOwner(deleteConfirm.owner);
            setDeleteConfirm(null);
        }
    };

    return (
        <div className={cn(CLASSES.modalOverlay, "p-4 z-[65]")}>
            <div className={cn(CLASSES.modalContent, "max-w-lg rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90dvh]")}>
                {/* Header */}
                <div className={cn(CLASSES.modalHeader, "py-3 px-5 border-b border-gray-100 dark:border-gray-800 shrink-0")}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl border border-emerald-100 dark:border-emerald-800">
                            <Users size={18} />
                        </div>
                        <div>
                            <Typography variant="h2" className="text-base font-bold text-gray-900 dark:text-gray-100">
                                {t('manage_owners')}
                            </Typography>
                            <Typography variant="caption" className="text-gray-500 dark:text-gray-400 block -mt-0.5">
                                {t('account_owners')}
                            </Typography>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-5 flex-1">
                    {/* Add Owner Input Form */}
                    <form onSubmit={handleAdd} className="space-y-1.5">
                        <Typography variant="label">{t('add_owner')}</Typography>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <input
                                    value={newOwnerName}
                                    onChange={e => { setNewOwnerName(e.target.value); setNewOwnerError(''); }}
                                    placeholder={t('enter_owner_name')}
                                    className={cn(CLASSES.input, "pl-10 h-10 rounded-xl border-2 focus:border-emerald-500", newOwnerError && CLASSES.inputError)}
                                />
                                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                            <button
                                type="submit"
                                className={cn(CLASSES.buttonPrimary, "h-10 px-4 rounded-xl shadow-md text-xs font-bold shrink-0 flex items-center gap-1.5")}
                            >
                                <PlusCircle size={15} />
                                <span>{t('add_owner')}</span>
                            </button>
                        </div>
                        {newOwnerError && <Typography variant="caption" className="text-red-500 px-1 block">{newOwnerError}</Typography>}
                    </form>

                    {/* Owners List */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <Typography variant="label" className="text-xs uppercase tracking-wider text-gray-500">
                                {t('account_owners')} ({accountOwners.length})
                            </Typography>
                        </div>
                        <div className="border border-gray-200/80 dark:border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800/80 bg-white dark:bg-[#161b22]">
                            {accountOwners.length === 0 ? (
                                <div className="p-6 text-center text-gray-400 text-sm">
                                    {t('no_records_found')}
                                </div>
                            ) : (
                                accountOwners.map(owner => {
                                    const count = accounts.filter(a => a.owner === owner).length;
                                    const isEditing = editingOwner?.oldName === owner;

                                    return (
                                        <div key={owner} className="p-3 flex items-center justify-between gap-3 hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                                            {isEditing ? (
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            autoFocus
                                                            value={editingOwner.newName}
                                                            onChange={e => { setEditingOwner({ ...editingOwner, newName: e.target.value }); setEditingError(''); }}
                                                            className={cn(CLASSES.input, "h-9 text-sm rounded-lg border-2 focus:border-emerald-500 flex-1", editingError && CLASSES.inputError)}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleSaveEdit}
                                                            className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shrink-0 shadow-sm"
                                                            title={t('save')}
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setEditingOwner(null); setEditingError(''); }}
                                                            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 transition-colors shrink-0"
                                                            title={t('cancel')}
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                    {editingError && <Typography variant="caption" className="text-red-500 px-1 block">{editingError}</Typography>}
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                                                            {owner.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                                                                {owner}
                                                            </div>
                                                            <div className="text-[11px] text-gray-400">
                                                                {count === 1 ? t('owner_single_count') : t('owners_count', { count })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStartEdit(owner)}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                                                            title={t('edit_owner')}
                                                        >
                                                            <Edit2 size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePromptDelete(owner)}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                                            title={t('delete_owner')}
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className={cn(CLASSES.buttonSecondary, "px-5 py-2 text-xs font-semibold rounded-xl")}
                    >
                        {t('close')}
                    </button>
                </div>
            </div>

            {/* Sub-confirmation dialog when deleting owner with linked accounts */}
            {deleteConfirm && (
                <div className={cn(CLASSES.modalOverlay, "p-4 z-[75]")}>
                    <div className={cn(CLASSES.modalContent, "max-w-md p-5 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200")}>
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200 dark:border-amber-900 shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <Typography variant="h3" className="font-bold text-base text-gray-900 dark:text-gray-100">
                                    {t('delete_owner')}
                                </Typography>
                                <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {t('confirm_delete_owner', { name: deleteConfirm.owner, count: deleteConfirm.accountCount })}
                                </p>
                                <div className="mt-5 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setDeleteConfirm(null)}
                                        className={cn(CLASSES.buttonSecondary, "px-4 py-2 text-xs font-semibold rounded-xl")}
                                    >
                                        {t('cancel')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirmDelete}
                                        className={cn(CLASSES.buttonDanger, "px-4 py-2 text-xs font-bold rounded-xl shadow-md")}
                                    >
                                        {t('delete')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const Accounts: React.FC = () => {
    const {
        accounts, addAccount, updateAccount, toggleHideAccount, setDefaultAccount, deleteAccount, addTransaction,
        settings, can, t,
        accountOwners, addAccountOwner, updateAccountOwner, deleteAccountOwner
    } = useApp();
    const navigate = useNavigate();
    const location = useLocation();

    // UI State
    const [filterType, setFilterType] = useState<string>('All');

    if (!can('Accounts', 'view')) {
        return (
            <div className={cn(CLASSES.container, "!px-2 md:!px-4 lg:!px-6 !space-y-4 pb-24")}>
                <div className={cn(CLASSES.card, "p-8 md:p-12 text-center max-w-lg mx-auto my-12 space-y-4 border-dashed border-2")}>
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                        <ShieldAlert size={32} />
                    </div>
                    <Typography variant="h2" className="text-lg font-bold text-gray-900 dark:text-white">
                        {t('access_denied')}
                    </Typography>
                    <Typography variant="body" className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-sm">
                        {t('module_access_restricted')}
                    </Typography>
                </div>
            </div>
        );
    }
    const [filterOwner, setFilterOwner] = useState<string>('All');
    const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
    const [showHidden, setShowHidden] = useState(false);
    const hiddenAccountsCount = useMemo(() => accounts.filter(a => a.isHidden).length, [accounts]);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [isOwnerMenuOpen, setIsOwnerMenuOpen] = useState(false);
    const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
    const [visualViewportHeight, setVisualViewportHeight] = useState(window.innerHeight);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    // Refs
    const filterMenuRef = useRef<HTMLDivElement>(null);
    const ownerMenuRef = useRef<HTMLDivElement>(null);
    const newMenuRef = useRef<HTMLDivElement>(null);

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [isManageOwnersOpen, setIsManageOwnersOpen] = useState(false);
    const [isAddOwnerPromptOpen, setIsAddOwnerPromptOpen] = useState(false);

    // Form/Action States
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [targetAccount, setTargetAccount] = useState<Account | null>(null); // For adjustments
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    // Form Data
    const todayISO = getPhnomPenhNowISO().slice(0, 10);
    const [accountForm, setAccountForm] = useState({
        name: '',
        type: AccountType.BANK as string,
        balance: '',
        currency: settings.defaultCurrency,
        status: AccountStatus.ACTIVE,
        note: '',
        owner: accountOwners[0] || 'Kimsan',
        termMonths: '12',
        interestRate: '7.25',
        startDate: todayISO,
        maturityDate: computeMaturityDate(todayISO, 12),
        isHidden: false
    });
    const [transferForm, setTransferForm] = useState({ fromId: '', toId: '', amount: '', date: getPhnomPenhNowISO(), note: '' });
    const [adjustForm, setAdjustForm] = useState({ balance: '', date: getPhnomPenhNowISO(), note: '' });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.visualViewport) {
                setVisualViewportHeight(window.visualViewport.height);
                setIsKeyboardOpen(window.visualViewport.height < window.innerHeight * 0.85);
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
            if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) setIsFilterMenuOpen(false);
            if (ownerMenuRef.current && !ownerMenuRef.current.contains(e.target as Node)) setIsOwnerMenuOpen(false);
            if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) setIsNewMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currencyTotals = useMemo(() => {
        const totals: Record<string, number> = {};
        const sourceAccounts = (showHidden || filterType === 'Hidden') ? accounts : accounts.filter(a => !a.isHidden);
        sourceAccounts.forEach(a => {
            totals[a.currency] = (totals[a.currency] || 0) + a.balance;
        });
        return Object.entries(totals).map(([curr, amount]) => ({ currency: curr as Currency, amount }));
    }, [accounts, showHidden, filterType]);

    const displayAccounts = useMemo(() => {
        let result = accounts;
        if (filterType === 'Hidden') {
            result = result.filter(a => a.isHidden);
        } else {
            if (!showHidden) {
                result = result.filter(a => !a.isHidden);
            }
            if (filterType !== 'All') {
                result = result.filter(a => a.type === filterType);
            }
        }
        if (filterOwner !== 'All') {
            result = result.filter(a => a.owner === filterOwner);
        }
        if (selectedCurrency) {
            result = result.filter(a => a.currency === selectedCurrency);
        }
        return result;
    }, [accounts, showHidden, filterType, filterOwner, selectedCurrency]);

    const groupedAccounts = useMemo<Record<string, Account[]>>(() => {
        const groups: Record<string, Account[]> = {};
        const currencies = selectedCurrency ? [selectedCurrency] : Array.from(new Set(displayAccounts.map(a => a.currency)));

        currencies.forEach(curr => {
            const accs = displayAccounts.filter(a => a.currency === curr);
            if (accs.length > 0) {
                groups[curr] = accs;
            }
        });

        return groups;
    }, [displayAccounts, selectedCurrency]);

    const openAddModal = (defaultType?: string) => {
        setEditingAccount(null);
        const todayStr = getPhnomPenhNowISO().slice(0, 10);
        setAccountForm({
            name: '',
            type: defaultType || AccountType.BANK,
            balance: '',
            currency: selectedCurrency ? (selectedCurrency as Currency) : settings.defaultCurrency,
            status: AccountStatus.ACTIVE,
            note: '',
            owner: accountOwners[0] || 'Kimsan',
            termMonths: '12',
            interestRate: '7.25',
            startDate: todayStr,
            maturityDate: computeMaturityDate(todayStr, 12)
        });
        setErrors({});
        setIsNewMenuOpen(false);
        setIsAddModalOpen(true);
    };

    const openEditModal = (acc: Account) => {
        setEditingAccount(acc);
        const todayStr = getPhnomPenhNowISO().slice(0, 10);
        setAccountForm({
            name: acc.name,
            type: acc.type,
            balance: acc.balance.toString(),
            currency: acc.currency as Currency,
            status: acc.status || AccountStatus.ACTIVE,
            note: acc.note || '',
            owner: acc.owner || accountOwners[0] || 'Kimsan',
            termMonths: acc.termDeposit?.termMonths ? acc.termDeposit.termMonths.toString() : '12',
            interestRate: acc.termDeposit?.interestRate ? acc.termDeposit.interestRate.toString() : '7.25',
            startDate: acc.termDeposit?.startDate || todayStr,
            maturityDate: acc.termDeposit?.maturityDate || computeMaturityDate(todayStr, 12),
            isHidden: !!acc.isHidden
        });
        setErrors({});
        setIsAddModalOpen(true);
    };

    const openTransferModal = () => {
        setTransferForm({ fromId: '', toId: '', amount: '', date: getPhnomPenhNowISO(), note: '' });
        setErrors({});
        setIsNewMenuOpen(false);
        setIsTransferModalOpen(true);
    };

    const openAdjustModal = (acc: Account) => {
        setTargetAccount(acc);
        // Ensure we initialize with the full datetime string for datetime-local input
        setAdjustForm({ balance: acc.balance.toString(), date: getPhnomPenhNowISO(), note: '' });
        setErrors({});
        setIsAdjustModalOpen(true);
    };

    // Handle incoming transfer action from FAB
    useEffect(() => {
        const state = location.state as { action?: string } | null;
        if (state && state.action === 'transfer') {
            openTransferModal();
            // Clear navigation state to prevent reopening on refresh (though location state is ephemeral)
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    const handleAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        const newErrors: Record<string, string> = {};

        if (!accountForm.name.trim()) newErrors.name = "Account name is required.";
        const bal = parseFloat(accountForm.balance.replace(/,/g, ''));
        if (isNaN(bal)) newErrors.balance = t('error_invalid_amount');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 500));

        const isTermDeposit = accountForm.type === AccountType.TERM_DEPOSIT;
        const termMonthsNum = parseInt(accountForm.termMonths, 10) || 12;
        const interestRateNum = parseFloat(accountForm.interestRate) || 7.25;
        const startDateVal = accountForm.startDate || getPhnomPenhNowISO().slice(0, 10);
        const maturityDateVal = accountForm.maturityDate || computeMaturityDate(startDateVal, termMonthsNum);

        const termDepositPayload: TermDepositDetails | undefined = isTermDeposit ? {
            depositAmount: bal,
            termMonths: termMonthsNum,
            interestRate: interestRateNum,
            startDate: startDateVal,
            maturityDate: maturityDateVal,
            taxRate: 6
        } : undefined;

        if (editingAccount) {
            updateAccount({
                ...editingAccount,
                name: accountForm.name,
                type: accountForm.type,
                balance: bal,
                currency: accountForm.currency,
                status: accountForm.status,
                note: accountForm.note,
                owner: accountForm.owner,
                termDeposit: termDepositPayload,
                isHidden: accountForm.isHidden
            });
        } else {
            addAccount({
                name: accountForm.name,
                type: accountForm.type,
                balance: bal,
                currency: accountForm.currency,
                status: accountForm.status,
                note: accountForm.note,
                owner: accountForm.owner,
                termDeposit: termDepositPayload,
                isHidden: accountForm.isHidden
            });
        }
        setIsSubmitting(false);
        setIsAddModalOpen(false);
    };

    const handleTransferSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        const newErrors: Record<string, string> = {};

        if (!transferForm.fromId) newErrors.fromId = t('error_source_account');
        if (!transferForm.toId) newErrors.toId = t('error_destination_account');
        if (transferForm.fromId === transferForm.toId) newErrors.toId = t('error_same_account');

        const amount = parseFloat(transferForm.amount.replace(/,/g, ''));
        if (isNaN(amount) || amount <= 0) newErrors.amount = t('error_invalid_amount');
        if (!transferForm.date) newErrors.date = t('error_date');

        const sourceAcc = accounts.find(a => a.id === transferForm.fromId);
        if (sourceAcc && amount > sourceAcc.balance) newErrors.amount = t('error_insufficient_funds');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 500));

        const fromAcc = accounts.find(a => a.id === transferForm.fromId)!;
        const toAcc = accounts.find(a => a.id === transferForm.toId)!;

        // Calculate destination amount
        let toAmount = amount;
        if (fromAcc.currency !== toAcc.currency) {
            toAmount = convertToDefault(amount, fromAcc.currency as string, toAcc.currency as string, settings.exchangeRates);
        }

        // Create Transfer Out transaction (Expense)
        addTransaction({
            type: TransactionType.EXPENSE,
            category: 'Transfer Out',
            accountId: fromAcc.id,
            amount: amount,
            currency: fromAcc.currency,
            date: new Date(transferForm.date).toISOString(),
            note: transferForm.note || t('transfer_to', { name: toAcc.name }),
            isInternalTransfer: true,
            createdBy: 'System'
        });

        // Create Transfer In transaction (Income)
        addTransaction({
            type: TransactionType.INCOME,
            category: 'Transfer In',
            accountId: toAcc.id,
            amount: toAmount,
            currency: toAcc.currency,
            date: new Date(transferForm.date).toISOString(),
            note: transferForm.note || t('transfer_from', { name: fromAcc.name }),
            isInternalTransfer: true,
            createdBy: 'System'
        });

        setIsSubmitting(false);
        setIsTransferModalOpen(false);
    };

    const handleAdjustSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetAccount) return;
        setErrors({});
        const newErrors: Record<string, string> = {};

        const newBalance = parseFloat(adjustForm.balance.replace(/,/g, ''));
        if (isNaN(newBalance)) newErrors.balance = t('error_invalid_amount');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 500));

        const diff = newBalance - targetAccount.balance;
        if (Math.abs(diff) > 0) {
            addTransaction({
                type: diff > 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
                category: 'Balance Adjustment',
                accountId: targetAccount.id,
                amount: Math.abs(diff),
                currency: targetAccount.currency,
                date: new Date(adjustForm.date).toISOString(),
                note: t('manual_adjustment') + (adjustForm.note ? ` ${adjustForm.note}` : ''),
                isInternalTransfer: true
            });
        }

        setIsSubmitting(false);
        setIsAdjustModalOpen(false);
        setTargetAccount(null);
    };

    const getCurrencyColor = (currency: string) => {
        if (currency === Currency.USD) return 'emerald';
        if (currency === Currency.KHR) return 'blue';
        if (currency === Currency.THB) return 'yellow';
        return 'purple';
    };

    return (
        <div className={cn(CLASSES.container, "!px-2 md:!px-4 lg:!px-6 !space-y-4 pb-24")}>
            {/* Actions Header */}
            <div className="w-full py-2 -mx-2 px-2 md:-mx-4 md:px-4 lg:-mx-6 lg:px-6 border-b border-gray-200/50 dark:border-dark-border/50 transition-all duration-200 no-print">
                <div className="w-full flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowHidden(prev => !prev)}
                            className={cn(
                                CLASSES.buttonSecondary,
                                "h-10 px-3.5 rounded-xl border-2 shadow-sm font-semibold flex items-center gap-2 transition-all text-xs",
                                showHidden 
                                    ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400" 
                                    : "text-gray-600 dark:text-gray-300"
                            )}
                            title={showHidden ? t('hide_hidden_accounts') : t('show_hidden_accounts')}
                        >
                            {showHidden ? <Eye size={14} className="text-amber-600 dark:text-amber-400" /> : <EyeOff size={14} className="text-gray-400" />}
                            <span>{showHidden ? t('hide_hidden') : t('show_hidden')}</span>
                            {hiddenAccountsCount > 0 && (
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none",
                                    showHidden ? "bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                )}>
                                    {hiddenAccountsCount}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="w-full sm:w-auto grid grid-cols-3 gap-3">
                        <div className="relative" ref={filterMenuRef}>
                            <button
                                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                                className={cn(
                                    CLASSES.buttonSecondary,
                                    // Rule: Rounded-xl for Buttons
                                    "w-full h-10 px-4 rounded-xl border-2 shadow-sm font-semibold flex items-center justify-center gap-2 transition-all text-xs",
                                    filterType !== 'All' && "bg-emerald-50 border-emerald-100 text-emerald-600"
                                )}
                            >
                                <Typography variant="body" className="font-bold text-xs truncate">
                                    {filterType === 'All' ? t('view_all') : filterType === 'Hidden' ? t('hidden_accounts') : t(filterType.toLowerCase()) || filterType}
                                </Typography>
                                <ChevronDown size={14} className={cn("transition-transform duration-300 shrink-0", isFilterMenuOpen && "rotate-180")} />
                            </button>

                            {isFilterMenuOpen && (
                                <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-dark-card border border-gray-200/60 dark:border-dark-border rounded-xl shadow-2xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top-left ring-1 ring-black/5 overflow-hidden">
                                    <button
                                        onClick={() => { setFilterType('All'); setIsFilterMenuOpen(false); }}
                                        className={cn("w-full text-left px-4 py-2.5 text-sm font-bold transition-colors h-10", filterType === 'All' ? "text-emerald-600 bg-emerald-50/30" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800")}
                                    >
                                        {t('view_all')}
                                    </button>
                                    {[AccountType.BANK, AccountType.CASH, AccountType.WALLET, AccountType.TERM_DEPOSIT].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => { setFilterType(type); setIsFilterMenuOpen(false); }}
                                            className={cn("w-full text-left px-4 py-2.5 text-sm font-bold transition-colors h-10", filterType === type ? "text-emerald-600 bg-emerald-50/30" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800")}
                                        >
                                            {t(type.toLowerCase().replace(/\s+/g, '_')) || type}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => { setFilterType('Hidden'); setIsFilterMenuOpen(false); }}
                                        className={cn("w-full text-left px-4 py-2.5 text-sm font-bold transition-colors h-10 flex items-center justify-between border-t border-gray-100 dark:border-gray-800", filterType === 'Hidden' ? "text-amber-600 bg-amber-50/30" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800")}
                                    >
                                        <span>{t('hidden_accounts')}</span>
                                        {hiddenAccountsCount > 0 && (
                                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                {hiddenAccountsCount}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="relative" ref={ownerMenuRef}>
                            <button
                                onClick={() => setIsOwnerMenuOpen(!isOwnerMenuOpen)}
                                className={cn(
                                    CLASSES.buttonSecondary,
                                    "w-full h-10 px-4 rounded-xl border-2 shadow-sm font-semibold flex items-center justify-center gap-2 transition-all text-xs",
                                    filterOwner !== 'All' && "bg-emerald-50 border-emerald-100 text-emerald-600"
                                )}
                            >
                                <Typography variant="body" className="font-bold text-xs truncate">
                                    {filterOwner === 'All' ? t('all_owners', 'All Owners') : filterOwner}
                                </Typography>
                                <ChevronDown size={14} className={cn("transition-transform duration-300 shrink-0", isOwnerMenuOpen && "rotate-180")} />
                            </button>

                            {isOwnerMenuOpen && (
                                <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-dark-card border border-gray-200/60 dark:border-dark-border rounded-xl shadow-2xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top-left ring-1 ring-black/5 overflow-hidden">
                                    <button
                                        onClick={() => { setFilterOwner('All'); setIsOwnerMenuOpen(false); }}
                                        className={cn("w-full text-left px-4 py-2.5 text-sm font-bold transition-colors h-10 flex items-center justify-between", filterOwner === 'All' ? "text-emerald-600 bg-emerald-50/30" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800")}
                                    >
                                        <span>{t('all_owners', 'All Owners')}</span>
                                        <span className="text-[11px] font-semibold text-gray-400">({accounts.length})</span>
                                    </button>
                                    <div className="max-h-56 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800/40">
                                        {accountOwners.map(owner => {
                                            const count = accounts.filter(a => a.owner === owner).length;
                                            return (
                                                <button
                                                    key={owner}
                                                    onClick={() => { setFilterOwner(owner); setIsOwnerMenuOpen(false); }}
                                                    className={cn("w-full text-left px-4 py-2.5 text-sm font-bold transition-colors h-10 flex items-center justify-between", filterOwner === owner ? "text-emerald-600 bg-emerald-50/30" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800")}
                                                >
                                                    <span className="truncate">{owner}</span>
                                                    <span className="text-[11px] font-semibold text-gray-400 ml-2">({count})</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                                    <button
                                        onClick={() => { setIsOwnerMenuOpen(false); setIsManageOwnersOpen(true); }}
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors flex items-center gap-2"
                                    >
                                        <Settings2 size={13} />
                                        <span>{t('manage_owners')}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="relative" ref={newMenuRef}>
                            {can('Accounts', 'add') && (
                                <button
                                    onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
                                    // Rule: Rounded-xl for Buttons
                                    className={cn(CLASSES.buttonPrimary, "w-full h-10 px-4 shadow-sm font-semibold flex items-center justify-center gap-2 text-sm rounded-xl")}
                                >
                                    <PlusCircle size={16} />
                                    <span>{t('new')}</span>
                                    <ChevronDown size={14} className={cn("transition-transform shrink-0", isNewMenuOpen && "rotate-180")} />
                                </button>
                            )}
                            {isNewMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-dark-card border border-gray-200/60 dark:border-dark-border rounded-xl shadow-2xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5 overflow-hidden">
                                    <button
                                        onClick={() => openAddModal()}
                                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-3 transition-colors h-10"
                                    >
                                        <Wallet size={16} /> {t('add_account')}
                                    </button>
                                    <button
                                        onClick={() => openAddModal(AccountType.TERM_DEPOSIT)}
                                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-3 transition-colors h-10"
                                    >
                                        <PiggyBank size={16} /> {t('add_term_deposit', 'Add Term Deposit')}
                                    </button>
                                    <button
                                        onClick={openTransferModal}
                                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-3 transition-colors h-10"
                                    >
                                        <CalendarSync size={16} /> {t('transfer_money')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards with Filtering Capability */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {currencyTotals.map((item, idx) => (
                    <KPICard
                        key={item.currency}
                        title={t('total_balance')}
                        amount={item.amount}
                        currency={item.currency}
                        defaultCurrency={settings.defaultCurrency}
                        exchangeRates={settings.exchangeRates}
                        lang={settings.language}
                        onClick={() => setSelectedCurrency(selectedCurrency === item.currency ? null : item.currency)}
                        isSelected={selectedCurrency === item.currency}
                        tooltip={t('total_balance_tooltip')}
                        t={t}
                    />
                ))}
            </div>

            {/* Accounts Grid Grouped by Currency */}
            <div className="space-y-6">
                {Object.entries(groupedAccounts).map(([currency, groupAccs]) => {
                    const accs = groupAccs as Account[];
                    return (
                        <div key={currency} className="space-y-3 animate-in slide-in-from-bottom-2 duration-500">
                            <div className="flex items-center gap-2 px-1">
                                {/* Rule: Rounded-lg for Badge */}
                                <span className={cn(
                                    "px-2 py-0.5 text-[10px] md:text-xs font-semibold rounded-lg border",
                                    getCurrencyColor(currency) === 'emerald' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                        getCurrencyColor(currency) === 'blue' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                            getCurrencyColor(currency) === 'yellow' ? "bg-yellow-50 text-yellow-600 border-yellow-100" :
                                                "bg-purple-50 text-purple-600 border-purple-100"
                                )}>
                                    {currency}
                                </span>
                                <Typography variant="caption" className="font-bold opacity-65">{t('accounts')}</Typography>
                            </div>
                            <ResponsiveGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {accs.map((acc, i) => (
                                    <div
                                        key={acc.id}
                                        onClick={() => navigate(`/accounts/${acc.id}`)}
                                        // Rule: Rounded-xl for Cards
                                        className={cn(
                                            CLASSES.card, 
                                            "p-3 flex flex-col gap-2.5 hover:border-emerald-500/50 hover:shadow-lg transition-all group cursor-pointer relative rounded-xl md:rounded-xl dark:border-gray-700",
                                            acc.isHidden && "border-dashed border-amber-300 dark:border-amber-700/60 bg-amber-50/20 dark:bg-amber-950/10"
                                        )}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="p-1.5 bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 rounded-lg border border-gray-100 dark:border-gray-700 transition-colors shrink-0">
                                                    {acc.type === AccountType.WALLET ? <Wallet size={16} /> : 
                                                     acc.type === AccountType.CASH ? <Coins size={16} /> : 
                                                     acc.type === AccountType.TERM_DEPOSIT ? <PiggyBank size={16} className="text-emerald-600" /> : <Landmark size={16} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <Typography variant="h3" className="truncate text-sm md:text-base font-semibold group-hover:text-emerald-600 transition-colors">{acc.name}</Typography>
                                                        {acc.isHidden && (
                                                            <span className="text-[10px] md:text-xs font-normal px-1 py-0.5 rounded-md border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 flex items-center gap-1">
                                                                <EyeOff size={10} /> {t('hidden')}
                                                            </span>
                                                        )}
                                                        {acc.status && acc.status !== AccountStatus.ACTIVE && (
                                                            <span className={cn(
                                                                "text-[10px] md:text-xs font-normal px-1 py-0.5 rounded-md border",
                                                                acc.status === AccountStatus.DEFAULT && "bg-emerald-50 text-emerald-600 border-emerald-100",
                                                                acc.status === AccountStatus.INACTIVE && "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                                                            )}>
                                                                {t(acc.status.toLowerCase()) || acc.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Typography variant="caption" className="opacity-65 text-[10px] md:text-xs font-normal leading-none">
                                                            {t(acc.type.toLowerCase().replace(/\s+/g, '_')) || acc.type}
                                                        </Typography>
                                                        {acc.owner && (
                                                            <>
                                                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0"></span>
                                                                <Typography variant="caption" className="opacity-80 text-[10px] md:text-xs font-medium leading-none">{acc.owner}</Typography>
                                                            </>
                                                        )}
                                                    </div>
                                                    {acc.type === AccountType.TERM_DEPOSIT && acc.termDeposit && (
                                                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800">
                                                                {acc.termDeposit.termMonths} {t('months', 'Months')} • {acc.termDeposit.interestRate}% p.a.
                                                            </span>
                                                            <span className="text-[10px] font-medium text-gray-400">
                                                                {formatDate(acc.termDeposit.maturityDate, settings.language)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="-mr-1 self-start">
                                                <AccountsMenu
                                                    onEdit={can('Accounts', 'edit') ? () => openEditModal(acc) : undefined}
                                                    onAdjustBalance={can('Accounts', 'edit') ? () => openAdjustModal(acc) : undefined}
                                                    onSetDefault={can('Accounts', 'edit') ? () => setDefaultAccount(acc.id) : undefined}
                                                    isDefault={acc.status === AccountStatus.DEFAULT}
                                                    onDelete={can('Accounts', 'delete') ? () => { setDeleteTarget(acc.id); setDeleteConfirmOpen(true); } : undefined}
                                                    isHidden={acc.isHidden}
                                                    onToggleHide={can('Accounts', 'edit') ? () => toggleHideAccount(acc.id) : undefined}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-end">
                                            <Typography variant="caption" className="block mb-px text-xs md:text-sm opacity-85">
                                                {acc.type === AccountType.TERM_DEPOSIT ? t('deposit_balance', 'Deposit Balance') : t('available')}
                                            </Typography>
                                            <Typography variant="h2" className="text-base md:text-lg font-semibold tabular-nums tracking-tight leading-none text-emerald-600 dark:text-emerald-400">{formatCurrency(acc.balance, acc.currency, settings.language)}</Typography>
                                        </div>
                                    </div>
                                ))}
                            </ResponsiveGrid>
                        </div>
                    )
                })}

                {displayAccounts.length === 0 && (
                    <div className="col-span-full py-20 text-center flex flex-col items-center justify-center gap-4">
                        <Landmark size={48} className="opacity-20" strokeWidth={1} />
                        <Typography variant="caption">{t('no_data')}</Typography>
                    </div>
                )}
            </div>

            {/* Add/Edit Account Modal */}
            {isAddModalOpen && (
                <div className={cn(CLASSES.modalOverlay, "sm:p-4 p-0")}>
                    {/* Rule: Rounded-xl for Modal Container */}
                    <div style={{ height: window.innerWidth < 640 ? `${visualViewportHeight}px` : undefined }} className={cn(CLASSES.modalContent, "max-w-md sm:h-auto sm:max-h-[90dvh] rounded-none sm:rounded-xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 relative overflow-hidden flex flex-col")}>
                        <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 shrink-0")}>
                            <Typography variant="h2" className="text-base md:text-lg">{editingAccount ? t('edit_account') : t('add_account')}</Typography>
                            <button onClick={() => setIsAddModalOpen(false)} className={CLASSES.buttonGhost}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleAccountSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className={cn(CLASSES.modalBody, "p-5 space-y-4 flex-1 overflow-y-auto")}>
                                <div className="space-y-1">
                                    <Typography variant="label">{t('account_name')}</Typography>
                                    {/* Rule: Rounded-md for Input */}
                                    <input required disabled={isSubmitting} className={cn(CLASSES.input, "h-11 rounded-md border-2")} value={accountForm.name} onChange={e => setAccountForm({ ...accountForm, name: e.target.value })} placeholder="e.g. ABA Savings" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Typography variant="label">{t('type')}</Typography>
                                        <CustomSelect
                                            value={accountForm.type}
                                            onChange={val => setAccountForm({ ...accountForm, type: val })}
                                            options={Object.values(AccountType).map(t_val => ({ value: t_val, label: t(t_val.toLowerCase()) || t_val }))}
                                            placeholder={t('select_type')}
                                            disabled={isSubmitting}
                                            t={t}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Typography variant="label">{t('status')}</Typography>
                                        <CustomSelect
                                            value={accountForm.status}
                                            onChange={val => setAccountForm({ ...accountForm, status: val as AccountStatus })}
                                            options={Object.values(AccountStatus).map(s => ({ value: s, label: t(s.toLowerCase()) || s }))}
                                            placeholder={t('select_status')}
                                            disabled={isSubmitting}
                                            t={t}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {!editingAccount ? (
                                        <div className="space-y-1">
                                            <Typography variant="label">{t('currency')}</Typography>
                                            <CustomSelect
                                                value={accountForm.currency}
                                                onChange={val => setAccountForm({ ...accountForm, currency: val as Currency })}
                                                options={[Currency.USD, Currency.KHR].map(c => ({ value: c, label: c }))}
                                                placeholder={t('select_currency')}
                                                disabled={isSubmitting}
                                                t={t}
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <Typography variant="label">{t('currency')}</Typography>
                                            <div className="h-11 md:h-10 rounded-md border-2 bg-gray-50 dark:bg-gray-800 flex items-center px-3 text-gray-500 font-semibold text-sm">
                                                {accountForm.currency}
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <Typography variant="label">{t('owner', 'Owner')}</Typography>
                                            <button
                                                type="button"
                                                onClick={() => setIsManageOwnersOpen(true)}
                                                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                                            >
                                                <Settings2 size={11} />
                                                <span>{t('manage_owners')}</span>
                                            </button>
                                        </div>
                                        <CustomSelect
                                            value={accountForm.owner}
                                            onChange={val => {
                                                if (val === '__ADD_NEW__') {
                                                    setIsAddOwnerPromptOpen(true);
                                                } else {
                                                    setAccountForm({ ...accountForm, owner: val });
                                                }
                                            }}
                                            options={[
                                                ...accountOwners.map(o => ({ value: o, label: o })),
                                                { value: '__ADD_NEW__', label: t('add_new_owner') }
                                            ]}
                                            placeholder={t('select_owner', 'Select Owner')}
                                            disabled={isSubmitting}
                                            t={t}
                                        />
                                    </div>
                                </div>
                                {(!editingAccount || accountForm.type === AccountType.TERM_DEPOSIT) && (
                                    // Rule: Form Input -> text-base font-semibold
                                    <NumericInput
                                        label={accountForm.type === AccountType.TERM_DEPOSIT ? t('deposit_amount', 'Deposit Amount') : t('beginning_balance')}
                                        value={accountForm.balance}
                                        onChange={v => setAccountForm({ ...accountForm, balance: v })}
                                        inputClassName="h-11 rounded-md border-2 text-base font-semibold"
                                    />
                                )}

                                {accountForm.type === AccountType.TERM_DEPOSIT && (
                                    <div className="space-y-4 pt-1">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <Typography variant="label">{t('deposit_term', 'Deposit Term')}</Typography>
                                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-md">[ {t('months', 'Months')} ]</span>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="120"
                                                        disabled={isSubmitting}
                                                        className={cn(CLASSES.input, "h-11 rounded-md border-2 pr-16 text-base font-semibold")}
                                                        value={accountForm.termMonths}
                                                        onChange={e => {
                                                            const m = e.target.value;
                                                            setAccountForm(prev => ({
                                                                ...prev,
                                                                termMonths: m,
                                                                maturityDate: computeMaturityDate(prev.startDate, parseInt(m, 10) || 12)
                                                            }));
                                                        }}
                                                        placeholder="12"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                                                        {t('months', 'Months')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 mt-1 overflow-x-auto pb-1 scrollbar-none">
                                                    {[1, 3, 6, 12, 24, 36].map(m => (
                                                        <button
                                                            key={m}
                                                            type="button"
                                                            onClick={() => {
                                                                setAccountForm(prev => ({
                                                                    ...prev,
                                                                    termMonths: m.toString(),
                                                                    maturityDate: computeMaturityDate(prev.startDate, m)
                                                                }));
                                                            }}
                                                            className={cn(
                                                                "px-2 py-0.5 text-[10px] font-semibold rounded-md border transition-all shrink-0",
                                                                accountForm.termMonths === m.toString()
                                                                    ? "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 border-emerald-300 dark:border-emerald-700"
                                                                    : "bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:text-emerald-600"
                                                            )}
                                                        >
                                                            {m}M
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <Typography variant="label">{t('interest_rate', 'Interest Rate')}</Typography>
                                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-md">[ % p.a. ]</span>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max="100"
                                                        disabled={isSubmitting}
                                                        className={cn(CLASSES.input, "h-11 rounded-md border-2 pr-10 text-base font-semibold")}
                                                        value={accountForm.interestRate}
                                                        onChange={e => setAccountForm({ ...accountForm, interestRate: e.target.value })}
                                                        placeholder="7.25"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                                                        %
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <CustomDatePicker
                                                type="date"
                                                label={t('start_date', 'Start Date')}
                                                value={accountForm.startDate}
                                                onChange={val => {
                                                    setAccountForm(prev => ({
                                                        ...prev,
                                                        startDate: val,
                                                        maturityDate: computeMaturityDate(val, parseInt(prev.termMonths, 10) || 12)
                                                    }));
                                                }}
                                                inputClassName="h-11 rounded-md border-2"
                                                disabled={isSubmitting}
                                            />
                                            <CustomDatePicker
                                                type="date"
                                                label={t('maturity_date', 'Maturity Date')}
                                                value={accountForm.maturityDate}
                                                onChange={val => setAccountForm(prev => ({ ...prev, maturityDate: val }))}
                                                inputClassName="h-11 rounded-md border-2"
                                                disabled={isSubmitting}
                                            />
                                        </div>

                                        {/* Real-time Calculation Preview Card */}
                                        {(() => {
                                            const balVal = parseFloat(accountForm.balance.replace(/,/g, '')) || 0;
                                            const termVal = parseInt(accountForm.termMonths, 10) || 12;
                                            const rateVal = parseFloat(accountForm.interestRate) || 7.25;
                                            const financials = computeTermDepositFinancials(balVal, rateVal, termVal, 6);

                                            return (
                                                <div className="space-y-3 pt-1">
                                                    {/* Rounded white information-card section */}
                                                    <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-4 border border-gray-200/80 dark:border-gray-700 shadow-sm space-y-3">
                                                        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700/60">
                                                            <div className="flex items-center gap-2">
                                                                <PiggyBank size={18} className="text-emerald-500" />
                                                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('term_deposit', 'Term Deposit')}</span>
                                                            </div>
                                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                                                {accountForm.currency}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                                                                <span className="text-[10px] font-semibold text-gray-400 block mb-0.5">{t('deposit_term', 'Deposit Term')}</span>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-base font-bold text-gray-800 dark:text-gray-100 tabular-nums">{termVal}</span>
                                                                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-md">[ {t('months', 'Months')} ]</span>
                                                                </div>
                                                            </div>
                                                            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                                                                <span className="text-[10px] font-semibold text-gray-400 block mb-0.5">{t('interest_rate', 'Interest Rate')}</span>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">[ {rateVal}% ]</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Lower summary section */}
                                                    <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-4 border border-gray-200/80 dark:border-gray-700 shadow-sm space-y-2.5 text-xs">
                                                        <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                                                            <span className="font-medium">{t('deposit_amount', 'Deposit Amount')}:</span>
                                                            <span className="font-bold tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(financials.depositAmount, accountForm.currency, settings.language)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                                                            <span className="font-medium">{t('total_interest', 'Total Interest')}:</span>
                                                            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">+{formatCurrency(financials.totalInterest, accountForm.currency, settings.language)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                                                            <span className="font-medium">{t('tax_on_interest', 'Tax on Interest (6%)')}:</span>
                                                            <span className="font-bold tabular-nums text-red-500">-{formatCurrency(financials.taxOnInterest, accountForm.currency, settings.language)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-gray-600 dark:text-gray-300 pt-1 border-t border-gray-100 dark:border-gray-700/60">
                                                            <span className="font-medium">{t('net_interest_after_tax', 'Net Interest After Tax')}:</span>
                                                            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">+{formatCurrency(financials.netInterest, accountForm.currency, settings.language)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center pt-2 border-t-2 border-emerald-500/20 text-gray-900 dark:text-gray-50">
                                                            <span className="font-bold text-xs uppercase tracking-tight text-gray-700 dark:text-gray-200">{t('total_principal_and_interest', 'Total Principal & Interest')}:</span>
                                                            <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(financials.totalPrincipalAndInterest, accountForm.currency, settings.language)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center px-1">
                                        <Typography variant="label">{t('note')}</Typography>
                                        <Typography variant="caption" className={cn("text-xs font-medium transition-colors", accountForm.note.length > 100 ? "text-orange-500" : "text-gray-400")}>
                                            {accountForm.note.length} / 120
                                        </Typography>
                                    </div>
                                    {/* Rule: Rounded-md for Textarea */}
                                    <textarea maxLength={120} className={cn(CLASSES.input, "h-16 py-2 resize-none text-sm rounded-md border-2")} value={accountForm.note} onChange={e => setAccountForm({ ...accountForm, note: e.target.value })} placeholder={t('add_details')} />
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400">
                                            <EyeOff size={16} />
                                        </div>
                                        <div>
                                            <Typography variant="label" className="text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200 block">{t('hide_from_main_list')}</Typography>
                                            <Typography variant="caption" className="text-[11px] text-gray-500 dark:text-gray-400 block leading-tight">{t('hide_account_hint')}</Typography>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={accountForm.isHidden}
                                            onChange={e => setAccountForm({ ...accountForm, isHidden: e.target.checked })}
                                            className="sr-only peer"
                                            disabled={isSubmitting}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                                    </label>
                                </div>
                            </div>
                            <div className={cn(
                                "border-t border-gray-100 dark:border-gray-800 z-30 shrink-0",
                                "flex flex-row items-center gap-3 bg-white dark:bg-[#161b22]",
                                "transition-all duration-300 ease-in-out px-4 md:px-5",
                                isKeyboardOpen ? "py-2" : "py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
                            )}>
                                {/* Rule: Rounded-xl for Buttons */}
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-10 border-2 rounded-xl")}>{t('cancel')}</button>
                                <button type="submit" disabled={isSubmitting} className={cn(CLASSES.buttonPrimary, "flex-1 h-11 md:h-10 rounded-xl")}>{isSubmitting ? <Loader2 className="animate-spin" size={16} /> : t('save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transfer Modal */}
            {isTransferModalOpen && (
                <div className={cn(CLASSES.modalOverlay, "sm:p-4 p-0")}>
                    {/* Rule: Rounded-xl for Modal Container */}
                    <div style={{ height: window.innerWidth < 640 ? `${visualViewportHeight}px` : undefined }} className={cn(CLASSES.modalContent, "max-w-md sm:h-auto sm:max-h-[90dvh] rounded-none sm:rounded-xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 relative overflow-hidden flex flex-col")}>
                        <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 shrink-0")}>
                            <Typography variant="h2" className="text-base md:text-lg">{t('transfer_money')}</Typography>
                            <button onClick={() => setIsTransferModalOpen(false)} className={CLASSES.buttonGhost}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleTransferSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className={cn(CLASSES.modalBody, "p-5 space-y-4 flex-1 overflow-y-auto")}>
                                <div className="space-y-1">
                                    <Typography variant="label">{t('source_account')}</Typography>
                                    <CustomSelect
                                        value={transferForm.fromId}
                                        onChange={val => setTransferForm({ ...transferForm, fromId: val })}
                                        options={accounts.map(a => ({ value: a.id, label: `${a.name} (${formatCurrency(a.balance, a.currency)})` }))}
                                        placeholder={t('select_source')}
                                        disabled={isSubmitting}
                                        error={!!errors.fromId}
                                        t={t}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Typography variant="label">{t('destination_account')}</Typography>
                                    <CustomSelect
                                        value={transferForm.toId}
                                        onChange={val => setTransferForm({ ...transferForm, toId: val })}
                                        options={accounts.filter(a => a.id !== transferForm.fromId).map(a => ({ value: a.id, label: `${a.name} (${formatCurrency(a.balance, a.currency)})` }))}
                                        placeholder={t('select_destination')}
                                        disabled={isSubmitting}
                                        error={!!errors.toId}
                                        t={t}
                                    />
                                </div>
                                {/* Rule: Form Input -> text-base font-semibold */}
                                <NumericInput label={t('amount')} value={transferForm.amount} onChange={v => setTransferForm({ ...transferForm, amount: v })} inputClassName="h-11 rounded-md border-2 text-base font-semibold" />
                                <CustomDatePicker
                                    type="datetime-local"
                                    label={t('date_time')}
                                    value={transferForm.date}
                                    onChange={v => setTransferForm({ ...transferForm, date: v })}
                                    inputClassName="h-11 rounded-md border-2"
                                />
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center px-1">
                                        <Typography variant="label">{t('note')}</Typography>
                                        <Typography variant="caption" className={cn("text-xs font-medium transition-colors", transferForm.note.length > 100 ? "text-orange-500" : "text-gray-400")}>
                                            {transferForm.note.length} / 120
                                        </Typography>
                                    </div>
                                    {/* Rule: Rounded-md for Textarea */}
                                    <textarea maxLength={120} className={cn(CLASSES.input, "h-16 py-2 resize-none text-xs rounded-md border-2")} value={transferForm.note} onChange={e => setTransferForm({ ...transferForm, note: e.target.value })} placeholder={t('transfer_details')} />
                                </div>
                            </div>
                            <div className={cn(
                                "border-t border-gray-100 dark:border-gray-800 z-30 shrink-0",
                                "flex flex-row items-center gap-3 bg-white dark:bg-[#161b22]",
                                "transition-all duration-300 ease-in-out px-4 md:px-5",
                                isKeyboardOpen ? "py-2" : "py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
                            )}>
                                {/* Rule: Rounded-xl for Buttons */}
                                <button type="button" onClick={() => setIsTransferModalOpen(false)} className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-10 border-2 rounded-xl")}>{t('cancel')}</button>
                                <button type="submit" disabled={isSubmitting} className={cn(CLASSES.buttonPrimary, "flex-1 h-11 md:h-10 rounded-xl")}>{isSubmitting ? <Loader2 className="animate-spin" size={16} /> : t('complete')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Adjust Balance Modal */}
            {isAdjustModalOpen && targetAccount && (
                <div className={cn(CLASSES.modalOverlay, "sm:p-4 p-0")}>
                    {/* Rule: Rounded-xl for Modal Container */}
                    <div style={{ height: window.innerWidth < 640 ? `${visualViewportHeight}px` : undefined }} className={cn(CLASSES.modalContent, "max-w-md sm:h-auto sm:max-h-[90dvh] rounded-none sm:rounded-xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 relative overflow-hidden flex flex-col")}>
                        <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 shrink-0")}>
                            <Typography variant="h2" className="text-base md:text-lg">{t('adjust_balance')}</Typography>
                            <button onClick={() => setIsAdjustModalOpen(false)} className={CLASSES.buttonGhost}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleAdjustSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className={cn(CLASSES.modalBody, "p-5 space-y-4 flex-1 overflow-y-auto")}>
                                {/* Rule: Rounded-xl for info card */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center border mb-2">
                                    <Typography variant="caption" className="block mb-1">{t('current_balance')}</Typography>
                                    {/* Rule: Summary Card Amount -> text-lg md:text-xl font-semibold */}
                                    <Typography variant="h2" className="text-lg md:text-xl font-semibold">{formatCurrency(targetAccount.balance, targetAccount.currency, settings.language)}</Typography>
                                </div>
                                {/* Rule: Form Input -> text-base font-semibold */}
                                <NumericInput label={t('new_balance')} required value={adjustForm.balance} onChange={v => setAdjustForm({ ...adjustForm, balance: v })} inputClassName="h-11 rounded-md border-2 text-base font-semibold" />
                                <CustomDatePicker
                                    type="datetime-local"
                                    label={t('date_time')}
                                    required
                                    value={adjustForm.date}
                                    onChange={v => setAdjustForm({ ...adjustForm, date: v })}
                                    inputClassName="h-11 rounded-md border-2"
                                />
                                <div className="space-y-1">
                                    <Typography variant="label">{t('note')}</Typography>
                                    {/* Rule: Rounded-md for Textarea */}
                                    <textarea className={cn(CLASSES.input, "h-16 py-2 resize-none text-sm rounded-md border-2")} value={adjustForm.note} onChange={e => setAdjustForm({ ...adjustForm, note: e.target.value })} placeholder={t('adjust_reason_placeholder')} />
                                </div>
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 flex gap-3 items-start mt-2">
                                    <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                                    <Typography variant="caption" className="text-blue-700 dark:text-blue-400 font-medium text-[11px] leading-relaxed">
                                        {t('balance_adjustment_warning')}
                                    </Typography>
                                </div>
                            </div>
                            <div className={cn(
                                "border-t border-gray-200 dark:border-gray-800 z-30 shrink-0",
                                "flex flex-row items-center gap-3 bg-white dark:bg-[#161b22]",
                                "transition-all duration-300 ease-in-out px-4 md:px-5",
                                isKeyboardOpen ? "py-2" : "py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
                            )}>
                                {/* Rule: Rounded-xl for Buttons */}
                                <button type="button" onClick={() => setIsAdjustModalOpen(false)} className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-10 border-2 rounded-xl")}>{t('cancel')}</button>
                                <button type="submit" disabled={isSubmitting} className={cn(CLASSES.buttonPrimary, "flex-1 h-11 md:h-10 rounded-xl")}>{isSubmitting ? <Loader2 className="animate-spin" size={16} /> : t('adjust')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Owners Modal */}
            <ManageOwnersModal
                isOpen={isManageOwnersOpen}
                onClose={() => setIsManageOwnersOpen(false)}
                accountOwners={accountOwners}
                accounts={accounts}
                onAddOwner={addAccountOwner}
                onUpdateOwner={(oldName, newName) => {
                    updateAccountOwner(oldName, newName);
                    if (filterOwner === oldName) setFilterOwner(newName);
                    if (accountForm.owner === oldName) setAccountForm(prev => ({ ...prev, owner: newName }));
                }}
                onDeleteOwner={(name) => {
                    deleteAccountOwner(name);
                    if (filterOwner === name) setFilterOwner('All');
                    if (accountForm.owner === name) setAccountForm(prev => ({ ...prev, owner: accountOwners.find(o => o !== name) || '' }));
                }}
                t={t}
            />

            {/* Quick Add Owner Modal */}
            <QuickAddOwnerModal
                isOpen={isAddOwnerPromptOpen}
                onClose={() => setIsAddOwnerPromptOpen(false)}
                existingOwners={accountOwners}
                onAdd={(name) => {
                    addAccountOwner(name);
                    setAccountForm(prev => ({ ...prev, owner: name }));
                }}
                t={t}
            />

            {/* Delete Confirm */}
            {isDeleteConfirmOpen && (
                <div className={CLASSES.modalOverlay}>
                    {/* Rule: Rounded-xl for Modal Container */}
                    <div className={cn(CLASSES.modalContent, "max-w-md animate-in zoom-in-95 duration-300 rounded-xl")}>
                        <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 shrink-0 justify-center")}>
                            <Typography variant="h2" className="text-base md:text-lg">{t('confirm_removal')}</Typography>
                        </div>
                        <div className={cn(CLASSES.modalBody, "p-6 text-center space-y-4")}>
                            <div className="flex flex-col items-center gap-3">
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-full text-amber-600">
                                    <AlertTriangle size={32} />
                                </div>
                                <Typography variant="body" className="font-medium text-gray-600 dark:text-gray-400">
                                    {t('delete_account_desc')}
                                </Typography>
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                                    <Typography variant="caption" className="text-red-600 dark:text-red-400 font-bold text-xs leading-relaxed">
                                        {t('delete_account_impact_warning')}
                                    </Typography>
                                </div>
                            </div>
                        </div>
                        <div className={cn(CLASSES.modalFooter, "flex-row items-center gap-3 py-2 px-4 md:px-5 bg-gray-50 dark:bg-gray-800/20")}>
                            {/* Rule: Rounded-xl for Buttons */}
                            <button onClick={() => setDeleteConfirmOpen(false)} className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-10 border-2 px-6 rounded-xl")}>{t('cancel')}</button>
                            <button onClick={() => { if (deleteTarget) deleteAccount(deleteTarget); setDeleteConfirmOpen(false); }} className={cn(CLASSES.buttonDanger, "flex-1 h-11 md:h-10 px-6 rounded-xl")}>{t('delete')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
