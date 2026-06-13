
import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, Trash2, PauseCircle, PlayCircle, XCircle, Coins, Eye } from 'lucide-react';
import { cn } from '../../utils';
import { useApp } from '../../store';

interface GoalsMenuProps {
    onView?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onPause?: () => void;
    onResume?: () => void;
    onCancel?: () => void;
    onContribute?: () => void;
    isPaused?: boolean;
    isActive?: boolean;
}

export const GoalsMenu: React.FC<GoalsMenuProps> = ({ onView, onEdit, onDelete, onPause, onResume, onCancel, onContribute, isPaused, isActive }) => {
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
                className={cn(
                    "p-1.5 rounded-lg transition-all duration-200",
                    isOpen 
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" 
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
            >
                <MoreVertical size={16} strokeWidth={2.5} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5">
                    <div className="flex flex-col gap-0.5">
                        {onView && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onView(); setIsOpen(false); }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center gap-2.5 transition-colors"
                            >
                                <Eye size={14} className="text-gray-400 dark:text-gray-500" /> {t('view_details_action')}
                            </button>
                        )}
                        {isActive && onContribute && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onContribute(); setIsOpen(false); }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center gap-2.5 transition-colors"
                            >
                                <Coins size={14} className="text-blue-500" /> {t('contribute')}
                            </button>
                        )}

                        <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />

                        {onEdit && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(); setIsOpen(false); }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center gap-2.5 transition-colors"
                            >
                                <Edit2 size={14} className="text-emerald-500" /> {t('edit')}
                            </button>
                        )}
                        {isActive && onPause && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onPause(); setIsOpen(false); }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center gap-2.5 transition-colors"
                            >
                                <PauseCircle size={14} className="text-amber-500" /> {t('pause_goal')}
                            </button>
                        )}
                        {isPaused && onResume && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onResume(); setIsOpen(false); }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center gap-2.5 transition-colors"
                            >
                                <PlayCircle size={14} className="text-emerald-500" /> {t('resume_goal')}
                            </button>
                        )}
                        {(isActive || isPaused) && onCancel && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onCancel(); setIsOpen(false); }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center gap-2.5 transition-colors"
                            >
                                <XCircle size={14} className="text-gray-400" /> {t('cancel_goal')}
                            </button>
                        )}

                        {onDelete && (
                            <>
                                <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDelete(); setIsOpen(false); }}
                                    className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors"
                                >
                                    <Trash2 size={14} /> {t('delete')}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
