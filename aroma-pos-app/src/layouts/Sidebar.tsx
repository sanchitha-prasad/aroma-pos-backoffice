import React, { useMemo, useCallback } from 'react';
import { Layout, Menu, theme, Switch, Avatar, Typography, Badge, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  AppstoreOutlined,
  ReadOutlined,
  TagsOutlined,
  ControlOutlined,
  TeamOutlined,
  BarChartOutlined,
  LogoutOutlined,
  DesktopOutlined,
  ToolOutlined,
  MoonOutlined,
  SunOutlined,
  UserOutlined,
  BellOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
  PercentageOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  UpOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { Employee } from '../shared/types';

const { Sider } = Layout;
const { Text } = Typography;

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  onLogout: () => void;
  currentUser: Employee | null;
  onOpenNotifications: () => void;
  notificationCount: number;
  userPermissions: string[];
}

const Sidebar: React.FC<SidebarProps> = React.memo(({ 
    collapsed, 
    onCollapse, 
    isDarkMode, 
    setIsDarkMode, 
    onLogout, 
    currentUser,
    onOpenNotifications,
    notificationCount,
    userPermissions
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  // Menu organized into logical sections. A section is either a flat group
  // (`type: 'group'`, items always shown under a label) or a collapsible
  // submenu (`type: 'submenu'`, items nested behind an expandable parent).
  const menuSections = useMemo(() => [
    {
      type: 'group' as const,
      key: 'grp-general',
      label: 'General',
      children: [
        { key: '/', icon: <AppstoreOutlined />, label: 'Dashboard', permission: 'BackOffice:dashboard:view' },
        { key: '/orders', icon: <ShoppingCartOutlined />, label: 'Orders', permission: 'BackOffice:orders:getall' },
        {
          key: 'notifications',
          icon: (
            <Badge dot={collapsed && notificationCount > 0} offset={[5, 0]}>
              <BellOutlined />
            </Badge>
          ),
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span>Notifications</span>
              {notificationCount > 0 && !collapsed && (
                <Badge count={notificationCount} size="small" style={{ marginLeft: 'auto' }} />
              )}
            </div>
          ),
          permission: 'ALWAYS_VISIBLE',
        },
      ],
    },
    {
      type: 'submenu' as const,
      key: 'sub-catalog',
      icon: <ReadOutlined />,
      label: 'Catalog',
      children: [
        { key: '/menus', icon: <AppstoreOutlined />, label: 'Menus', permission: 'BackOffice:menu:view' },
        { key: '/categories', icon: <TagsOutlined />, label: 'Categories', permission: 'BackOffice:categories:getall' },
        { key: '/menu', icon: <ReadOutlined />, label: 'Menu Items', permission: 'BackOffice:menu:view' },
        { key: '/modifiers', icon: <ControlOutlined />, label: 'Modifiers', permission: 'BackOffice:modifiers:getall' },
        { key: '/variants', icon: <TagsOutlined />, label: 'Variants', permission: 'BackOffice:variants:getall' },
        { key: '/taxes', icon: <PercentageOutlined />, label: 'Taxes', permission: 'BackOffice:taxes:getall' },
      ],
    },
    {
      type: 'submenu' as const,
      key: 'sub-team',
      icon: <TeamOutlined />,
      label: 'Team & Access',
      children: [
        { key: '/employees', icon: <TeamOutlined />, label: 'Employees', permission: 'BackOffice:employees:getall' },
        { key: '/customers', icon: <UserOutlined />, label: 'Customers', permission: 'ALWAYS_VISIBLE' },
        { key: '/roles', icon: <SafetyCertificateOutlined />, label: 'Roles & Permissions', permission: 'BackOffice:employees:create' },
      ],
    },
    {
      type: 'submenu' as const,
      key: 'sub-operations',
      icon: <DesktopOutlined />,
      label: 'Operations',
      children: [
        { key: '/devices', icon: <DesktopOutlined />, label: 'Devices', permission: 'BackOffice:devices:getall' },
        { key: '/branches', icon: <ShopOutlined />, label: 'Branches', permission: 'BackOffice:branches:getall' },
      ],
    },
    {
      type: 'submenu' as const,
      key: 'sub-insights',
      icon: <BarChartOutlined />,
      label: 'Insights',
      children: [
        { key: '/reports', icon: <BarChartOutlined />, label: 'Reports', permission: 'BackOffice:reports:view' },
        { key: '/activities', icon: <HistoryOutlined />, label: 'Activity Log', permission: 'BackOffice:activity:getall' },
      ],
    },
    {
      type: 'group' as const,
      key: 'grp-system',
      label: 'System',
      children: [
        { key: '/configuration', icon: <ToolOutlined />, label: 'Configurations', permission: 'BackOffice:config:view' },
      ],
    },
  ], [collapsed, notificationCount]);

  const canView = useCallback((permission: string) => {
    return permission === 'ALWAYS_VISIBLE' || userPermissions.includes(permission);
  }, [userPermissions]);

  // Build AntD menu items, filtering by permission and dropping empty sections.
  // When collapsed, group labels would render as ugly truncated text ("Gen..."),
  // so we flatten groups into plain icon items in that mode.
  const menuItems = useMemo(() => {
    const items: NonNullable<MenuProps['items']> = [];
    menuSections.forEach(section => {
      const children = section.children
        .filter(child => canView(child.permission))
        .map(child => ({ key: child.key, icon: child.icon, label: child.label }));

      if (children.length === 0) return;

      if (section.type === 'submenu') {
        items.push({ key: section.key, icon: section.icon, label: section.label, children });
      } else if (collapsed) {
        // Flatten group → plain items (no truncated label) in icon-only mode.
        children.forEach(c => items.push(c));
      } else {
        items.push({ key: section.key, label: section.label, type: 'group', children });
      }
    });
    return items;
  }, [menuSections, canView, collapsed]);

  // Keep the submenu that contains the active route expanded.
  const openKeys = useMemo(() => {
    const active = menuSections.find(
      section => section.type === 'submenu' && section.children.some(c => c.key === location.pathname)
    );
    return active ? [active.key] : [];
  }, [menuSections, location.pathname]);

  const [stateOpenKeys, setStateOpenKeys] = React.useState<string[]>(openKeys);

  React.useEffect(() => {
    setStateOpenKeys(prev => Array.from(new Set([...prev, ...openKeys])));
  }, [openKeys]);

  const handleMenuClick = useCallback(({ key }: { key: string }) => {
      if (key === 'notifications') {
          onOpenNotifications();
      } else {
          navigate(key);
      }
  }, [navigate, onOpenNotifications]);

  const backgroundColor = isDarkMode ? '#121212' : '#ffffff';
  const borderColor = isDarkMode ? '#2e2e2e' : '#e6e8eb';
  const textColor = token.colorText;
  const secondaryTextColor = token.colorTextSecondary;
  const logoBg = token.colorPrimary;

  const siderStyle = useMemo(() => ({ 
    background: backgroundColor,
    height: '100vh', 
    position: 'sticky' as const, 
    left: 0, 
    top: 0, 
    bottom: 0,
    borderRight: `1px solid ${borderColor}`,
    zIndex: 20,
    overflow: 'hidden',
    boxShadow: isDarkMode ? 'none' : '4px 0 16px 0 rgba(0,0,0,0.05)'
  }), [backgroundColor, borderColor, isDarkMode]);

  const hoverBg = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  const headerContainerStyle = useMemo(() => ({ flexShrink: 0, padding: collapsed ? '16px 8px 12px' : '16px 12px 12px' }), [collapsed]);
  const headerStyle = useMemo(() => ({
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    color: isDarkMode ? 'white' : '#333',
    background: 'transparent',
    borderRadius: 8,
    padding: collapsed ? 0 : '0 8px',
    overflow: 'hidden',
    whiteSpace: 'nowrap' as const,
    gap: 12
  }), [isDarkMode, collapsed]);

  const logoStyle = useMemo(() => ({
    width: 36,
    height: 36,
    flexShrink: 0,
    background: logoBg,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: 18,
    color: '#fff',
    boxShadow: '0 2px 6px rgba(97, 50, 192, 0.4)'
  }), [logoBg]);

  const menuContainerStyle = useMemo(() => ({ flex: 1, overflowY: 'auto' as const, overflowX: 'hidden' as const, padding: '0 8px' }), []);
  const menuStyle = useMemo(() => ({
    background: 'transparent',
    borderRight: 0,
    fontSize: 14,
    fontWeight: 500
  }), []);

  const footerStyle = useMemo(() => ({
    flexShrink: 0,
    borderTop: `1px solid ${borderColor}`,
    padding: collapsed ? '12px 8px' : '12px',
    background: 'transparent'
  }), [borderColor, collapsed]);

  // shadcn-style user card that triggers the account dropdown.
  const userCardStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    cursor: 'pointer',
    padding: collapsed ? 6 : '8px 8px',
    borderRadius: 8,
    justifyContent: collapsed ? 'center' : 'flex-start' as const,
    transition: 'background 0.15s ease'
  }), [collapsed]);

  const avatarStyle = useMemo(() => ({ backgroundColor: token.colorPrimary, flexShrink: 0 }), [token.colorPrimary]);

  // Account dropdown shown from the footer user card (shadcn sidebar-07 pattern).
  const userMenuItems = useMemo<MenuProps['items']>(() => [
    {
      key: 'profile',
      label: (
        <div style={{ padding: '4px 4px 6px', minWidth: 180 }}>
          <Text strong style={{ display: 'block', fontSize: 13, lineHeight: 1.3 }}>{currentUser?.name}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{currentUser?.email}</Text>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'theme',
      icon: isDarkMode ? <MoonOutlined /> : <SunOutlined />,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, minWidth: 160 }}>
          <span>Dark Mode</span>
          <Switch
            size="small"
            checked={isDarkMode}
            onChange={setIsDarkMode}
          />
        </div>
      ),
      onClick: () => setIsDarkMode(!isDarkMode),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: onLogout,
    },
  ], [currentUser, isDarkMode, setIsDarkMode, onLogout]);

  return (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={onCollapse}
      trigger={null}
      width={260}
      style={siderStyle}
      theme={isDarkMode ? 'dark' : 'light'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

        <div style={headerContainerStyle}>
            <div style={headerStyle}>
                <div style={logoStyle}>
                    A
                </div>
                {!collapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.2px', lineHeight: 1.2 }}>AROMA POS</span>
                        <span style={{ fontSize: 11, color: secondaryTextColor, lineHeight: 1.2 }}>Back Office</span>
                    </div>
                )}
            </div>
        </div>

        <div style={menuContainerStyle}>
            <Menu
                theme={isDarkMode ? 'dark' : 'light'}
                mode="inline"
                selectedKeys={[location.pathname]}
                openKeys={collapsed ? undefined : stateOpenKeys}
                onOpenChange={(keys) => setStateOpenKeys(keys as string[])}
                onClick={handleMenuClick}
                items={menuItems}
                style={menuStyle}
            />
        </div>
        
        <div style={footerStyle}>
            <Dropdown
                menu={{ items: userMenuItems }}
                trigger={['click']}
                placement="topRight"
                arrow
            >
                <div
                    style={userCardStyle}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = hoverBg; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                    <Avatar style={avatarStyle} icon={<UserOutlined />}>
                        {currentUser?.name?.[0]}
                    </Avatar>

                    {!collapsed && (
                        <>
                            <div style={{ overflow: 'hidden', flex: 1 }}>
                                <Text strong style={{ color: textColor, display: 'block', fontSize: 13, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                    {currentUser?.name}
                                </Text>
                                <Text style={{ color: secondaryTextColor, fontSize: 11, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'block' }}>
                                    {currentUser?.email}
                                </Text>
                            </div>
                            <UpOutlined style={{ fontSize: 10, color: secondaryTextColor, flexShrink: 0 }} />
                        </>
                    )}
                </div>
            </Dropdown>
        </div>

      </div>
    </Sider>
  );
});

export default Sidebar;