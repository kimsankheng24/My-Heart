import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Eye, Edit2, Trash2, Lock, Unlock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../store';

interface SettingsMenuProps {
    onView?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onLock?: () => void;
    onUnlock?: () => void;
    onDeny?: () => void;
    onActivate?: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
    onView,
    onEdit,
    onDelete,
    onLock,
    onUnlock,
    onDeny,
    onActivate
}) => {
    const { t } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const hasStatusActions = Boolean(onLock || onUnlock || onDeny || onActivate);

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <MoreHorizontal size={18} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    {onView && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onView(); setIsOpen(false); }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                        >
                            <Eye size={14} className="text-blue-500 shrink-0" />
                            <span>{t('view_details_action')}</span>
                        </button>
                    )}
                    {onEdit && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(); setIsOpen(false); }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                        >
                            <Edit2 size={14} className="text-emerald-500 shrink-0" />
                            <span>{t('edit')}</span>
                        </button>
                    )}

                    {hasStatusActions && (
                        <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                    )}

                    {onActivate && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onActivate(); setIsOpen(false); }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-2"
                        >
                            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                            <span>{t('activate_account')}</span>
                        </button>
                    )}

                    {onUnlock && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onUnlock(); setIsOpen(false); }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 flex items-center gap-2"
                        >
                            <Unlock size={14} className="text-blue-500 shrink-0" />
                            <span>{t('unlock_account')}</span>
                        </button>
                    )}

                    {onLock && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onLock(); setIsOpen(false); }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2"
                        >
                            <Lock size={14} className="text-amber-500 shrink-0" />
                            <span>{t('lock_account')}</span>
                        </button>
                    )}

                    {onDeny && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDeny(); setIsOpen(false); }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                        >
                            <ShieldAlert size={14} className="text-rose-500 shrink-0" />
                            <span>{t('deny_access')}</span>
                        </button>
                    )}

                    {onDelete && (
                        <>
                            <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(); setIsOpen(false); }}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                                <Trash2 size={14} className="shrink-0" />
                                <span>{t('delete')}</span>
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
