import React, { useState, Suspense } from 'react';
import { Layout, Drawer, List, Avatar, Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Employee, Role } from '../shared/types';
import PageLoader from '../shared/components/loading/PageLoader';

const { Content } = Layout;
const { Text } = Typography;

interface MasterLayoutProps {
  currentUser: Employee | null;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  onLogout: () => void;
  rolePermissions: Record<Role, string[]>;
}

const MasterLayout: React.FC<MasterLayoutProps> = ({ currentUser, isDarkMode, setIsDarkMode, onLogout, rolePermissions }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const notifications: { title: string; desc: string; time: string }[] = [];
  
  const userPermissions = currentUser && rolePermissions[currentUser.role] 
    ? rolePermissions[currentUser.role] 
    : [];

  const handleOpenNotifications = React.useCallback(() => {
    setIsNotifOpen(true);
  }, []);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar 
        collapsed={collapsed}
        onCollapse={setCollapsed}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onLogout={onLogout}
        currentUser={currentUser}
        onOpenNotifications={handleOpenNotifications}
        notificationCount={notifications.length}
        userPermissions={userPermissions}
      />

      <Layout style={{ position: 'relative' }}>
        <Drawer title="Notifications" placement="right" onClose={() => setIsNotifOpen(false)} open={isNotifOpen}>
            {/* <List
              itemLayout="horizontal"
              dataSource={notifications}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: '#6132C0' }} icon={<BellOutlined />} />}
                    title={item.title}
                    description={
                      <div>
                          <div>{item.desc}</div>
                          <Text type="secondary" style={{ fontSize: 11 }}>{item.time}</Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            /> */}

            <div> 
              {notifications.map((item, index) => (
                <List.Item key={index}>
                  <List.Item.Meta
                    avatar={ <Avatar style={{ backgroundColor: '#6132C0' }} icon={<BellOutlined />} />}
                    title={item.title}
                    description={
                      <div>
                        <div>{item.desc}</div>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {item.time}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              ))}
            </div>
        </Drawer>
        <Content style={{ margin: '24px 32px 24px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)' }}>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MasterLayout;