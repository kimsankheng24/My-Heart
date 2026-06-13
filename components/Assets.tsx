
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../store';
import { formatCurrency, formatDate, formatDateTime, cn, CLASSES, convertToDefault, getPhnomPenhNowISO } from '../utils';
import { 
    Currency, Asset, Liability, 
    DepreciationMethod, AssetType, LiabilityType, Attachment
} from '../types';
import { AssetsMenu } from './menus/AssetsMenu';
import { 
    PlusCircle, X, Landmark, 
    Activity, Search, Info, AlertTriangle, ChevronDown, History,
    FileText, Loader2,
    File, Image as ImageIcon, Paperclip, Download,
    Check, Clock
} from 'lucide-react';
import { NumericInput } from './NumericInput';
import { Typography } from './Typography';
import { ResponsiveGrid } from './ResponsiveGrid';
import * as XLSX from 'xlsx';
import { CustomDatePicker } from './CustomDatePicker';

// Standardized Table classes refined for high-density overview - text-sm font-semibold / normal
const premiumTh = cn(CLASSES.typography.tableHeader, "px-3 py-2 align-middle bg-[#f9fafb] dark:bg-gray-800 border-b border-[#e5e7eb] dark:border-dark-border first:rounded-tl-2xl last:rounded-tr-2xl whitespace-nowrap text-sm font-semibold");
const premiumTd = cn(CLASSES.typography.body, "px-3 py-1 align-middle border-b border-[#f3f4f6] dark:border-dark-border/50 text-sm font-normal");

const FileIcon: React.FC<{ fileName: string; size?: number }> = ({ fileName, size = 18 }) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText size={size} className="text-red-500" />;
    if (['jpg', 'jpeg', 'png'].includes(ext || '')) return <ImageIcon size={size} className="text-blue-500" />;
    if (ext === 'docx' || ext === 'doc') return <FileText size={size} className="text-blue-600" />;
    return <File size={size} className="text-gray-400" />;
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
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-3 bg-gray-900/95 backdrop-blur-md text-white rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 z-[100] ring-1 ring-white/10 text-center">
                <Typography variant="caption" className="text-white text-[13px] leading-relaxed font-medium block">
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
    color: 'emerald' | 'red' | 'blue';
    tooltip?: string;
}> = ({ title, amount, currency, lang, color, tooltip }) => {
    const colorClasses = {
        emerald: 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400',
        red: 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400',
        blue: 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400'
    };

    const titleColors = {
        emerald: 'text-emerald-600 dark:text-emerald-400',
        red: 'text-red-600 dark:text-red-400',
        blue: 'text-blue-600 dark:text-blue-400'
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
                {formatCurrency(amount, currency, lang)}
            </Typography>
        </div>
    );
};

