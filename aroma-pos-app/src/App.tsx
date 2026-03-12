import React, { useState, useEffect } from 'react';
import { ConfigProvider, theme, message, Spin } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MasterLayout from './layouts/MasterLayout';

// Services
import { authService } from './features/auth/api/auth.service';
import { systemService } from './features/system/api/system.service';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Menu from './pages/Menu';
import Employees from './pages/Employees';
import Categories from './pages/Categories';
import Modifiers from './pages/Modifiers';
import Devices from './pages/Devices';
import Configuration from './pages/Configuration';
import Reports from './pages/Reports';
import Activities from './pages/Activities';
import RolePermissions from './pages/RolePermissions';
import Taxes from './pages/Taxes';
import Branches from './pages/Branches';
import Orders from './pages/Orders';
import Customers from './pages/Customers';

import { Employee, Role } from './shared/types';
import { DEFAULT_ROLE_PERMISSIONS } from './shared/constants';
import Variants from './pages/Variants';

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
      const user = authService.getUserFromToken();
      if (user) setCurrentUser(user);
      setIsAuthChecked(true);
  }, []);

  useEffect(() => {
      if (currentUser) {
          fetchPermissions();
      }
  }, [currentUser]);

  const fetchPermissions = async () => {
      try {
          const perms = await systemService.getPermissions();
          if (perms && Object.keys(perms).length > 0) {
            setRolePermissions(perms);
          }
      } catch (error) {
          console.warn("Using default permissions due to API error", error);
      }
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
              <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Spin size="large" tip="Initializing..." />
              </div>
          </ConfigProvider>
      );
  }

  return (
    <ConfigProvider theme={appTheme}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!currentUser ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />} />
          
          <Route path="/" element={currentUser ? <MasterLayout currentUser={currentUser} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onLogout={handleLogout} rolePermissions={rolePermissions} /> : <Navigate to="/login" replace />}>
            <Route index element={<Dashboard isDarkMode={isDarkMode} />} />
            
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
            
            <Route path="configuration" element={<Configuration permissions={rolePermissions[currentUser?.role || 'Server']} />} />
            <Route path="reports" element={<Reports isDarkMode={isDarkMode} permissions={rolePermissions[currentUser?.role || 'Server']} />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;