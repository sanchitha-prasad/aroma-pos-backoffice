import React from 'react';
import { Layout, Menu, theme, Switch, Avatar, Typography, Badge } from 'antd';
import { 
  AppstoreOutlined,
  ReadOutlined,
  TagsOutlined,
  ControlOutlined,
  TeamOutlined, 
  BarChartOutlined, 
  LogoutOutlined,
  DesktopOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ToolOutlined,
  MoonOutlined,
  SunOutlined,
  UserOutlined,
  BellOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
  PercentageOutlined,
  ShopOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { Employee, Role } from '../shared/types';

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

const Sidebar: React.FC<SidebarProps> = ({ 
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
  const role = currentUser?.role || 'Manager';

  const allItems = [
    { key: '/', icon: <AppstoreOutlined />, label: 'Dashboard', permission: 'BackOffice:dashboard:view' },
    { key: '/orders', icon: <ShoppingCartOutlined />, label: 'Orders', permission: 'BackOffice:orders:getall' },
    { key: '/menus', icon: <AppstoreOutlined />, label: 'Menus', permission: 'BackOffice:menu:view' },
    { key: '/menu', icon: <ReadOutlined />, label: 'Menu Items', permission: 'BackOffice:menu:view' },
    { key: '/modifiers', icon: <ControlOutlined />, label: 'Modifiers', permission: 'BackOffice:modifiers:getall' },
    { key: '/categories', icon: <TagsOutlined />, label: 'Categories', permission: 'BackOffice:categories:getall' },
    { key: '/variants', icon: <TagsOutlined />, label: 'Variants', permission: 'BackOffice:variants:getall' },
    { key: '/taxes', icon: <PercentageOutlined />, label: 'Taxes', permission: 'BackOffice:taxes:getall' },
    { key: '/devices', icon: <DesktopOutlined />, label: 'Devices', permission: 'BackOffice:devices:getall' },
    { key: '/employees', icon: <TeamOutlined />, label: 'Employees', permission: 'BackOffice:employees:getall' },
    { key: '/customers', icon: <TeamOutlined />, label: 'Customers', permission: 'ALWAYS_VISIBLE' },
    { key: '/branches', icon: <ShopOutlined />, label: 'Branches', permission: 'BackOffice:branches:getall' },
    { key: '/roles', icon: <SafetyCertificateOutlined />, label: 'Roles & Permissions', permission: 'BackOffice:employees:create' },
    { key: '/activities', icon: <HistoryOutlined />, label: 'Activity Log', permission: 'BackOffice:activity:getall' },
    { key: '/reports', icon: <BarChartOutlined />, label: 'Reports', permission: 'BackOffice:reports:view' },
    { key: '/configuration', icon: <ToolOutlined />, label: 'Configurations', permission: 'BackOffice:config:view' },
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
        permission: 'ALWAYS_VISIBLE'
    }
  ];

  const visibleItems = allItems.filter(item => {
      if (item.permission === 'ALWAYS_VISIBLE') return true;
      return userPermissions.includes(item.permission);
  });

  const handleMenuClick = ({ key }: { key: string }) => {
      if (key === 'notifications') {
          onOpenNotifications();
      } else {
          navigate(key);
      }
  };

  const backgroundColor = isDarkMode ? '#121212' : '#ffffff';
  const borderColor = isDarkMode ? '#2e2e2e' : '#e6e8eb';
  const textColor = token.colorText;
  const secondaryTextColor = token.colorTextSecondary;
  const logoBg = token.colorPrimary;

  return (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={onCollapse}
      trigger={null}
      width={260}
      style={{ 
        background: backgroundColor,
        height: '100vh', 
        position: 'sticky', 
        left: 0, 
        top: 0, 
        bottom: 0,
        borderRight: `1px solid ${borderColor}`,
        zIndex: 20,
        overflow: 'hidden',
        boxShadow: isDarkMode ? 'none' : '4px 0 16px 0 rgba(0,0,0,0.05)'
      }}
      theme={isDarkMode ? 'dark' : 'light'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        <div style={{ flexShrink: 0, padding: '20px 16px 24px 16px' }}>
            <div style={{ 
                height: 48, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: isDarkMode ? 'white' : '#333',
                background: 'transparent', 
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                gap: 12
            }}>
                <div style={{ 
                    width: 32, 
                    height: 32, 
                    background: logoBg, 
                    borderRadius: 6, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    color: '#fff',
                    boxShadow: '0 2px 4px rgba(97, 50, 192, 0.4)'
                }}>
                    A
                </div>
                {!collapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.2px' }}>AROMA POS</span>
                    </div>
                )}
            </div>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 8px' }}>
            <Menu
                theme={isDarkMode ? 'dark' : 'light'}
                mode="inline"
                selectedKeys={[location.pathname]}
                onClick={handleMenuClick}
                items={visibleItems.map(i => ({ key: i.key, icon: i.icon, label: i.label }))}
                style={{ 
                    background: 'transparent', 
                    borderRight: 0,
                    fontSize: 14,
                    fontWeight: 500
                }}
            />
        </div>
        
        <div style={{ 
            flexShrink: 0, 
            borderTop: `1px solid ${borderColor}`, 
            padding: '16px', 
            background: isDarkMode ? '#1c1c1c' : '#f9fafb'
        }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', marginBottom: 16 }}>
                {!collapsed && <span style={{ color: secondaryTextColor, fontSize: 12 }}>Dark Mode</span>}
                <Switch
                    size={collapsed ? "small" : "medium"}
                    checkedChildren={<MoonOutlined />}
                    unCheckedChildren={<SunOutlined />}
                    checked={isDarkMode}
                    onChange={setIsDarkMode}
                    style={{ background: isDarkMode ? token.colorPrimary : '#bfbfbf' }}
                />
            </div>

            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                padding: '8px 0',
                justifyContent: collapsed ? 'center' : 'flex-start'
            }}>
                <Avatar 
                    style={{ backgroundColor: token.colorPrimary, flexShrink: 0 }} 
                    icon={<UserOutlined />} 
                >
                    {currentUser?.name[0]}
                </Avatar>
                
                {!collapsed && (
                    <div style={{ overflow: 'hidden' }}>
                        <Text strong style={{ color: textColor, display: 'block', fontSize: 13, whiteSpace: 'nowrap' }}>
                            {currentUser?.name}
                        </Text>
                        <Text style={{ color: secondaryTextColor, fontSize: 11 }}>
                            {currentUser?.role}
                        </Text>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <div 
                    onClick={onLogout}
                    style={{ 
                        cursor: 'pointer', 
                        color: '#ef4444', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        fontSize: 13,
                        padding: '8px 4px'
                    }}
                >
                    <LogoutOutlined />
                    {!collapsed && <span>Logout</span>}
                </div>

                <div 
                    onClick={() => onCollapse(!collapsed)}
                    style={{
                        cursor: 'pointer',
                        color: secondaryTextColor,
                        padding: '8px'
                    }}
                >
                    {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                </div>
            </div>

        </div>

      </div>
    </Sider>
  );
};

export default Sidebar;