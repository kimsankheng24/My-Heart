
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store';
import { Typography } from './Typography';
import { cn, CLASSES } from '../utils';
import { 
    X, ChevronRight, ChevronLeft, Wallet, ArrowRightLeft, 
    PiggyBank, Target, CheckCircle2, Sparkles, Heart 
} from 'lucide-react';

interface TutorialProps {
    isOpen: boolean;
    onClose: () => void;
}

const steps = [
    {
        id: 'welcome',
        titleKey: 'tutorial_welcome_title',
        descKey: 'tutorial_welcome_desc',
        icon: Heart,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
        id: 'accounts',
        titleKey: 'tutorial_accounts_title',
        descKey: 'tutorial_accounts_desc',
        icon: Wallet,
        color: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
        id: 'transactions',
        titleKey: 'tutorial_transactions_title',
        descKey: 'tutorial_transactions_desc',
        icon: ArrowRightLeft,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
        id: 'budgets',
        titleKey: 'tutorial_budgets_title',
        descKey: 'tutorial_budgets_desc',
        icon: PiggyBank,
        color: 'text-purple-500',
        bg: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
        id: 'goals',
        titleKey: 'tutorial_goals_title',
        descKey: 'tutorial_goals_desc',
        icon: Target,
        color: 'text-rose-500',
        bg: 'bg-rose-50 dark:bg-rose-900/20'
    },
    {
        id: 'finish',
        titleKey: 'tutorial_finish_title',
        descKey: 'tutorial_finish_desc',
        icon: CheckCircle2,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20'
    }
];

export const Tutorial: React.FC<TutorialProps> = ({ isOpen, onClose }) => {
    const { t } = useApp();
    const [currentStep, setCurrentStep] = useState(0);

    if (!isOpen) return null;

    const step = steps[currentStep];
    const Icon = step.icon;
    const isLastStep = currentStep === steps.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            onClose();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        setCurrentStep(prev => Math.max(0, prev - 1));
    };

    return (
        <div className={cn(CLASSES.modalOverlay, "z-[100] p-4")}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={cn(CLASSES.modalContent, "max-w-md w-full overflow-hidden flex flex-col relative")}
            >
                <div className="absolute top-4 right-4 z-10">
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 flex flex-col items-center text-center space-y-6">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={step.id}
                            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                            transition={{ type: "spring", damping: 12 }}
                            className={cn("w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg", step.bg)}
                        >
                            <Icon size={40} className={step.color} />
                        </motion.div>
                    </AnimatePresence>

                    <div className="space-y-2">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step.id + 'title'}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <Typography variant="h2" className="text-2xl font-bold">
                                    {t(step.titleKey)}
                                </Typography>
                            </motion.div>
                        </AnimatePresence>
                        
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step.id + 'desc'}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Typography variant="body" className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {t(step.descKey)}
                                </Typography>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="flex gap-2 w-full pt-4">
                        {currentStep > 0 && (
                            <button 
                                onClick={handlePrev}
                                className={cn(CLASSES.buttonSecondary, "flex-1 py-3")}
                            >
                                <ChevronLeft size={18} className="mr-2" />
                                {t('back')}
                            </button>
                        )}
                        <button 
                            onClick={handleNext}
                            className={cn(CLASSES.buttonPrimary, "flex-1 py-3")}
                        >
                            {isLastStep ? t('finish_tutorial') : t('next')}
                            {!isLastStep && <ChevronRight size={18} className="ml-2" />}
                        </button>
                    </div>

                    <div className="flex gap-1.5">
                        {steps.map((_, idx) => (
                            <div 
                                key={idx}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-300",
                                    idx === currentStep ? "w-6 bg-emerald-500" : "w-1.5 bg-gray-200 dark:bg-gray-700"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
