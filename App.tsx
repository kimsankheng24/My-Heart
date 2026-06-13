
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './store';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { Accounts } from './components/Accounts';
import { AccountDetails } from './components/AccountDetails';
import { Budgets } from './components/Budgets';
import { Goals } from './components/Goals';
import { Analytics } from './components/Analytics';
import { Assets } from './components/Assets';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { Login } from './components/Login';

// Protected Route Wrapper
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useApp();
    const location = useLocation();

    if (!currentUser) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they login, which is a nicer user experience
        // than dropping them off on the home page.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

const AppRoutes: React.FC = () => {
    const { settings } = useApp();

    // Side effect to handle theme application (including system preference)
    useEffect(() => {
        const root = document.documentElement;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = () => {
            const isSystemDark = mediaQuery.matches;
            const shouldBeDark = 
                settings.theme === 'dark' || 
                (settings.theme === 'system' && isSystemDark);

            if (shouldBeDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };

        // Apply theme immediately upon setting change
        applyTheme();

        // If system mode is selected, listen for OS-level changes
        if (settings.theme === 'system') {
            const handleChange = (e: MediaQueryListEvent) => {
                if (e.matches) root.classList.add('dark');
                else root.classList.remove('dark');
            };
            
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [settings.theme]);

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* 
                Use a wildcard route for the protected app to allow nested 
                Routes inside the Layout component to handle specific paths.
            */}
            <Route path="/*" element={
                <RequireAuth>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/transactions" element={<Transactions />} />
                            <Route path="/accounts" element={<Accounts />} />
                            <Route path="/accounts/:id" element={<AccountDetails />} />
                            <Route path="/goals" element={<Goals />} />
                            <Route path="/budget" element={<Budgets />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/assets" element={<Assets />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/settings" element={<Settings />} />
                            {/* Catch-all for inside the app redirects to dashboard */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Layout>
                </RequireAuth>
            } />
        </Routes>
    );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </HashRouter>
  );
};

export default App;
