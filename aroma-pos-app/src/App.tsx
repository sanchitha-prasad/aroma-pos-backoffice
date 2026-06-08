import React, { useState, useEffect, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntdApp, ConfigProvider, theme, Spin } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { setGlobalMessageApi } from './shared/services/api/globalMessage';
import MasterLayout from './layouts/MasterLayout';
import { CurrencyProvider } from './shared/context/CurrencyContext';

// Services
import { authService } from './features/auth/api/auth.service';
import { authStore } from './shared/services/auth/authStore';

// Lazy-loaded Pages
import { lazyWithRetry } from './shared/utils/lazyWithRetry';
import PageLoader from './shared/components/loading/PageLoader';

const Login = lazyWithRetry(() => import('./pages/Login'));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const Menu = lazyWithRetry(() => import('./pages/Menu'));
const Employees = lazyWithRetry(() => import('./pages/Employees'));
const Categories = lazyWithRetry(() => import('./pages/Categories'));
const Modifiers = lazyWithRetry(() => import('./pages/Modifiers'));
const Devices = lazyWithRetry(() => import('./pages/Devices'));
const Configuration = lazyWithRetry(() => import('./pages/Configuration'));
const Reports = lazyWithRetry(() => import('./pages/Reports'));
const Activities = lazyWithRetry(() => import('./pages/Activities'));
const RolePermissions = lazyWithRetry(() => import('./pages/RolePermissions'));
const Taxes = lazyWithRetry(() => import('./pages/Taxes'));
const Branches = lazyWithRetry(() => import('./pages/Branches'));
const Orders = lazyWithRetry(() => import('./pages/Orders'));
const Customers = lazyWithRetry(() => import('./pages/Customers'));
const Variants = lazyWithRetry(() => import('./pages/Variants'));
const Menus = lazyWithRetry(() => import('./pages/Menus'));

import { Employee, Role } from './shared/types';
import { DEFAULT_ROLE_PERMISSIONS } from './shared/constants';

const MessageInitializer: React.FC = () => {
  const { message } = AntdApp.useApp();
  useEffect(() => { setGlobalMessageApi(message); }, [message]);
  return null;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,   // 2 min — data stays fresh before background refetch
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
      const match = document.cookie.match(new RegExp('(^| )theme_mode=([^;]+)'));
      if (match) return match[2] === 'dark';
      return false;
  });
  
  // Global Permissions State (Needed for Sidebar Navigation)
  const [rolePermissions, setRolePermissions] = useState<Record<Role, string[]>>(DEFAULT_ROLE_PERMISSIONS);

  useEffect(() => {
      const initAuth = () => {
          // In-memory session still intact (same-tab navigation)
          let user = authService.getCurrentUser();

          // Hard refresh — restore from sessionStorage so the user never sees
          // the login page. The stored access token is used until it expires,
          // at which point a 401 redirects to login naturally.
          if (!user) {
              authStore.restoreFromStorage();
              user = authStore.currentUser;
          }

          if (user) setCurrentUser(user);
          setIsAuthChecked(true);
      };

      initAuth();
  }, []);

  useEffect(() => {
      if (currentUser) {
          fetchPermissions();
      }
  }, [currentUser]);

  const fetchPermissions = async () => {
      // permissions API not yet available — using defaults
  };

  useEffect(() => {
    const themeValue = isDarkMode ? 'dark' : 'light';
    document.cookie = `theme_mode=${themeValue}; path=/; max-age=31536000; SameSite=Lax`;
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.body.style.backgroundColor = '#121212';
    } else {
        document.body.classList.remove('dark-mode');
        document.body.style.backgroundColor = '#f8f9fa';
    }
  }, [isDarkMode]);

  const handleLogin = (user: Employee) => {
      setCurrentUser(user);
  };

  const handleLogout = () => {
      authService.logout();
      setCurrentUser(null);
  };

  const appTheme = {
    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#6132C0',
      fontFamily: "'Inter', sans-serif",
      borderRadius: 6,
    },
  };

  if (!isAuthChecked) {
      return (
          <ConfigProvider theme={appTheme}>
              <AntdApp>
                  <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Spin size="large" description="Initializing..." />
                  </div>
              </AntdApp>
          </ConfigProvider>
      );
  }

  return (
    <QueryClientProvider client={queryClient}>
    <ConfigProvider theme={appTheme}>
      <AntdApp>
        <MessageInitializer />
        <CurrencyProvider key={currentUser?.id ?? 'guest'}>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={!currentUser ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />} />

              <Route path="/" element={currentUser ? <MasterLayout currentUser={currentUser} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onLogout={handleLogout} rolePermissions={rolePermissions} /> : <Navigate to="/login" replace />}>
                <Route index element={<Dashboard isDarkMode={isDarkMode} />} />

                <Route path="menus" element={<Menus />} />
                <Route path="menu" element={<Menu currentUser={currentUser} />} />
                <Route path="categories" element={<Categories />} />
                <Route path="variants" element={<Variants />} />
                <Route path="modifiers" element={<Modifiers />} />
                <Route path="devices" element={<Devices />} />
                <Route path="taxes" element={<Taxes />} />
                <Route path="branches" element={<Branches />} />
                <Route path="orders" element={<Orders />} />
                <Route path="employees" element={<Employees />} />
                <Route path="customers" element={<Customers />} />

                <Route path="roles" element={<RolePermissions />} />
                <Route path="activities" element={<Activities />} />

                <Route path="configuration" element={<Configuration permissions={rolePermissions[currentUser?.role || 'Manager']} />} />
                <Route path="reports" element={<Reports isDarkMode={isDarkMode} permissions={rolePermissions[currentUser?.role || 'Manager']} />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
        </CurrencyProvider>
      </AntdApp>
    </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App;