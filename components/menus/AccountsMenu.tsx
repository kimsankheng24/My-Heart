
import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, Trash2, Scale, CheckCircle } from 'lucide-react';
import { useApp } from '../../store';

interface AccountsMenuProps {
    onEdit?: () => void;
    onAdjustBalance?: () => void;
    onDelete?: () => void;
    onSetDefault?: () => void;
    isDefault?: boolean;
}

export const AccountsMenu: React.FC<AccountsMenuProps> = ({ onEdit, onAdjustBalance, onDelete, onSetDefault, isDefault }) => {
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

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <MoreVertical size={18} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    {onEdit && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(); setIsOpen(false); }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                        >
                            <Edit2 size={14} className="text-emerald-500" /> {t('edit')}
                        </button>
                    )}
                    {onAdjustBalance && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onAdjustBalance(); setIsOpen(false); }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                        >
                            <Scale size={14} className="text-orange-500" /> {t('adjust_balance_action')}
                        </button>
                    )}
                    {onSetDefault && !isDefault && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onSetDefault(); setIsOpen(false); }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                        >
                            <CheckCircle size={14} className="text-blue-500" /> {t('set_as_default')}
                        </button>
                    )}
                    {onDelete && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(); setIsOpen(false); }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                            <Trash2 size={14} /> {t('delete')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
