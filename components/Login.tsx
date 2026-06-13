import React, { useState } from 'react';
import { useApp } from '../store';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Lock, User, Eye, EyeOff, ShieldAlert, ArrowRight, Loader2, Sun, Moon, Monitor } from 'lucide-react';
import { cn, CLASSES } from '../utils';
import { Typography } from './Typography';

export const Login: React.FC = () => {
    const { login, t, settings, updateSettings } = useApp();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ userId?: string; password?: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isShaking, setIsShaking] = useState(false);

    const from = (location.state as any)?.from?.pathname || "/";

    const validateForm = () => {
        const errors: { userId?: string; password?: string } = {};
        if (!userId.trim()) errors.userId = 'Please enter your login ID.';
        if (!password.trim()) errors.password = 'Please enter your password.';
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
    };

    const toggleTheme = () => {
        const nextTheme = settings.theme === 'light' ? 'dark' : settings.theme === 'dark' ? 'system' : 'light';
        updateSettings({ theme: nextTheme });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        
        if (!validateForm()) {
            triggerShake();
            return;
        }

        setIsLoading(true);
        setIsShaking(false);
        
        try {
            // Simulated network delay for smoother transition
            await new Promise(resolve => setTimeout(resolve, 800));
            await login(userId.trim(), password);
            navigate(from, { replace: true });
        } catch (err: any) {
            setError(err.message || 'Access denied. Please check your credentials.');
            setIsLoading(false);
            triggerShake();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0d1117] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
            {/* Language Toggle - Login Exclusive */}
            <button 
                type="button"
                onClick={() => updateSettings({ language: settings.language === 'en' ? 'km' : 'en' })}
                className={cn(
                    "absolute top-8 left-8 px-4 py-3 text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-500 font-bold transition-all active:scale-90 z-[100] opacity-0 hover:opacity-100 focus:opacity-100",
                    settings.language === 'km' ? "font-khmer" : ""
                )}
                title={settings.language === 'en' ? 'ប្តូរទៅភាសាខ្មែរ' : 'Switch to English'}
            >
                {settings.language === 'en' ? t('khmer') : t('english')}
            </button>

            {/* Theme Toggle - Login Exclusive */}
            <button 
                type="button"
                onClick={toggleTheme}
                className="absolute top-8 right-8 p-3 rounded-2xl bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 shadow-xl shadow-black/5 text-gray-500 dark:text-gray-400 hover:text-emerald-500 transition-all active:scale-90 z-[100]"
                title={settings.theme === 'light' ? 'Switch to Dark Mode' : settings.theme === 'dark' ? 'Switch to System Mode' : 'Switch to Light Mode'}
            >
                {settings.theme === 'light' ? <Moon size={22} strokeWidth={2.5} /> : settings.theme === 'dark' ? <Monitor size={22} strokeWidth={2.5} /> : <Sun size={22} strokeWidth={2.5} />}
            </button>

            <div className={cn(
                "w-full max-w-md bg-white dark:bg-[#161b22] rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-800 p-8 md:p-12 space-y-8 transition-all duration-300",
                isShaking ? "animate-shake ring-2 ring-red-500/20" : "animate-in fade-in zoom-in-95"
            )}>
                <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-emerald-50 dark:ring-emerald-900/10 transition-transform hover:scale-105 duration-500">
                        <Heart size={48} fill="currentColor" className="opacity-90" />
                    </div>
                    <div className="space-y-1">
                        <Typography variant="h1" className="text-2xl md:text-3xl font-black tracking-wider">{t('login_welcome')}</Typography>
                        <Typography variant="caption" className="text-xs md:text-sm font-medium text-gray-400 block">{t('login_subtitle')}</Typography>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 p-4 rounded-2xl text-xs flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2">
                        <ShieldAlert size={20} className="shrink-0 mt-0.5" />
                        <span className="font-bold">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <Typography variant="label" className="text-xs md:text-sm font-medium text-gray-400">{t('user_id')}</Typography>
                            {fieldErrors.userId && <span className="text-[10px] font-medium text-red-500 animate-pulse">{fieldErrors.userId}</span>}
                        </div>
                        <div className="relative group transition-all duration-300">
                            <input 
                                type="text" 
                                required 
                                value={userId} 
                                onChange={(e) => {
                                    setUserId(e.target.value.toUpperCase());
                                    if (fieldErrors.userId) setFieldErrors(prev => ({ ...prev, userId: undefined }));
                                }} 
                                className={cn(
                                    CLASSES.input, 
                                    "pl-12 h-14 text-base font-medium rounded-2xl md:rounded-[1.5rem] border-2",
                                    "focus:ring-8 focus:ring-emerald-500/5 transition-all duration-300",
                                    fieldErrors.userId ? CLASSES.inputError : "focus:border-emerald-500"
                                )} 
                                placeholder="KHENGKIMSAN" 
                                disabled={isLoading} 
                                autoComplete="username"
                            />
                            <User className={cn(
                                "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300",
                                fieldErrors.userId ? "text-red-400" : "text-gray-400 group-focus-within:text-emerald-500"
                            )} size={20} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <Typography variant="label" className="text-xs md:text-sm font-medium text-gray-400">{t('password')}</Typography>
                            {fieldErrors.password && <span className="text-[10px] font-medium text-red-500 animate-pulse">{fieldErrors.password}</span>}
                        </div>
                        <div className="relative group transition-all duration-300">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                required 
                                value={password} 
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                                }} 
                                className={cn(
                                    CLASSES.input, 
                                    "pl-12 pr-12 h-14 text-base rounded-2xl md:rounded-[1.5rem] border-2",
                                    "focus:ring-8 focus:ring-emerald-500/5 transition-all duration-300",
                                    fieldErrors.password ? CLASSES.inputError : "focus:border-emerald-500"
                                )} 
                                placeholder="••••••••" 
                                disabled={isLoading} 
                                autoComplete="current-password"
                            />
                            <Lock className={cn(
                                "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300",
                                fieldErrors.password ? "text-red-400" : "text-gray-400 group-focus-within:text-emerald-500"
                            )} size={20} />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)} 
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all active:scale-90"
                                title={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className={cn(
                            CLASSES.buttonPrimary, 
                            "w-full h-16 text-sm font-black shadow-2xl shadow-emerald-600/30 transition-all rounded-2xl md:rounded-[1.5rem]",
                            isLoading && "opacity-80"
                        )}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-3">
                                <Loader2 size={20} className="animate-spin" />
                                <span>{t('authenticating')}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group">
                                <span>{t('sign_in')}</span>
                                <ArrowRight size={20} className="ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        )}
                    </button>
                </form>

                <div className="text-center pt-8 border-t border-gray-100 dark:border-gray-800 space-y-4">
                    <Typography variant="caption" className="font-bold text-gray-400 block opacity-40">
                        © {new Date().getFullYear()} MR.KHENG Kimsan.<br/>All rights reserved.
                    </Typography>
                </div>
            </div>
        </div>
    );
};