export const Assets: React.FC = () => {
    const { 
        assets, liabilities, addAsset, deleteAsset, addLiability, deleteLiability, 
        settings, t, updateAssetValuation, updateLiabilityBalance, chartOfAccounts,
        markAssetAsSold, markLiabilityAsPaidOff
    } = useApp();
    
    const [activeTab, setActiveTab] = useState<'Assets' | 'Liabilities'>('Assets');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddAssetOpen, setAddAssetOpen] = useState(false);
    const [isAddLiabilityOpen, setAddLiabilityOpen] = useState(false);
    const [isUpdateValueOpen, setUpdateValueOpen] = useState(false);
    const [isMarkAsSoldOpen, setMarkAsSoldOpen] = useState(false);
    const [isMarkAsPaidOffOpen, setMarkAsPaidOffOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
    const [isDocsExpanded, setIsDocsExpanded] = useState(true);
    const [viewingItem, setViewingItem] = useState<{ id: string, type: 'asset' | 'liability' } | null>(null);
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: 'asset' | 'liability', name: string } | null>(null);
    const [previewDoc, setPreviewDoc] = useState<Attachment | null>(null);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [visualViewportHeight, setVisualViewportHeight] = useState(window.innerHeight);
    
    // Error States
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [assetErrors, setAssetErrors] = useState<Record<string, string>>({});
    const [liabErrors, setLiabErrors] = useState<Record<string, string>>({});
    const [updateErrors, setUpdateErrors] = useState<{ amount?: string }>({});
    const [fileError, setFileError] = useState<string | null>(null);
    const [isShaking, setIsShaking] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<Attachment[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [assetForm, setAssetForm] = useState({ glCode: '', name: '', localName: '', type: '' as any, purchaseDate: new Date().toISOString().split('T')[0], cost: '', currentValue: '', currency: '' as any, status: 'Active' as any, note: '' });
    const [liabForm, setLiabForm] = useState({ glCode: '', name: '', localName: '', type: '' as any, amount: '', remaining: '', interestRate: '', monthlyPayment: '', currency: '' as any, startDate: new Date().toISOString().split('T')[0], endDate: '', status: 'Active' as any, note: '' });
    const [actionForm, setActionForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], note: '' });
    const [soldForm, setSoldForm] = useState({ salePrice: '', saleDate: new Date().toISOString().split('T')[0] });
    const [paidOffForm, setPaidOffForm] = useState({ payoffDate: new Date().toISOString().split('T')[0] });

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

    const resetForms = () => {
        setAssetForm({ 
            glCode: '', 
            name: '', 
            localName: '', 
            type: '' as any, 
            purchaseDate: getPhnomPenhNowISO().split('T')[0], 
            cost: '', 
            currentValue: '', 
            currency: '' as any, 
            status: 'Active', 
            note: '' 
        });
        setLiabForm({ 
            glCode: '', 
            name: '', 
            localName: '', 
            type: '' as any, 
            amount: '', 
            remaining: '', 
            interestRate: '', 
            monthlyPayment: '', 
            currency: '' as any, 
            startDate: getPhnomPenhNowISO().split('T')[0], 
            endDate: '', 
            status: 'Active',
            note: '' 
        });
        setPendingFiles([]);
        setAssetErrors({});
        setLiabErrors({});
        setGeneralError(null);
    };

    const totalAssetsVal = assets.filter(a => a.status === 'Active').reduce((sum, a) => sum + convertToDefault(a.currentValue, a.currency, settings.defaultCurrency, settings.exchangeRates), 0);
    const totalLiabsVal = liabilities.filter(l => l.status === 'Active').reduce((sum, l) => sum + convertToDefault(l.remaining, l.currency, settings.defaultCurrency, settings.exchangeRates), 0);
    const netWorthVal = totalAssetsVal - totalLiabsVal;

    const filteredAssets = assets.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (a.localName && a.localName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        a.glCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredLiabilities = liabilities.filter(l => 
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (l.localName && l.localName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        l.glCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const readFileAsDataURL = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const processFiles = async (files: File[]) => {
        setFileError(null);
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'docx'];
        const maxSize = 10 * 1024 * 1024;

        const newAttachments: Attachment[] = [];
        for (const file of files) {
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (!ext || !allowedExtensions.includes(ext)) {
                setFileError(t('file_type_error', { ext }));
                continue;
            }
            if (file.size > maxSize) {
                setFileError(t('file_size_error', { name: file.name }));
                continue;
            }
            
            try {
                const dataUrl = await readFileAsDataURL(file);
                newAttachments.push({
                    id: Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    url: dataUrl,
                    type: file.type || `application/${ext}`,
                    size: file.size
                });
            } catch (err) {
                setFileError(t('file_read_error', { name: file.name }));
            }
        }
        setPendingFiles(prev => [...prev, ...newAttachments]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        processFiles(files);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) processFiles(Array.from(e.dataTransfer.files) as File[]);
    };

    const removePendingFile = (id: string) => setPendingFiles(prev => prev.filter(f => f.id !== id));

    const handleAssetSubmit = async (e: React.FormEvent) => { 
        e.preventDefault(); 
        setGeneralError(null);
        const errors: Record<string, string> = {};
        setIsShaking(false);
        
        const glCode = assetForm.glCode;
        if (!glCode) errors.glCode = t('gl_code_required');
        else {
            const glCodeNum = parseInt(glCode, 10);
            if (glCode.length !== 5) {
                errors.glCode = t('gl_code_format');
            } else if (isNaN(glCodeNum) || glCodeNum < 10000 || glCodeNum > 19999) {
                errors.glCode = t('gl_code_asset_range');
            } else {
                const isDuplicate = 
                    assets.some(a => a.glCode === glCode) || 
                    liabilities.some(l => l.glCode === glCode) ||
                    chartOfAccounts.some(coa => coa.code === glCode);
                
                if (isDuplicate) {
                    errors.glCode = t('gl_code_duplicate');
                }
            }
        }

        if (!assetForm.name.trim()) errors.name = t('name_required');
        if (!assetForm.localName.trim()) errors.localName = t('local_name_required');
        if (!assetForm.type) errors.type = t('type_required');
        if (!assetForm.currency) errors.currency = t('currency_required');

        const cost = parseFloat(assetForm.cost.replace(/,/g, '')); 
        const val = parseFloat(assetForm.currentValue.replace(/,/g, '')); 
        
        if (assetForm.cost === '' || isNaN(cost) || cost < 0) errors.cost = t('cost_invalid');
        if (assetForm.currentValue === '' || isNaN(val) || val < 0) errors.currentValue = t('value_invalid');

        if (Object.keys(errors).length > 0) { 
            setAssetErrors(errors); 
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            return; 
        }

        setIsSubmitting(true);
        try {
            await new Promise(r => setTimeout(r, 600)); 
            addAsset({ 
                glCode: assetForm.glCode, 
                name: assetForm.name, 
                localName: assetForm.localName, 
                type: assetForm.type, 
                purchaseDate: assetForm.purchaseDate, 
                cost, 
                currentValue: val, 
                currency: assetForm.currency, 
                status: assetForm.status, 
                note: assetForm.note, 
                depreciationMethod: DepreciationMethod.NONE, 
                documents: pendingFiles 
            }); 
            setAddAssetOpen(false); 
            resetForms();
        } catch (err) {
            setGeneralError(t('save_error'));
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLiabSubmit = async (e: React.FormEvent) => { 
        e.preventDefault(); 
        setGeneralError(null);
        const errors: Record<string, string> = {};
        setIsShaking(false);
        
        const glCode = liabForm.glCode;
        if (!glCode) errors.glCode = t('gl_code_required');
        else {
            const glCodeNum = parseInt(glCode, 10);
            if (glCode.length !== 5) {
                errors.glCode = t('gl_code_format');
            } else if (isNaN(glCodeNum) || glCodeNum < 20000 || glCodeNum > 29999) {
                errors.glCode = t('gl_code_liability_range');
            } else {
                const isDuplicate = 
                    assets.some(a => a.glCode === glCode) || 
                    liabilities.some(l => l.glCode === glCode) ||
                    chartOfAccounts.some(coa => coa.code === glCode);
                
                if (isDuplicate) {
                    errors.glCode = t('gl_code_duplicate');
                }
            }
        }

        if (!liabForm.name.trim()) errors.name = t('name_required');
        if (!liabForm.localName.trim()) errors.localName = t('local_name_required');
        if (!liabForm.type) errors.type = t('type_required');
        if (!liabForm.currency) errors.currency = t('currency_required');
        
        const amt = parseFloat(liabForm.amount.replace(/,/g, '')); 
        const rem = parseFloat(liabForm.remaining.replace(/,/g, '')); 
        
        if (liabForm.amount === '' || isNaN(amt) || amt < 0) errors.amount = t('initial_amount_invalid');
        if (liabForm.remaining === '' || isNaN(rem) || rem < 0) errors.remaining = t('remaining_invalid');
        
        if (Object.keys(errors).length > 0) { 
            setLiabErrors(errors); 
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            return; 
        }
        
        setIsSubmitting(true);
        try {
            await new Promise(r => setTimeout(r, 600));
            addLiability({ 
                glCode: liabForm.glCode, 
                name: liabForm.name, 
                localName: liabForm.localName, 
                type: liabForm.type, 
                amount: amt, 
                remaining: rem, 
                currency: liabForm.currency, 
                interestRate: parseFloat(liabForm.interestRate) || 0, 
                monthlyPayment: parseFloat(liabForm.monthlyPayment.replace(/,/g, '')) || 0,
                startDate: liabForm.startDate, 
                endDate: liabForm.endDate || undefined, 
                status: liabForm.status, 
                note: liabForm.note, 
                documents: pendingFiles 
            }); 
            setAddLiabilityOpen(false); 
            resetForms();
        } catch (err) {
            setGeneralError(t('save_error'));
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateValueSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!viewingItem) return;
        setUpdateErrors({});
        setIsShaking(false);

        const amountVal = parseFloat(actionForm.amount.replace(/,/g, ''));
        if (actionForm.amount === '' || isNaN(amountVal)) {
            setUpdateErrors({ amount: t('amount_invalid') });
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            return;
        }

        setIsSubmitting(true);
        try {
            await new Promise(r => setTimeout(r, 600)); 
            if (viewingItem.type === 'asset') updateAssetValuation(viewingItem.id, amountVal, actionForm.date, actionForm.note);
            else updateLiabilityBalance(viewingItem.id, amountVal, actionForm.date, actionForm.note);
            setUpdateValueOpen(false);
            setViewingItem(null);
        } finally { setIsSubmitting(false); }
    };

    const handleSoldSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!viewingItem || viewingItem.type !== 'asset') return;
        const priceVal = parseFloat(soldForm.salePrice.replace(/,/g, ''));
        if (soldForm.salePrice === '' || isNaN(priceVal)) {
            setUpdateErrors({ salePrice: t('required_field') });
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            return;
        }
        setIsSubmitting(true);
        try {
            await new Promise(r => setTimeout(r, 600));
            markAssetAsSold(viewingItem.id, soldForm.saleDate, priceVal);
            setMarkAsSoldOpen(false);
            setViewingItem(null);
        } finally { setIsSubmitting(false); }
    };

    const handlePaidOffSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!viewingItem || viewingItem.type !== 'liability') return;
        setIsSubmitting(true);
        try {
            await new Promise(r => setTimeout(r, 600));
            markLiabilityAsPaidOff(viewingItem.id, paidOffForm.payoffDate);
            setMarkAsPaidOffOpen(false);
            setViewingItem(null);
        } finally { setIsSubmitting(false); }
    };

    const handleExportExcel = () => {
        try {
            if (activeTab === 'Assets') {
                const exportData = filteredAssets.map(a => ({
                    [t('asset_name')]: `${a.glCode}-${a.name}`,
                    [t('local_name')]: a.localName || '',
                    [t('type')]: a.type ? t(a.type.toLowerCase().replace(/-/g, '_').replace(/ /g, '_')) : '',
                    [t('description')]: a.note || '',
                    [t('purchase_date')]: formatDate(a.purchaseDate, settings.language),
                    [t('status')]: t(a.status.toLowerCase().replace(/ /g, '_')),
                    [t('purchase_cost')]: a.cost,
                    [t('current_value')]: a.currentValue,
                    [t('value_changed')]: a.currentValue - a.cost,
                }));

                const ws = XLSX.utils.json_to_sheet(exportData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Assets");
                XLSX.writeFile(wb, `Assets_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
            } else {
                const exportData = filteredLiabilities.map(l => ({
                    [t('liability_name')]: `${l.glCode}-${l.name}`,
                    [t('local_name')]: l.localName || '',
                    [t('type')]: l.type ? t(l.type.toLowerCase().replace(/-/g, '_').replace(/ /g, '_')) : '',
                    [t('description')]: l.note || '',
                    [t('start_date')]: formatDate(l.startDate, settings.language),
                    [t('status')]: t(l.status.toLowerCase().replace(/ /g, '_')),
                    [t('initial_loan')]: l.amount,
                    [t('remaining_balance')]: l.remaining,
                    [t('value_changed')]: l.remaining - l.amount,
                }));

                const ws = XLSX.utils.json_to_sheet(exportData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Liabilities");
                XLSX.writeFile(wb, `Liabilities_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
            }
        } catch (error) {
            console.error("Export failed:", error);
            setGeneralError(t('export_failed') || 'Export failed');
        }
    };

    const openDetailsModal = (id: string, type: 'asset' | 'liability') => { 
        setViewingItem({ id, type }); 
        setIsHistoryExpanded(false);
        setIsDocsExpanded(true);
        setIsDetailsOpen(true); 
    };

    const selectedAsset = viewingItem?.type === 'asset' ? assets.find(a => a.id === viewingItem.id) : null;
    const selectedLiability = viewingItem?.type === 'liability' ? liabilities.find(l => l.id === viewingItem.id) : null;
    const currentDocs = viewingItem?.type === 'asset' ? selectedAsset?.documents : selectedLiability?.documents;

    const itemToDeleteDetails = useMemo(() => {
        if (!deleteTarget) return null;
        return deleteTarget.type === 'asset' 
            ? assets.find(a => a.id === deleteTarget.id) 
            : liabilities.find(l => l.id === deleteTarget.id);
    }, [deleteTarget, assets, liabilities]);

    return (
        <div className={cn(CLASSES.container, "!px-2 md:!px-4 lg:!px-6 !space-y-4 pb-24")}>
            <div className="animate-in fade-in duration-500">
                {/* Mobile View: Combined Card */}
                <div className="md:hidden mb-4">
                    <div className={cn(CLASSES.card, "w-full p-4 bg-white dark:bg-dark-card border-gray-200 dark:border-dark-border shadow-sm rounded-xl")}>
                        <div className="flex flex-col gap-0.5 mb-3">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <Typography variant="caption" className="opacity-60 text-xs font-medium">
                                    {t('net_worth')}
                                </Typography>
                                <TooltipButton tooltip={t('net_worth_tooltip')} />
                            </div>
                            <Typography variant="h1" className="text-base font-semibold tabular-nums tracking-tight text-gray-900 dark:text-white">
                                {formatCurrency(netWorthVal, settings.defaultCurrency, settings.language)}
                            </Typography>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <div>
                                <Typography variant="caption" className="opacity-60 text-xs font-medium block mb-0.5">
                                    {t('total_assets')}
                                </Typography>
                                <Typography variant="h3" className="text-base font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(totalAssetsVal, settings.defaultCurrency, settings.language)}
                                </Typography>
                            </div>
                            <div>
                                <Typography variant="caption" className="opacity-60 text-xs font-medium block mb-0.5">
                                    {t('total_liabilities')}
                                </Typography>
                                <Typography variant="h3" className="text-base font-semibold tabular-nums text-red-600 dark:text-red-400">
                                    {formatCurrency(totalLiabsVal, settings.defaultCurrency, settings.language)}
                                </Typography>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tablet/Desktop View: 3-Column Grid */}
                <div className="hidden md:grid grid-cols-3 gap-4 mb-4">
                    <KPICard 
                        title={t('total_assets')} 
                        amount={totalAssetsVal} 
                        currency={settings.defaultCurrency} 
                        lang={settings.language} 
                        color="emerald" 
                    />
                    <KPICard 
                        title={t('total_liabilities')} 
                        amount={totalLiabsVal} 
                        currency={settings.defaultCurrency} 
                        lang={settings.language} 
                        color="red" 
                    />
                    <KPICard 
                        title={t('net_worth')} 
                        amount={netWorthVal} 
                        currency={settings.defaultCurrency} 
                        lang={settings.language} 
                        color="blue"
                        tooltip={t('net_worth_tooltip')}
                    />
                </div>
            </div>

            {/* View Selection Toggle - Rule: Rounded-xl for flex container/buttons */}
            <div className="flex justify-start">
                <div className="flex w-full md:w-auto p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-800 relative">
                    {(['Assets', 'Liabilities'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 md:min-w-[100px]",
                                activeTab === tab 
                                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5" 
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            )}
                        >
                            {t(tab.toLowerCase())}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4 animate-in fade-in duration-500">
                {/* Rule: Rounded-xl for Action Row container */}
                <div className="flex flex-row justify-between items-center gap-3 bg-white dark:bg-dark-card p-3 rounded-xl md:rounded-xl border border-gray-200 dark:border-dark-border shadow-sm no-print">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        {/* Rule: Rounded-md for Inputs */}
                        <input className={cn(CLASSES.input, "pl-11 h-10 text-xs font-medium w-full rounded-md border-2 focus:ring-8 focus:ring-emerald-500/5 transition-all duration-300 focus:border-emerald-500")} placeholder={activeTab === 'Assets' ? t('search_assets') : t('search_liabilities')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleExportExcel}
                            className={cn(CLASSES.buttonSecondary, "h-10 w-10 p-0 flex items-center justify-center shadow-none rounded-xl")}
                            title={t('export')}
                        >
                            <Download size={18} />
                        </button>
                        {/* Rule: Rounded-xl for Buttons */}
                        <button 
                            onClick={() => { 
                                resetForms();
                                if (activeTab === 'Assets') setAddAssetOpen(true); 
                                else setAddLiabilityOpen(true); 
                            }} 
                            className={cn(CLASSES.buttonPrimary, "h-10 px-3 sm:px-5 shadow-none rounded-xl")}
                        >
                            <PlusCircle size={18} /> 
                            <span className="hidden sm:inline">{activeTab === 'Assets' ? t('add_asset') : t('add_liability')}</span>
                        </button>
                    </div>
                </div>

                {/* Rule: Rounded-lg for Tables */}
                <div className={cn(CLASSES.card, "flex flex-col border-gray-200 dark:border-dark-border overflow-hidden min-h-[500px] h-[60vh] rounded-lg md:rounded-lg")}>
                    <div className="flex-1 overflow-auto scrollbar-thin">
                        <table className="w-full text-left border-separate border-spacing-0 table-fixed min-w-[1500px]">
                            <thead className="sticky top-0 z-20">
                                <tr>
                                    <th className={cn(premiumTh, "w-64 pl-4")}>{activeTab === 'Assets' ? t('asset_name') : t('liability_name')}</th>
                                    <th className={cn(premiumTh, "w-56")}>{t('local_name')}</th>
                                    <th className={cn(premiumTh, "w-48 text-right")}>{activeTab === 'Assets' ? t('asset_type') : t('liability_type')}</th>
                                    <th className={cn(premiumTh, "w-64")}>{t('description')}</th>
                                    <th className={cn(premiumTh, "w-36")}>{activeTab === 'Assets' ? t('purchase_date') : t('start_date')}</th>
                                    <th className={cn(premiumTh, "w-28 text-center")}>{t('status')}</th>
                                    <th className={cn(premiumTh, "text-right w-40")}>{activeTab === 'Assets' ? t('purchase_cost') : t('initial_loan')}</th>
                                    <th className={cn(premiumTh, "text-right w-40")}>{activeTab === 'Assets' ? t('current_value') : t('remaining_balance')}</th>
                                    <th className={cn(premiumTh, "text-right w-40")}>{t('value_changed')}</th>
                                    <th className={cn(premiumTh, "w-12 text-center sticky right-0 shadow-[-4px_0_12px_rgba(0,0,0,0.03)] border-l bg-gray-50 dark:bg-gray-800 pr-4")}></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-transparent">
                                {activeTab === 'Assets' ? (
                                    filteredAssets.length > 0 ? (
                                        filteredAssets.map((a, i) => (
                                            <tr key={a.id} className={cn("hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10 transition-colors cursor-pointer group", i % 2 === 0 ? "bg-white dark:bg-[#161b22]" : "bg-gray-50/40 dark:bg-gray-800/20")} onClick={() => openDetailsModal(a.id, 'asset')}>
                                                <td className={cn(premiumTd, "truncate pl-4 font-medium")}>{a.glCode}-{a.name}</td>
                                                <td className={cn(premiumTd, "font-khmer text-gray-400 truncate")}>{a.localName}</td>
                                                <td className={cn(premiumTd, "truncate text-gray-500 text-right")}>{a.type ? t(a.type.toLowerCase().replace(/-/g, '_').replace(/ /g, '_')) : '—'}</td>
                                                <td className={premiumTd}><Typography variant="caption" className="truncate block max-w-[260px]">{a.note || '—'}</Typography></td>
                                                <td className={cn(premiumTd, "text-gray-400 tabular-nums")}>{formatDate(a.purchaseDate, settings.language)}</td>
                                                <td className={cn(premiumTd, "text-center")}>
                                                    {/* Rule: Rounded-lg for Badges */}
                                                    <span className={cn(
                                                        "px-2.5 py-0.5 text-[11px] rounded-lg border", 
                                                        a.status === 'Active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                                                        a.status === 'Sold' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                        "bg-gray-100 text-gray-500 border-gray-200"
                                                    )}>{t(a.status.toLowerCase().replace(/ /g, '_')) || a.status}</span>
                                                </td>
                                                {/* Rule: Table Cell -> text-sm md:text-base font-medium */}
                                                <td className={cn(premiumTd, "text-right tabular-nums text-sm md:text-base font-medium", a.cost < 0 ? "text-red-600 dark:text-red-400" : "text-gray-400")}>{formatCurrency(a.cost, a.currency, settings.language)}</td>
                                                <td className={cn(premiumTd, "text-right tabular-nums text-sm md:text-base font-medium", a.currentValue < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>{formatCurrency(a.currentValue, a.currency, settings.language)}</td>
                                                <td className={cn(premiumTd, "text-right tabular-nums text-sm md:text-base font-medium", a.currentValue >= a.cost ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>{a.currentValue >= a.cost ? '+' : ''}{formatCurrency(a.currentValue - a.cost, a.currency, settings.language)}</td>
                                                <td className={cn(premiumTd, "text-center sticky right-0 bg-inherit border-l shadow-[-4px_0_12px_rgba(0,0,0,0.03)] pr-4")} onClick={e => e.stopPropagation()}>
                                                    <div className="flex justify-center"><AssetsMenu onView={() => openDetailsModal(a.id, 'asset')} onUpdate={() => { setViewingItem({id: a.id, type: 'asset'}); setActionForm({amount: a.currentValue.toLocaleString(), date: getPhnomPenhNowISO().split('T')[0], note: ''}); setUpdateValueOpen(true); }} onDelete={() => { setDeleteTarget({id: a.id, type:'asset', name: a.name}); setDeleteConfirmOpen(true); }} onMarkAsSold={a.status !== 'Sold' ? () => { setViewingItem({id: a.id, type: 'asset'}); setSoldForm({salePrice: a.currentValue.toLocaleString(), saleDate: getPhnomPenhNowISO().split('T')[0]}); setMarkAsSoldOpen(true); } : undefined} /></div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={10} className="py-24 text-center opacity-30 italic">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <History size={48} strokeWidth={1} className="text-gray-400" />
                                                    <Typography variant="caption" className="font-bold text-sm">{t('no_history')}</Typography>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                ) : (
                                    filteredLiabilities.length > 0 ? (
                                        filteredLiabilities.map((l, i) => (
                                            <tr key={l.id} className={cn("hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10 transition-colors cursor-pointer group", i % 2 === 0 ? "bg-white dark:bg-[#161b22]" : "bg-gray-50/40 dark:bg-gray-800/20")} onClick={() => openDetailsModal(l.id, 'liability')}>
                                                <td className={cn(premiumTd, "truncate pl-4 font-medium")}>{l.glCode}-{l.name}</td>
                                                <td className={cn(premiumTd, "font-khmer text-gray-400 truncate")}>{l.localName}</td>
                                                <td className={cn(premiumTd, "truncate text-gray-500 text-right")}>{l.type ? t(l.type.toLowerCase().replace(/-/g, '_').replace(/ /g, '_')) : '—'}</td>
                                                <td className={premiumTd}><Typography variant="caption" className="truncate block max-w-[260px]">{l.note || '—'}</Typography></td>
                                                <td className={cn(premiumTd, "text-gray-400 tabular-nums")}>{formatDate(l.startDate, settings.language)}</td>
                                                <td className={cn(premiumTd, "text-center")}>
                                                    {/* Rule: Rounded-lg for Badges */}
                                                    <span className={cn(
                                                        "px-2.5 py-0.5 text-[11px] rounded-lg border", 
                                                        l.status === 'Active' ? "bg-red-50 text-red-600 border-red-100" : 
                                                        l.status === 'Paid Off' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                        "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                    )}>{t(l.status.toLowerCase().replace(/ /g, '_')) || l.status}</span>
                                                </td>
                                                {/* Rule: Table Cell -> text-sm md:text-base font-medium */}
                                                <td className={cn(premiumTd, "text-right tabular-nums text-sm md:text-base font-medium", l.amount < 0 ? "text-red-600 dark:text-red-400" : "text-gray-400")}>{formatCurrency(l.amount, l.currency, settings.language)}</td>
                                                <td className={cn(premiumTd, "text-right tabular-nums text-sm md:text-base font-medium", l.remaining < 0 ? "text-red-600 dark:text-red-400" : "text-red-600 dark:text-red-400")}>{formatCurrency(l.remaining, l.currency, settings.language)}</td>
                                                <td className={cn(premiumTd, "text-right tabular-nums text-sm md:text-base font-medium", (l.amount - l.remaining) < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>{l.amount - l.remaining >= 0 ? '+' : ''}{formatCurrency(l.amount - l.remaining, l.currency, settings.language)}</td>
                                                <td className={cn(premiumTd, "text-center sticky right-0 bg-inherit border-l shadow-[-4px_0_12px_rgba(0,0,0,0.03)] pr-4")} onClick={e => e.stopPropagation()}>
                                                    <div className="flex justify-center"><AssetsMenu onView={() => openDetailsModal(l.id, 'liability')} onUpdate={() => { setViewingItem({id: l.id, type: 'liability'}); setActionForm({amount: l.remaining.toLocaleString(), date: getPhnomPenhNowISO().split('T')[0], note: ''}); setUpdateValueOpen(true); }} onDelete={() => { setDeleteTarget({id: l.id, type:'liability', name: l.name}); setDeleteConfirmOpen(true); }} onMarkAsPaidOff={l.status !== 'Paid Off' ? () => { setViewingItem({id: l.id, type: 'liability'}); setPaidOffForm({payoffDate: getPhnomPenhNowISO().split('T')[0]}); setMarkAsPaidOffOpen(true); } : undefined} /></div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={10} className="py-24 text-center opacity-30 italic">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <History size={48} strokeWidth={1} className="text-gray-400" />
                                                    <Typography variant="caption" className="font-bold text-sm">{t('no_history')}</Typography>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Asset/Liability Form Modal */}
            {(isAddAssetOpen || isAddLiabilityOpen) && (
                <div className={cn(CLASSES.modalOverlay, "sm:p-4 p-0")}>
                    <div 
                        style={{ height: window.innerWidth < 640 ? `${visualViewportHeight}px` : undefined }}
                        // Rule: Rounded-xl for Modals
                        className={cn(CLASSES.modalContent, "max-w-xl sm:h-auto sm:max-h-[90dvh] rounded-none sm:rounded-xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 relative overflow-hidden flex flex-col", isShaking && "animate-shake")}
                    >
                        <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-4 md:px-5 shrink-0")}>
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-1.5 rounded-xl border",
                                    isAddAssetOpen ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                                )}>
                                    {isAddAssetOpen ? <Landmark size={18} /> : <Activity size={18} />}
                                </div>
                                <Typography variant="h2" className="text-base md:text-lg">{isAddAssetOpen ? t('add_asset') : t('add_liability')}</Typography>
                            </div>
                            <button onClick={() => { setAddAssetOpen(false); setAddLiabilityOpen(false); }} className={CLASSES.buttonGhost}><X size={20}/></button>
                        </div>
                        <form onSubmit={isAddAssetOpen ? handleAssetSubmit : handleLiabSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className={cn(CLASSES.modalBody, "p-4 md:p-5 space-y-5 md:space-y-4 flex-1 overflow-y-auto")}>
                                {generalError && (
                                    <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-center gap-2 mb-4 animate-in slide-in-from-top-2">
                                        <AlertTriangle size={16} />
                                        <Typography variant="caption" className="font-bold">{generalError}</Typography>
                                    </div>
                                )}
                                <div className="space-y-5 md:space-y-4">
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <div className="space-y-1">
                                            <Typography variant="label">{t('gl_code')}</Typography>
                                            {/* Rule: Rounded-md for Inputs */}
                                            <input 
                                                required 
                                                inputMode="numeric"
                                                className={cn(CLASSES.input, "h-11 md:h-10 rounded-md border-2 focus:ring-8 focus:ring-emerald-500/5 transition-all duration-300 focus:border-emerald-500", (isAddAssetOpen ? assetErrors.glCode : liabErrors.glCode) && CLASSES.inputError)} 
                                                value={isAddAssetOpen ? assetForm.glCode : liabForm.glCode} 
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    if (isAddAssetOpen) {
                                                        setAssetForm({...assetForm, glCode: val});
                                                        if (assetErrors.glCode) setAssetErrors({...assetErrors, glCode: ''});
                                                    } else {
                                                        setLiabForm({...liabForm, glCode: val});
                                                        if (liabErrors.glCode) setLiabErrors({...liabErrors, glCode: ''});
                                                    }
                                                }} 
                                                maxLength={5} 
                                                placeholder={isAddAssetOpen ? t('gl_code_placeholder_asset') : t('gl_code_placeholder_liability')}
                                            />
                                            {(isAddAssetOpen ? assetErrors.glCode : liabErrors.glCode) && (
                                                <Typography variant="caption" className="text-red-500 font-bold px-1 block mt-0.5 animate-in fade-in slide-in-from-top-1">
                                                    {isAddAssetOpen ? assetErrors.glCode : liabErrors.glCode}
                                                </Typography>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <Typography variant="label">{t('choose_type_label')}</Typography>
                                            <div className="relative group">
                                                {/* Rule: Rounded-md for Selects */}
                                                <select 
                                                    required
                                                    className={cn(CLASSES.select, "h-11 md:h-10 rounded-md border-2 pr-10 focus:ring-8 focus:ring-emerald-500/5 transition-all duration-300 focus:border-emerald-500", (isAddAssetOpen ? assetErrors.type : liabErrors.type) && CLASSES.inputError)} 
                                                    value={isAddAssetOpen ? assetForm.type : liabForm.type} 
                                                    onChange={e => {
                                                        const val = e.target.value as any;
                                                        if (isAddAssetOpen) {
                                                            setAssetForm({...assetForm, type: val});
                                                            if (assetErrors.type) setAssetErrors({...assetErrors, type: ''});
                                                        } else {
                                                            setLiabForm({...liabForm, type: val});
                                                            if (liabErrors.type) setLiabErrors({...liabErrors, type: ''});
                                                        }
                                                    }}
                                                >
                                                    <option value="" disabled>{t('choose_type')}</option>
                                                    {Object.values(isAddAssetOpen ? AssetType : LiabilityType).map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-emerald-500 transition-colors" />
                                            </div>
                                            {(isAddAssetOpen ? assetErrors.type : liabErrors.type) && (
                                                <Typography variant="caption" className="text-red-500 font-bold px-1 block mt-0.5 animate-in fade-in slide-in-from-top-1">
                                                    {isAddAssetOpen ? assetErrors.type : liabErrors.type}
                                                </Typography>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Typography variant="label">{t('name')}</Typography>
                                        <input 
                                            required 
                                            className={cn(CLASSES.input, "h-11 md:h-10 rounded-md border-2", (isAddAssetOpen ? assetErrors.name : liabErrors.name) && CLASSES.inputError)} 
                                            value={isAddAssetOpen ? assetForm.name : liabForm.name} 
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (isAddAssetOpen) {
                                                    setAssetForm({...assetForm, name: val});
                                                    if (assetErrors.name) setAssetErrors({...assetErrors, name: ''});
                                                } else {
                                                    setLiabForm({...liabForm, name: val});
                                                    if (liabErrors.name) setLiabErrors({...liabErrors, name: ''});
                                                }
                                            }} 
                                            placeholder={isAddAssetOpen ? t('name_placeholder_asset') : t('name_placeholder_liability')}
                                        />
                                        {(isAddAssetOpen ? assetErrors.name : liabErrors.name) && (
                                            <Typography variant="caption" className="text-red-500 font-bold px-1 block mt-0.5 animate-in fade-in slide-in-from-top-1">
                                                {isAddAssetOpen ? assetErrors.name : liabErrors.name}
                                            </Typography>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Typography variant="label">{t('local_name')}</Typography>
                                        <input 
                                            required 
                                            className={cn(CLASSES.input, "h-11 md:h-10 rounded-md border-2", (isAddAssetOpen ? assetErrors.localName : liabErrors.localName) && CLASSES.inputError)} 
                                            value={isAddAssetOpen ? assetForm.localName : liabForm.localName} 
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (isAddAssetOpen) {
                                                    setAssetForm({...assetForm, localName: val});
                                                    if (assetErrors.localName) setAssetErrors({...assetErrors, localName: ''});
                                                } else {
                                                    setLiabForm({...liabForm, localName: val});
                                                    if (liabErrors.localName) setLiabErrors({...liabErrors, localName: ''});
                                                }
                                            }} 
                                            placeholder={isAddAssetOpen ? t('local_name_placeholder_asset') : t('local_name_placeholder_liability')}
                                        />
                                        {(isAddAssetOpen ? assetErrors.localName : liabErrors.localName) && (
                                            <Typography variant="caption" className="text-red-500 font-bold px-1 block mt-0.5 animate-in fade-in slide-in-from-top-1">
                                                {isAddAssetOpen ? assetErrors.localName : liabErrors.localName}
                                            </Typography>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        {/* Rule: Form Input -> text-base font-semibold */}
                                        <NumericInput 
                                            label={isAddAssetOpen ? t('purchase_cost') : t('initial_loan')} 
                                            value={isAddAssetOpen ? assetForm.cost : liabForm.amount} 
                                            onChange={v => {
                                                if (isAddAssetOpen) {
                                                    setAssetForm({...assetForm, cost: v});
                                                    if (assetErrors.cost) setAssetErrors({...assetErrors, cost: ''});
                                                } else {
                                                    setLiabForm({...liabForm, amount: v});
                                                    if (liabErrors.amount) setLiabErrors({...liabErrors, amount: ''});
                                                }
                                            }} 
                                            error={isAddAssetOpen ? assetErrors.cost : liabErrors.amount}
                                            inputClassName="h-11 md:h-10 rounded-md border-2 text-base font-semibold" 
                                            placeholder={t('amount_placeholder')}
                                        />
                                        <NumericInput 
                                            label={isAddAssetOpen ? t('current_value') : t('remaining_balance')} 
                                            value={isAddAssetOpen ? assetForm.currentValue : liabForm.remaining} 
                                            onChange={v => {
                                                if (isAddAssetOpen) {
                                                    setAssetForm({...assetForm, currentValue: v});
                                                    if (assetErrors.currentValue) setAssetErrors({...assetErrors, currentValue: ''});
                                                } else {
                                                    setLiabForm({...liabForm, remaining: v});
                                                    if (liabErrors.remaining) setLiabErrors({...liabErrors, remaining: ''});
                                                }
                                            }} 
                                            error={isAddAssetOpen ? assetErrors.currentValue : liabErrors.remaining}
                                            inputClassName="h-11 md:h-10 rounded-md border-2 text-base font-semibold" 
                                            placeholder={t('amount_placeholder')}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <CustomDatePicker 
                                            label={isAddAssetOpen ? t('purchase_date') : t('start_date')} 
                                            value={isAddAssetOpen ? assetForm.purchaseDate : liabForm.startDate} 
                                            onChange={v => isAddAssetOpen ? setAssetForm({...assetForm, purchaseDate: v}) : setLiabForm({...liabForm, startDate: v})} 
                                            inputClassName="h-11 md:h-10 rounded-md border-2" 
                                        />
                                        <div className="space-y-1">
                                            <Typography variant="label">{t('currency')}</Typography>
                                            <div className="relative group">
                                                <select 
                                                    className={cn(CLASSES.select, "h-11 md:h-10 rounded-md border-2 font-bold pr-10 focus:ring-8 focus:ring-emerald-500/5 transition-all duration-300 focus:border-emerald-500", ((isAddAssetOpen && assetErrors.currency) || (isAddLiabilityOpen && liabErrors.currency)) && CLASSES.inputError)} 
                                                    value={isAddAssetOpen ? assetForm.currency : liabForm.currency}
                                                    onChange={e => {
                                                        if (isAddAssetOpen) {
                                                            setAssetForm({...assetForm, currency: e.target.value as Currency});
                                                            if (assetErrors.currency) setAssetErrors({...assetErrors, currency: ''});
                                                        } else {
                                                            setLiabForm({...liabForm, currency: e.target.value as Currency});
                                                            if (liabErrors.currency) setLiabErrors({...liabErrors, currency: ''});
                                                        }
                                                    }}
                                                >
                                                    <option value="" disabled>{t('select_currency')}</option>
                                                    {[Currency.USD, Currency.KHR].map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-emerald-500 transition-colors" />
                                            </div>
                                            {((isAddAssetOpen && assetErrors.currency) || (isAddLiabilityOpen && liabErrors.currency)) && <Typography variant="caption" className="text-red-500 font-bold px-1 block mt-0.5">{isAddAssetOpen ? assetErrors.currency : liabErrors.currency}</Typography>}
                                        </div>
                                    </div>

                                    {isAddLiabilityOpen && (
                                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                                            <NumericInput 
                                                label={t('interest_rate')} 
                                                value={liabForm.interestRate} 
                                                onChange={v => setLiabForm({...liabForm, interestRate: v})} 
                                                inputClassName="h-11 md:h-10 rounded-md border-2" 
                                                placeholder={t('interest_rate_placeholder')}
                                            />
                                            <NumericInput 
                                                label={t('monthly_payment')} 
                                                value={liabForm.monthlyPayment} 
                                                onChange={v => setLiabForm({...liabForm, monthlyPayment: v})} 
                                                inputClassName="h-11 md:h-10 rounded-md border-2" 
                                                suffix={liabForm.currency as string}
                                                placeholder={t('amount_placeholder')}
                                            />
                                        </div>
                                    )}
                                    
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <Typography variant="label">{t('notes')}</Typography>
                                            <Typography variant="caption" className={cn((isAddAssetOpen ? assetForm.note.length : liabForm.note.length) >= 110 ? "text-orange-500" : "opacity-40")}>
                                                {(isAddAssetOpen ? assetForm.note.length : liabForm.note.length)} / 120
                                            </Typography>
                                        </div>
                                        {/* Rule: Rounded-md for Textarea */}
                                        <textarea 
                                            maxLength={120}
                                            className={cn(CLASSES.input, "h-16 py-2 resize-none rounded-md border-2 focus:ring-8 focus:ring-emerald-500/5 transition-all duration-300 focus:border-emerald-500 text-xs")} 
                                            value={isAddAssetOpen ? assetForm.note : liabForm.note} 
                                            onChange={e => isAddAssetOpen ? setAssetForm({...assetForm, note: e.target.value.slice(0, 120)}) : setLiabForm({...liabForm, note: e.target.value.slice(0, 120)})} 
                                            placeholder={t('audit_details')}
                                        />
                                    </div>

                                    <div className="space-y-2 pt-2 border-t border-gray-50 dark:border-gray-800">
                                        <div className="flex items-center justify-between">
                                            <Typography variant="label" className="flex items-center gap-1.5"><Paperclip size={12} className="text-emerald-500" /> {t('evidence')}</Typography>
                                            {pendingFiles.length > 0 && <Typography variant="caption" className="text-emerald-600 font-bold">{t('files_count', { count: pendingFiles.length })}</Typography>}
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2">
                                            {pendingFiles.map(f => (
                                                // Rule: Rounded-lg for list items
                                                <div key={f.id} className="group relative w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-transparent hover:border-emerald-500 transition-all flex items-center justify-center shadow-sm overflow-hidden" title={f.name}>
                                                    <FileIcon fileName={f.name} size={20} />
                                                    <button type="button" onClick={() => removePendingFile(f.id)} className="absolute top-0 right-0 p-1 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-lg"><X size={8}/></button>
                                                </div>
                                            ))}
                                            
                                            <button 
                                                type="button" 
                                                onClick={() => fileInputRef.current?.click()}
                                                onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
                                                // Rule: Rounded-lg for button-like list item
                                                className={cn("w-12 h-12 border-2 border-dashed rounded-lg flex items-center justify-center transition-all", dragActive ? "border-emerald-500 bg-emerald-50/20 shadow-inner" : "border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:bg-gray-50/50")}
                                            >
                                                <PlusCircle size={16} className="text-gray-400" />
                                                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf,.docx"/>
                                            </button>
                                        </div>
                                        {fileError && <Typography variant="caption" className="text-red-500 font-bold animate-pulse">{fileError}</Typography>}
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
                                <button type="button" onClick={() => { setAddAssetOpen(false); setAddLiabilityOpen(false); }} className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-10 border-2 rounded-xl")}>{t('cancel')}</button>
                                <button type="submit" className={cn(CLASSES.buttonPrimary, "flex-1 h-11 md:h-10 rounded-xl")}>
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : t('save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {isDetailsOpen && viewingItem && (
                <div className={CLASSES.modalOverlay}>
                    {/* Rule: Rounded-xl for Modal Container */}
                    <div className={cn(CLASSES.modalContent, "max-w-2xl animate-in zoom-in-95 duration-300 rounded-xl")}>
                        <div className={cn(CLASSES.modalHeader, "py-3 px-5 md:px-6 shrink-0")}>
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-1.5 rounded-xl border",
                                    viewingItem.type === 'asset' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                                )}>
                                    {viewingItem.type === 'asset' ? <Landmark size={18} /> : <Activity size={18} />}
                                </div>
                                <div className="min-w-0">
                                    <Typography variant="h2" className="text-base md:text-lg truncate">{viewingItem.type === 'asset' ? selectedAsset?.name : selectedLiability?.name}</Typography>
                                    <Typography variant="caption" className="block mt-0.5 font-medium opacity-60">{viewingItem.type === 'asset' ? selectedAsset?.glCode : selectedLiability?.glCode} • {viewingItem.type === 'asset' ? (selectedAsset?.type ? t(selectedAsset.type.toLowerCase().replace(/-/g, '_').replace(/ /g, '_')) : '') : (selectedLiability?.type ? t(selectedLiability.type.toLowerCase().replace(/-/g, '_').replace(/ /g, '_')) : '')}</Typography>
                                </div>
                            </div>
                            <button onClick={() => setIsDetailsOpen(false)} className={CLASSES.buttonGhost}><X size={20} /></button>
                        </div>
                        <div className={cn(CLASSES.modalBody, "p-4 md:p-6 space-y-6")}>
                             {/* Summary Card */}
                             <div className={cn("w-full text-center py-5 rounded-2xl shadow-sm border", viewingItem.type === 'asset' ? "bg-emerald-50/30 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30" : "bg-red-50/30 border-red-100 dark:bg-red-900/10 dark:border-red-900/30")}>
                                <Typography variant="label" className="text-gray-500 dark:text-gray-400 block mb-1">
                                    {viewingItem.type === 'asset' ? t('market_value') : t('outstanding_balance')}
                                </Typography>
                                <Typography variant="h1" className={cn("text-2xl md:text-3xl tabular-nums font-bold tracking-tight", 
                                    (viewingItem.type === 'asset' ? (selectedAsset?.currentValue || 0) : (selectedLiability?.remaining || 0)) < 0 
                                    ? "text-red-600 dark:text-red-400" 
                                    : (viewingItem.type === 'asset' ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"))
                                }>
                                    {viewingItem.type === 'asset' ? formatCurrency(selectedAsset?.currentValue || 0, selectedAsset?.currency || 'USD', settings.language) : formatCurrency(selectedLiability?.remaining || 0, selectedLiability?.currency || 'USD', settings.language)}
                                </Typography>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {viewingItem.type === 'asset' && selectedAsset ? (
                                    <>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                                            <Typography variant="caption" className="text-gray-500 dark:text-gray-400 block mb-1">{t('purchase_date')}</Typography>
                                            <Typography variant="body" className="font-semibold">{formatDate(selectedAsset.purchaseDate, settings.language)}</Typography>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                                            <Typography variant="caption" className="text-gray-500 dark:text-gray-400 block mb-1">{t('purchase_cost')}</Typography>
                                            <Typography variant="body" className="font-semibold">{formatCurrency(selectedAsset.cost, selectedAsset.currency, settings.language)}</Typography>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                                            <Typography variant="caption" className="text-gray-500 dark:text-gray-400 block mb-1">{t('value_changed')}</Typography>
                                            <Typography variant="body" className={cn("font-semibold", selectedAsset.currentValue >= selectedAsset.cost ? "text-emerald-600" : "text-red-600")}>
                                                {selectedAsset.currentValue >= selectedAsset.cost ? '+' : ''}{formatCurrency(selectedAsset.currentValue - selectedAsset.cost, selectedAsset.currency, settings.language)}
                                            </Typography>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                                            <Typography variant="caption" className="text-gray-500 dark:text-gray-400 block mb-1">{t('status')}</Typography>
                                            <span className={cn(
                                                "px-2 py-0.5 text-[11px] rounded-lg border font-bold", 
                                                selectedAsset.status === 'Active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                                                selectedAsset.status === 'Sold' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                "bg-gray-100 text-gray-500 border-gray-200"
                                            )}>
                                                {t(selectedAsset.status.toLowerCase().replace(/ /g, '_'))}
                                            </span>
                                        </div>
                                        {selectedAsset.status === 'Sold' && selectedAsset.saleDate && selectedAsset.salePrice !== undefined && (
                                            <>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                                                    <Typography variant="caption" className="text-gray-500 dark:text-gray-400 block mb-1">{t('sale_date')}</Typography>
                                                    <Typography variant="body" className="font-semibold">{formatDate(selectedAsset.saleDate, settings.language)}</Typography>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                                                    <Typography variant="caption" className="text-gray-500 dark:text-gray-400 block mb-1">{t('sale_price')}</Typography>
                                                    <Typography variant="body" className="font-semibold">{formatCurrency(selectedAsset.salePrice, selectedAsset.currency, settings.language)}</Typography>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                                                    <Typography variant="caption" className="text-gray-500 dark:text-gray-400 block mb-1">{t('gain_loss')}</Typography>
                                                    <Typography variant="body" className={cn("font-semibold", selectedAsset.salePrice >= selectedAsset.currentValue ? "text-emerald-600" : "text-red-600")}>
                                                        {selectedAsset.salePrice >= selectedAsset.currentValue ? '+' : ''}{formatCurrency(selectedAsset.salePrice - selectedAsset.currentValue, selectedAsset.currency, settings.language)}
                                                    </Typography>
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : selectedLiability ? (
                                    <>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                                            <Typography variant="caption" className="text-gray-500 dark:text-gray-400 block mb-1">{t('start_date')}</Typography>
                                            <Typography variant="body" className="font-semibold">{formatDate(selectedLiability.startDate, settings.language)}</Typography>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                                            <Typography variant="caption" className="text-gray-500 dark:text-gray-400 block mb-1">{t('initial_loan')}</Typography>
                                            <Typography variant="body" className="font-semibold">{formatCurrency(selectedLiability.amount, selectedLiability.currency, settings.language)}</Typography>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                                            <Typography variant="caption" className="text-gray-500 dark:text-gray-400 block mb-1">{t('interest_rate')}</Typography>
                                            <Typography variant="body" className="font-semibold">{selectedLiability.interestRate}%</Typography>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                                            <Typography variant="caption" className="text-gray-500 dark:text-gray-400 block mb-1">{t('monthly_payment')}</Typography>
                                            <Typography variant="body" className="font-semibold">{formatCurrency(selectedLiability.monthlyPayment || 0, selectedLiability.currency, settings.language)}</Typography>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                                            <Typography variant="caption" className="text-gray-500 dark:text-gray-400 block mb-1">{t('status')}</Typography>
                                            <span className={cn(
                                                "px-2 py-0.5 text-[11px] rounded-lg border font-bold", 
                                                selectedLiability.status === 'Active' ? "bg-red-50 text-red-600 border-red-100" : 
                                                "bg-emerald-50 text-emerald-600 border-emerald-100"
                                            )}>
                                                {t(selectedLiability.status.toLowerCase().replace(/ /g, '_'))}
                                            </span>
                                        </div>
                                        {selectedLiability.status === 'Paid Off' && selectedLiability.payoffDate && (
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                                                <Typography variant="caption" className="text-gray-500 dark:text-gray-400 block mb-1">{t('payoff_date')}</Typography>
                                                <Typography variant="body" className="font-semibold">{formatDate(selectedLiability.payoffDate, settings.language)}</Typography>
                                            </div>
                                        )}
                                    </>
                                ) : null}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Typography variant="label" className="flex items-center gap-1.5 px-1"><FileText size={12} className="text-emerald-600" /> {t('notes')}</Typography>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl italic border border-gray-100 dark:border-gray-800 shadow-inner min-h-[60px]">
                                        <Typography variant="body" className="opacity-80">
                                            {viewingItem.type === 'asset' ? selectedAsset?.note || t('no_internal_docs') : selectedLiability?.note || t('no_internal_docs')}
                                        </Typography>
                                    </div>
                                </div>

                                <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                                    <button onClick={() => setIsDocsExpanded(!isDocsExpanded)} className="w-full flex items-center justify-between py-2.5 px-4 bg-gray-50/50 dark:bg-gray-800/40 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-2.5"><Paperclip size={16} className="text-emerald-600" /><Typography variant="body" className="font-bold">{t('documents')}</Typography></div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold">{currentDocs?.length || 0}</span>
                                            <ChevronDown size={16} className={cn("text-gray-400 transition-transform", isDocsExpanded && "rotate-180")} />
                                        </div>
                                    </button>
                                    {isDocsExpanded && (
                                        <div className="p-4 bg-white dark:bg-dark-card border-t border-gray-100 dark:border-gray-800">
                                            <div className="flex flex-wrap gap-3">
                                                {currentDocs?.map(doc => (
                                                    <button key={doc.id} onClick={() => setPreviewDoc(doc)} className="w-12 h-12 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all shadow-sm active:scale-95" title={doc.name}>
                                                        <FileIcon fileName={doc.name} size={22} />
                                                    </button>
                                                ))}
                                                {(!currentDocs || currentDocs.length === 0) && (
                                                    <div className="w-full py-6 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                                                        <Typography variant="caption" className="opacity-30 italic font-bold">{t('no_attachments')}</Typography>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                                    <button onClick={() => setIsHistoryExpanded(!isHistoryExpanded)} className="w-full flex items-center justify-between py-2.5 px-4 bg-gray-50/50 dark:bg-gray-800/40 hover:bg-gray-50 transition-colors"><div className="flex items-center gap-2.5"><History size={16} className="text-emerald-600" /><Typography variant="body" className="font-bold">{t('registry_log')}</Typography></div><ChevronDown size={16} className={cn("text-gray-400 transition-transform", isHistoryExpanded && "rotate-180")} /></button>
                                    {isHistoryExpanded && (<div className="p-3 space-y-1 max-h-[180px] overflow-y-auto scrollbar-thin border-t border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-dark-card/50">{(viewingItem.type === 'asset' ? selectedAsset?.valuationHistory : selectedLiability?.balanceHistory)?.length ? (viewingItem.type === 'asset' ? selectedAsset?.valuationHistory : selectedLiability?.balanceHistory)?.map(h => (<div key={h.id} className="flex justify-between items-center py-2 px-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors border border-transparent hover:border-gray-100"><div className="min-w-0"><Typography variant="caption" className="block font-bold">{formatDate(h.date, settings.language)}</Typography>{h.note && <Typography variant="caption" className="italic truncate block max-w-[200px]">{h.note}</Typography>}</div>
                                    <Typography variant="body" className={cn("tabular-nums shrink-0 ml-4 text-xs md:text-sm font-medium", (viewingItem.type === 'asset' ? (h as any).value : (h as any).balance) < 0 ? "text-red-600 dark:text-red-400" : "")}>{viewingItem.type === 'asset' ? formatCurrency((h as any).value, selectedAsset?.currency || 'USD', settings.language) : formatCurrency((h as any).balance, selectedLiability?.currency || 'USD', settings.language)}</Typography></div>)) : (<div className="py-6 text-center italic opacity-50"><Typography variant="caption">{t('no_activity_log')}</Typography></div>)}</div>)}
                                </div>
                            </div>
                        </div>
                        <div className={cn(CLASSES.modalFooter, "py-3 px-6 shrink-0")}><button onClick={() => setIsDetailsOpen(false)} className={cn(CLASSES.buttonPrimary, "w-full h-11 md:h-10 shadow-lg shadow-emerald-600/10 rounded-xl")}>{t('dismiss')}</button></div>
                    </div>
                </div>
            )}

            {/* Valuation/Update Modal */}
            {isUpdateValueOpen && viewingItem && (
                <div className={cn(CLASSES.modalOverlay, "sm:p-4 p-0")}>
                    <div 
                        style={{ height: window.innerWidth < 640 ? `${visualViewportHeight}px` : undefined }}
                        // Rule: Rounded-xl for Modal Container
                        className={cn(CLASSES.modalContent, "max-w-md sm:h-auto sm:max-h-[90dvh] rounded-none sm:rounded-xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 relative overflow-hidden flex flex-col", isShaking && "animate-shake")}
                    >
                        <div className={cn(CLASSES.modalHeader, "py-2 px-4 md:px-5 shrink-0")}>
                            <div className="flex items-center gap-3">
                                <Typography variant="h3" className="normal-case font-black text-base">{viewingItem.type === 'asset' ? t('revalue_asset') : t('adjust_balance')}</Typography>
                            </div>
                            <button onClick={() => setUpdateValueOpen(false)} className={CLASSES.buttonGhost} disabled={isSubmitting}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleUpdateValueSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className={cn(CLASSES.modalBody, "p-4 md:p-5 space-y-5 md:space-y-4 flex-1 overflow-y-auto")}>
                                {/* Rule: Rounded-xl for Info Card */}
                                <div className="w-full p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 mb-2 shadow-inner text-center">
                                    <Typography variant="label" className="mb-1">{t('adjusting_record')}</Typography>
                                    <Typography variant="h2" className="normal-case tabular-nums truncate text-base font-black">{viewingItem.type === 'asset' ? selectedAsset?.name : selectedLiability?.name}</Typography>
                                </div>
                                {/* Rule: Form Input -> text-base font-semibold */}
                                <NumericInput 
                                    label={viewingItem.type === 'asset' ? t('current_value') : t('remaining_balance')} 
                                    disabled={isSubmitting} 
                                    value={actionForm.amount} 
                                    onChange={v => { setActionForm({...actionForm, amount: v}); if (updateErrors.amount) setUpdateErrors({}); }} 
                                    error={updateErrors.amount}
                                    inputClassName="h-11 md:h-10 rounded-md border-2 text-base font-semibold" 
                                />
                                <CustomDatePicker label={t('execution_date')} disabled={isSubmitting} value={actionForm.date} onChange={v => setActionForm({...actionForm, date: v})} inputClassName="h-11 md:h-10 rounded-md border-2" />
                                <div className="w-full space-y-1">
                                    <div className="flex justify-between items-center px-1">
                                        <Typography variant="label">{t('adjustment_note')}</Typography>
                                        <Typography variant="caption" className={cn(actionForm.note.length >= 110 ? "text-orange-500" : "opacity-40")}>
                                            {actionForm.note.length} / 120
                                        </Typography>
                                    </div>
                                    {/* Rule: Rounded-md for Textarea */}
                                    <textarea 
                                        maxLength={120}
                                        disabled={isSubmitting} 
                                        className={cn(CLASSES.input, "h-16 py-2 resize-none rounded-md border-2 text-xs focus:ring-8 focus:ring-emerald-500/5 transition-all duration-300 focus:border-emerald-500")} 
                                        value={actionForm.note} 
                                        onChange={e => setActionForm({...actionForm, note: e.target.value.slice(0, 120)})} 
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
                                {/* Rule: Rounded-xl for Buttons */}
                                <button type="button" disabled={isSubmitting} onClick={() => setUpdateValueOpen(false)} className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-10 border-2 rounded-xl")}>{t('cancel')}</button>
                                <button type="submit" disabled={isSubmitting} className={cn(CLASSES.buttonPrimary, "flex-1 h-11 md:h-10 rounded-xl")}>
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : t('apply')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Mark as Sold Modal */}
            {isMarkAsSoldOpen && viewingItem && viewingItem.type === 'asset' && (
                <div className={cn(CLASSES.modalOverlay, "sm:p-4 p-0")}>
                    <div 
                        style={{ height: window.innerWidth < 640 ? `${visualViewportHeight}px` : undefined }}
                        className={cn(CLASSES.modalContent, "max-w-md sm:h-auto sm:max-h-[90dvh] rounded-none sm:rounded-xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 relative overflow-hidden flex flex-col", isShaking && "animate-shake")}
                    >
                        <div className={cn(CLASSES.modalHeader, "py-2 px-4 md:px-5 shrink-0")}>
                            <div className="flex items-center gap-3">
                                <Typography variant="h3" className="normal-case font-black text-base">{t('mark_as_sold')}</Typography>
                            </div>
                            <button onClick={() => setMarkAsSoldOpen(false)} className={CLASSES.buttonGhost} disabled={isSubmitting}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSoldSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className={cn(CLASSES.modalBody, "p-4 md:p-5 space-y-5 md:space-y-4 flex-1 overflow-y-auto")}>
                                <div className="w-full p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 mb-2 shadow-inner text-center">
                                    <Typography variant="label" className="mb-1">{t('adjusting_record')}</Typography>
                                    <Typography variant="h2" className="normal-case tabular-nums truncate text-base font-black">{selectedAsset?.name}</Typography>
                                </div>
                                <NumericInput 
                                    label={t('sale_price')} 
                                    disabled={isSubmitting} 
                                    value={soldForm.salePrice} 
                                    onChange={v => { setSoldForm({...soldForm, salePrice: v}); if (updateErrors.salePrice) setUpdateErrors({}); }} 
                                    error={updateErrors.salePrice}
                                    inputClassName="h-11 md:h-10 rounded-md border-2 text-base font-semibold" 
                                />
                                <CustomDatePicker label={t('sale_date')} disabled={isSubmitting} value={soldForm.saleDate} onChange={v => setSoldForm({...soldForm, saleDate: v})} inputClassName="h-11 md:h-10 rounded-md border-2" />
                            </div>
                            <div className={cn(
                                "border-t border-gray-100 dark:border-gray-800 z-30 shrink-0",
                                "flex flex-row items-center gap-3 bg-white dark:bg-[#161b22]",
                                "transition-all duration-300 ease-in-out px-4 md:px-5",
                                isKeyboardOpen ? "py-2" : "py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
                            )}>
                                <button type="button" disabled={isSubmitting} onClick={() => setMarkAsSoldOpen(false)} className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-10 border-2 rounded-xl")}>{t('cancel')}</button>
                                <button type="submit" disabled={isSubmitting} className={cn(CLASSES.buttonPrimary, "flex-1 h-11 md:h-10 rounded-xl")}>
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : t('apply')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Mark as Paid Off Modal */}
            {isMarkAsPaidOffOpen && viewingItem && viewingItem.type === 'liability' && (
                <div className={cn(CLASSES.modalOverlay, "sm:p-4 p-0")}>
                    <div 
                        style={{ height: window.innerWidth < 640 ? `${visualViewportHeight}px` : undefined }}
                        className={cn(CLASSES.modalContent, "max-w-md sm:h-auto sm:max-h-[90dvh] rounded-none sm:rounded-xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 relative overflow-hidden flex flex-col", isShaking && "animate-shake")}
                    >
                        <div className={cn(CLASSES.modalHeader, "py-2 px-4 md:px-5 shrink-0")}>
                            <div className="flex items-center gap-3">
                                <Typography variant="h3" className="normal-case font-black text-base">{t('mark_as_paid_off')}</Typography>
                            </div>
                            <button onClick={() => setMarkAsPaidOffOpen(false)} className={CLASSES.buttonGhost} disabled={isSubmitting}><X size={18} /></button>
                        </div>
                        <form onSubmit={handlePaidOffSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className={cn(CLASSES.modalBody, "p-4 md:p-5 space-y-5 md:space-y-4 flex-1 overflow-y-auto")}>
                                <div className="w-full p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 mb-2 shadow-inner text-center">
                                    <Typography variant="label" className="mb-1">{t('adjusting_record')}</Typography>
                                    <Typography variant="h2" className="normal-case tabular-nums truncate text-base font-black">{selectedLiability?.name}</Typography>
                                </div>
                                <CustomDatePicker label={t('payoff_date')} disabled={isSubmitting} value={paidOffForm.payoffDate} onChange={v => setPaidOffForm({...paidOffForm, payoffDate: v})} inputClassName="h-11 md:h-10 rounded-md border-2" />
                            </div>
                            <div className={cn(
                                "border-t border-gray-100 dark:border-gray-800 z-30 shrink-0",
                                "flex flex-row items-center gap-3 bg-white dark:bg-[#161b22]",
                                "transition-all duration-300 ease-in-out px-4 md:px-5",
                                isKeyboardOpen ? "py-2" : "py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
                            )}>
                                <button type="button" disabled={isSubmitting} onClick={() => setMarkAsPaidOffOpen(false)} className={cn(CLASSES.buttonSecondary, "flex-1 h-11 md:h-10 border-2 rounded-xl")}>{t('cancel')}</button>
                                <button type="submit" disabled={isSubmitting} className={cn(CLASSES.buttonPrimary, "flex-1 h-11 md:h-10 rounded-xl")}>
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : t('apply')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Refined Delete Confirmation Modal */}
            {isDeleteConfirmOpen && itemToDeleteDetails && (
                <div className={CLASSES.modalOverlay}>
                    {/* Rule: Rounded-xl for Modal Container */}
                    <div className={cn(CLASSES.modalContent, "max-w-md rounded-xl")}>
                        <div className={cn(CLASSES.modalHeader, "py-2 md:py-2.5 px-5 md:px-6 shrink-0 justify-center")}>
                            <Typography variant="h2" className="text-base md:text-lg font-semibold">{t('confirm_removal')}</Typography>
                        </div>
                        <div className={cn(CLASSES.modalBody, "p-4 text-center space-y-4")}>
                            <Typography variant="body" className="font-medium text-gray-600 dark:text-gray-400 text-sm">
                                {t('delete_record_confirm')}
                            </Typography>
                            
                            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-dark-border space-y-1">
                                <Typography variant="body" className="font-bold text-base truncate text-gray-900 dark:text-white">
                                    {itemToDeleteDetails.name}
                                </Typography>
                                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                     <span className="uppercase tracking-wider font-semibold text-[10px]">{itemToDeleteDetails.type}</span>
                                     <span>•</span>
                                     <span className="font-mono font-medium">
                                        {deleteTarget?.type === 'asset' 
                                            ? formatCurrency((itemToDeleteDetails as Asset).currentValue, itemToDeleteDetails.currency, settings.language) 
                                            : formatCurrency((itemToDeleteDetails as Liability).remaining, itemToDeleteDetails.currency, settings.language)}
                                     </span>
                                </div>
                            </div>

                            <Typography variant="caption" className="text-red-500 font-semibold text-xs block">
                                {t('action_cannot_be_undone')}
                            </Typography>
                        </div>
                        <div className={cn(CLASSES.modalFooter, "flex-row items-center justify-between py-2.5 px-6 bg-gray-50 dark:bg-gray-800/20")}>
                            {/* Rule: Rounded-xl for Buttons */}
                            <button onClick={() => setDeleteConfirmOpen(false)} className={cn(CLASSES.buttonSecondary, "h-11 border-2 px-6 text-sm font-semibold rounded-xl flex-1 mr-3")}>{t('cancel')}</button>
                            <button onClick={() => { if (deleteTarget?.type === 'asset') deleteAsset(deleteTarget.id); else if (deleteTarget?.type === 'liability') deleteLiability(deleteTarget.id); setDeleteConfirmOpen(false); setDeleteTarget(null); }} className={cn(CLASSES.buttonDanger, "h-11 px-6 text-sm font-semibold rounded-xl flex-1")}>{t('confirm_delete')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Preview Portal */}
            {previewDoc && (
                <div className="fixed inset-0 z-[110] bg-gray-900/95 backdrop-blur-xl flex flex-col p-4 sm:p-8 animate-in fade-in duration-300">
                    <div className="w-full flex justify-between items-center mb-6 no-print">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="p-3 bg-white/10 rounded-2xl border border-white/10 text-white shadow-inner"><FileIcon fileName={previewDoc.name} size={24} /></div>
                            <div className="min-w-0">
                                <Typography variant="h3" className="text-white truncate font-black text-lg leading-tight">{previewDoc.name}</Typography>
                                <Typography variant="caption" className="text-white/40 font-bold block">{(previewDoc.size / 1024 / 1024).toFixed(2)} MB • {previewDoc.type}</Typography>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <a href={previewDoc.url} download={previewDoc.name} className="p-3 bg-white/10 hover:bg-emerald-600 transition-all rounded-2xl text-white shadow-lg active:scale-95"><Download size={20} /></a>
                            <button onClick={() => setPreviewDoc(null)} className="p-3 bg-white/10 hover:bg-red-600 transition-all rounded-2xl text-white shadow-lg active:scale-95"><X size={20} /></button>
                        </div>
                    </div>
                    <div className="flex-1 w-full bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden flex items-center justify-center relative group">
                        {previewDoc.type.startsWith('image/') ? (
                            <img src={previewDoc.url} alt={previewDoc.name} className="max-w-full max-h-full object-contain shadow-2xl rounded-xl animate-in zoom-in-95 duration-500" />
                        ) : (
                            <div className="flex flex-col items-center gap-6 text-white/50 p-12 text-center max-w-md">
                                <div className="w-32 h-32 bg-white/5 rounded-[3rem] flex items-center justify-center border border-white/5 shadow-inner"><FileText size={64} className="opacity-20" /></div>
                                <div className="space-y-2">
                                    <Typography variant="h2" className="text-white">{t('document_preview')}</Typography>
                                    <Typography variant="body" className="text-white/40 leading-relaxed font-medium">Standard browser security prevents inline viewing of certain file formats. Please download the file to view the contents.</Typography>
                                </div>
                                <a href={previewDoc.url} download={previewDoc.name} className={cn(CLASSES.buttonPrimary, "w-full h-14")}>{t('download_document')}</a>
                            </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex justify-center gap-6">
                                <Typography variant="caption" className="text-white font-bold flex items-center gap-2"><Check className="text-emerald-400" size={14}/> {t('verified_audit_link')}</Typography>
                                <Typography variant="caption" className="text-white font-bold flex items-center gap-2"><Clock className="text-blue-500" size={14}/> {t('secure_storage')}</Typography>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
