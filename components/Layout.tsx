
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../store';
import { 
  LayoutDashboard, CreditCard, Wallet, Target, PiggyBank, 
  BarChart3, Landmark, FileText, Settings, Menu, X, LogOut, ArrowRightLeft,
  Home, Sun, Moon, ChevronLeft, ChevronRight, ChevronDown, Globe, Monitor,
  HandCoins, CirclePlus, HelpCircle
} from 'lucide-react';
import { cn } from '../utils';
import { Typography } from './Typography';
import { Tutorial } from './Tutorial';

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280
};

const getMenuKey = (path: string) => {
    if (path === '/' || path === '') return 'dashboard';
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const mainSection = cleanPath.split('/')[0];
    return mainSection.toLowerCase();
};

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, logout, t, settings, updateSettings } = useApp();
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  
  useEffect(() => {
      const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
      if (!hasSeenTutorial) {
          setIsTutorialOpen(true);
          localStorage.setItem('hasSeenTutorial', 'true');
      }
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const fabMenuRef = useRef<HTMLDivElement>(null);

  const responsivePadding = "px-4 md:px-6 lg:px-8 xl:px-10";

  const effectiveExpanded = isSidebarPinned || isSidebarHovered;

  useEffect(() => {
      const handleResize = () => {
          if (window.innerWidth < BREAKPOINTS.lg) {
              setIsSidebarPinned(false);
          }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close FAB menu when clicking outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (fabMenuRef.current && !fabMenuRef.current.contains(event.target as Node)) {
              setIsFabOpen(false);
          }
      };
      if (isFabOpen) {
          document.addEventListener('mousedown', handleClickOutside);
      }
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFabOpen]);

  const toggleSidebar = () => setIsSidebarPinned(!isSidebarPinned);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleFabAction = (type: 'Income' | 'Expense' | 'Transfer') => {
      setIsFabOpen(false);
      if (type === 'Transfer') {
          navigate('/accounts', { state: { action: 'transfer' } });
      } else {
          navigate('/transactions', { state: { action: 'add', type } });
      }
  };

  const toggleTheme = () => {
      const nextTheme = settings.theme === 'light' ? 'dark' : settings.theme === 'dark' ? 'system' : 'light';
      updateSettings({ theme: nextTheme });
  };

  const menuItems = [
    { labelKey: 'dashboard', icon: LayoutDashboard, path: '/' },
    { labelKey: 'transactions', icon: ArrowRightLeft, path: '/transactions' },
    { labelKey: 'accounts', icon: Wallet, path: '/accounts' },
    { labelKey: 'goals', icon: Target, path: '/goals' },
    { labelKey: 'budget', icon: PiggyBank, path: '/budget' },
    { labelKey: 'analytics', icon: BarChart3, path: '/analytics' },
    { labelKey: 'assets', icon: HandCoins, path: '/assets' },
    { labelKey: 'reports', icon: FileText, path: '/reports' },
    { labelKey: 'settings', icon: Settings, path: '/settings' },
  ];

  const mobileNavItems = [
      { labelKey: 'home', icon: Home, path: '/' },
      { labelKey: 'transactions', icon: ArrowRightLeft, path: '/transactions' },
      { labelKey: 'quick_action', icon: CirclePlus, isFab: true },
      { labelKey: 'budget', icon: PiggyBank, path: '/budget' },
      { labelKey: 'account', icon: Wallet, path: '/accounts' },
  ];

  return (
    <div className={cn("w-full flex h-[100dvh] bg-[#f3f4f6] dark:bg-dark-bg text-gray-900 dark:text-gray-100 transition-colors duration-300 overflow-hidden font-sans")}>
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/60 z-[60] lg:hidden backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* FAB Overlay */}
      {isFabOpen && (
        <div className="fixed inset-0 bg-black/40 z-[58] lg:hidden backdrop-blur-sm animate-in fade-in duration-200" />
      )}

      <aside 
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={cn(
          "fixed inset-y-0 left-0 z-[70] bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border transition-all duration-300 ease-in-out flex flex-col shadow-2xl",
          "lg:translate-x-0",
          effectiveExpanded ? "lg:w-64" : "lg:w-20",
          (!isSidebarPinned && isSidebarHovered) ? "lg:shadow-2xl" : "lg:shadow-none",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className={cn(
            "h-16 w-full flex items-center border-b border-gray-100 dark:border-dark-border shrink-0 transition-all duration-300",
            (effectiveExpanded || isMobileMenuOpen) ? "justify-between px-6" : "justify-center px-2"
        )}>
          <div className={cn(
              "font-bold text-emerald-600 flex items-center transition-all duration-500 whitespace-nowrap overflow-hidden select-none", 
              (effectiveExpanded || isMobileMenuOpen) ? "text-lg" : "text-base"
          )}>
             {(effectiveExpanded || isMobileMenuOpen) ? "My Heart" : "MH"}
          </div>

          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-gray-400 hover:text-emerald-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="w-full flex-1 overflow-y-auto py-4 px-2 space-y-1 scrollbar-thin">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const isExpanded = effectiveExpanded || isMobileMenuOpen;
            return (
              <div
                key={item.path}
                onClick={() => {
                    handleNavigate(item.path);
                    setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative cursor-pointer select-none active:scale-[0.98]",
                  isActive 
                    ? "bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-600/10" 
                    : "text-gray-500 dark:text-dark-textSecondary hover:bg-gray-50 dark:hover:bg-gray-800/40 hover:text-emerald-600 dark:hover:text-emerald-400",
                  (!isExpanded) && "lg:justify-center lg:px-1 lg:py-2.5"
                )}
                title={!isExpanded ? t(item.labelKey) : undefined}
              >
                <Icon size={isExpanded ? 18 : 20} className={cn("transition-transform duration-200 group-hover:scale-105", isActive && "scale-105")} />
                <Typography 
                    variant="body" 
                    className={cn(
                        "truncate transition-all duration-200 font-medium",
                        isActive ? "text-white" : "text-inherit",
                        (!isExpanded) ? "hidden" : "text-sm"
                    )}
                >
                    {t(item.labelKey)}
                </Typography>
              </div>
            );
          })}
        </nav>

        <div className="w-full h-14 border-t border-gray-100 dark:border-dark-border bg-gray-50/20 dark:bg-dark-card shrink-0">
            <div className="hidden lg:flex items-center justify-center h-full">
              <button 
                onClick={toggleSidebar}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:text-emerald-500 hover:border-emerald-500/50 transition-all shadow-sm active:scale-95 group"
                title={isSidebarPinned ? t('collapse_sidebar') : t('expand_sidebar')}
              >
                {isSidebarPinned ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </button>
            </div>
        </div>
      </aside>

      <div className={cn(
          "w-full flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out relative",
          isSidebarPinned ? "lg:ml-64" : "lg:ml-20"
      )}>
        
        <header className="w-full h-16 bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-dark-border/50 sticky top-0 z-[45] shadow-sm">
          <div className={cn("h-full flex items-center justify-between", responsivePadding)}>
            <div className="flex items-center gap-3 overflow-hidden">
              <button 
                  onClick={() => window.innerWidth < BREAKPOINTS.lg ? setIsMobileMenuOpen(true) : toggleSidebar()}
                  className="lg:hidden p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 hover:text-emerald-600 transition-all active:scale-90 shrink-0"
              >
                  <Menu size={20} />
              </button>
              
              <Typography variant="h2" className="text-base md:text-lg font-bold truncate">
                {t(getMenuKey(location.pathname))}
              </Typography>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button 
                  onClick={() => setIsTutorialOpen(true)}
                  className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 hover:text-emerald-600 transition-all active:scale-90 shrink-0"
                  title={t('tutorial_title')}
              >
                  <HelpCircle size={20} />
              </button>

              <div className="relative">
                  <button 
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 md:gap-3 p-1.5 rounded-lg border border-gray-200/50 dark:border-dark-border bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 shadow-sm"
                  >
                      <div className="w-7 h-7 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] overflow-hidden">
                          {settings.profilePhoto ? (
                              <img src={settings.profilePhoto} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                              currentUser?.name.substring(0, 1).toUpperCase() || 'U'
                          )}
                      </div>
                      <div className="hidden lg:block text-left pr-1">
                          <Typography variant="body" className="text-xs font-semibold">
                              {currentUser?.name || 'User'}
                          </Typography>
                      </div>
                      <ChevronDown size={12} className={cn("text-gray-400 transition-all duration-300 hidden lg:block", isUserMenuOpen && "rotate-180")} />
                  </button>

                  {isUserMenuOpen && (
                      <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)}></div>
                          <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-dark-card border border-gray-200/60 dark:border-dark-border rounded-xl shadow-2xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5 overflow-hidden">
                              <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-gray-800/20">
                                  <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-sm overflow-hidden">
                                           {settings.profilePhoto ? (
                                               <img src={settings.profilePhoto} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                           ) : (
                                               currentUser?.name.substring(0, 1).toUpperCase() || 'U'
                                           )}
                                       </div>
                                       <div className="min-w-0">
                                          <Typography variant="body" className="text-xs font-bold truncate">{currentUser?.name}</Typography>
                                          <Typography variant="caption" className="text-[10px] font-medium opacity-60">{currentUser?.id}</Typography>
                                       </div>
                                  </div>
                              </div>

                              <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
                                  <Typography variant="caption" className="text-[10px] font-bold mb-2 flex items-center gap-2">
                                      <Globe size={12} className="text-emerald-500" /> {t('switch_language')}
                                  </Typography>
                                  <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg">
                                      <button 
                                          onClick={() => updateSettings({ language: 'en' })}
                                          className={cn(
                                              "flex-1 py-1 rounded text-[10px] font-bold transition-all",
                                              settings.language === 'en' ? "bg-white dark:bg-gray-700 text-emerald-600 shadow-sm" : "text-gray-400"
                                          )}
                                      >
                                          English
                                      </button>
                                      <button 
                                          onClick={() => updateSettings({ language: 'km' })}
                                          className={cn(
                                              "flex-1 py-1 rounded text-[10px] font-bold transition-all",
                                              settings.language === 'km' ? "bg-white dark:bg-gray-700 text-emerald-600 shadow-sm" : "text-gray-400 font-khmer"
                                          )}
                                      >
                                          ខ្មែរ
                                      </button>
                                  </div>
                              </div>

                              <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
                                  <Typography variant="caption" className="text-[10px] font-bold mb-2 flex items-center gap-2">
                                      {settings.theme === 'light' ? <Sun size={12} className="text-emerald-500" /> : settings.theme === 'dark' ? <Moon size={12} className="text-emerald-500" /> : <Monitor size={12} className="text-emerald-500" />}
                                      {t('theme')}
                                  </Typography>
                                  <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg">
                                      <button 
                                          onClick={() => updateSettings({ theme: 'light' })}
                                          className={cn(
                                              "flex-1 py-1 rounded text-[10px] font-bold transition-all flex items-center justify-center gap-1",
                                              settings.theme === 'light' ? "bg-white dark:bg-gray-700 text-emerald-600 shadow-sm" : "text-gray-400"
                                          )}
                                      >
                                          <Sun size={10} /> {t('light')}
                                      </button>
                                      <button 
                                          onClick={() => updateSettings({ theme: 'dark' })}
                                          className={cn(
                                              "flex-1 py-1 rounded text-[10px] font-bold transition-all flex items-center justify-center gap-1",
                                              settings.theme === 'dark' ? "bg-white dark:bg-gray-700 text-emerald-600 shadow-sm" : "text-gray-400"
                                          )}
                                      >
                                          <Moon size={10} /> {t('dark')}
                                      </button>
                                      <button 
                                          onClick={() => updateSettings({ theme: 'system' })}
                                          className={cn(
                                              "flex-1 py-1 rounded text-[10px] font-bold transition-all flex items-center justify-center gap-1",
                                              settings.theme === 'system' ? "bg-white dark:bg-gray-700 text-emerald-600 shadow-sm" : "text-gray-400"
                                          )}
                                      >
                                          <Monitor size={10} /> {t('system')}
                                      </button>
                                  </div>
                              </div>

                              <div className="py-1">
                                  <button onClick={() => { navigate('/settings'); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-all">
                                      <Settings size={14} className="text-gray-400" /> {t('settings')}
                                  </button>
                              </div>

                              <div className="border-t border-gray-100 dark:border-dark-border mt-1 pt-1">
                                  <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-all">
                                      <LogOut size={14} /> {t('sign_out')}
                                  </button>
                              </div>
                          </div>
                      </>
                  )}
              </div>
            </div>
          </div>
        </header>

        <main className="w-full flex-1 overflow-x-hidden overflow-y-auto scrollbar-thin pt-2">
          <div className="w-full h-full">
            {children}
          </div>
        </main>

        <footer className="w-full hidden lg:flex h-14 bg-white dark:bg-dark-card border-t border-gray-200/40 dark:border-dark-border/40 items-center justify-center shrink-0">
          <div className={cn("w-full flex justify-center", responsivePadding)}>
            <Typography variant="caption" className="text-[10px] font-medium">
              {t('copyright')}
            </Typography>
          </div>
        </footer>
      </div>

      {/* FAB Quick Menu - Mobile */}
      {isFabOpen && (
          <div ref={fabMenuRef} className="lg:hidden fixed bottom-24 md:bottom-28 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-[60]">
              <button 
                  onClick={() => handleFabAction('Transfer')}
                  className="flex items-center justify-center gap-3 w-40 sm:w-48 md:w-56 h-12 md:h-14 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 border-2 border-white dark:border-dark-bg active:scale-95 transition-all group opacity-0 animate-slide-up"
                  style={{ animationDelay: '150ms' }}
              >
                  <ArrowRightLeft size={20} className="md:w-6 md:h-6" />
                  <span className="text-sm md:text-base font-bold tracking-wide">{t('transfer')}</span>
              </button>
              
              <button 
                  onClick={() => handleFabAction('Expense')}
                  className="flex items-center justify-center gap-3 w-40 sm:w-48 md:w-56 h-12 md:h-14 rounded-full bg-red-600 text-white shadow-xl shadow-red-600/30 border-2 border-white dark:border-dark-bg active:scale-95 transition-all group opacity-0 animate-slide-up"
                  style={{ animationDelay: '75ms' }}
              >
                  <CreditCard size={20} className="md:w-6 md:h-6" />
                  <span className="text-sm md:text-base font-bold tracking-wide">{t('expense')}</span>
              </button>

              <button 
                  onClick={() => handleFabAction('Income')}
                  className="flex items-center justify-center gap-3 w-40 sm:w-48 md:w-56 h-12 md:h-14 rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 border-2 border-white dark:border-dark-bg active:scale-95 transition-all group opacity-0 animate-slide-up"
                  style={{ animationDelay: '0ms' }}
              >
                  <Wallet size={20} className="md:w-6 md:h-6" />
                  <span className="text-sm md:text-base font-bold tracking-wide">{t('income')}</span>
              </button>
          </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div 
        className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-dark-card/95 backdrop-blur-3xl border-t border-gray-200/50 dark:border-dark-border/50 flex justify-around items-center z-[55] px-2 pb-safe shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.1)]"
      >
          {mobileNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              if (item.isFab) {
                  return (
                      <div key="fab" className="relative -top-5">
                          <button 
                              onClick={() => setIsFabOpen(!isFabOpen)}
                              className={cn(
                                  "w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
                                  isFabOpen 
                                    ? "bg-gray-800 text-white rotate-45" 
                                    : "bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-105"
                              )}
                          >
                              <CirclePlus size={28} strokeWidth={2.5} className="md:w-8 md:h-8" />
                          </button>
                      </div>
                  );
              }

              return (
                  <button 
                    key={item.labelKey}
                    onClick={() => {
                        if (item.path) {
                            navigate(item.path);
                            setIsFabOpen(false);
                        }
                    }}
                    className={cn(
                        "relative flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-all duration-200",
                        isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-dark-textSecondary"
                    )}
                  >
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={cn("transition-all duration-200", isActive ? "scale-110" : "scale-100")} />
                      <Typography variant="caption" className={cn(
                          "text-[9px] font-bold leading-none",
                          isActive ? "opacity-100" : "opacity-60"
                      )}>{t(item.labelKey)}</Typography>
                  </button>
              )
          })}
      </div>

      <Tutorial isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
    </div>
  );
};
