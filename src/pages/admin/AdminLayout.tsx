/**
 * Admin Layout Component
 * Layout เรียบง่ายสำหรับ Admin Panel
 */

import React, { useState } from 'react';
import { Layout, Menu, Avatar, Button, Typography } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  TableOutlined,
  LogoutOutlined,
  UserOutlined,
  HeartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FileTextOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { APP_VERSION } from '@/constants/version';

const { Header, Content, Sider, Footer } = Layout;
const { Text } = Typography;

interface AdminLayoutProps {
  onLogout: () => void;
  currentView: string;
  setCurrentView: (key: string) => void;
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  onLogout,
  currentView,
  setCurrentView,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'หน้าหลัก',
    },
    {
      key: 'guests',
      icon: <TeamOutlined />,
      label: 'แขก',
    },
    {
      key: 'seating',
      icon: <TableOutlined />,
      label: 'ที่นั่ง',
    },
    {
      key: 'rsvps',
      icon: <FileTextOutlined />,
      label: 'ตอบรับ',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'ตั้งค่า',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'ออกจากระบบ',
      danger: true,
      onClick: onLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        className="shadow-md z-10 fixed left-0 top-0 h-full"
        breakpoint="lg"
        collapsedWidth={0}
        width={240}
        trigger={null}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          height: '100vh',
        }}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-100 px-4">
          <HeartOutlined style={{ fontSize: '24px' }} className="text-pink-500 mr-2 flex-shrink-0" />
          {!collapsed && (
            <span className="font-bold text-base md:text-lg text-gray-700 truncate">Wedding Planner</span>
          )}
        </div>
        <Menu
          theme="light"
          selectedKeys={[currentView]}
          mode="inline"
          onClick={(e) => {
            if (e.key !== 'logout') {
              setCurrentView(e.key);
              // Auto collapse on mobile after selection (handled by breakpoint)
              // The Sider will auto-collapse on mobile via breakpoint="lg"
            }
          }}
          items={menuItems}
          className="border-none mt-2"
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 0 : 240, transition: 'margin-left 0.2s' }}>
        <Header 
          className="bg-white p-0 flex justify-between items-center px-3 sm:px-4 md:px-6 shadow-sm z-0 fixed top-0 right-0 left-0"
          style={{
            marginLeft: collapsed ? 0 : 240,
            transition: 'margin-left 0.2s',
            height: 64,
            lineHeight: '64px',
          }}
        >
          <div>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-base"
              size="large"
            />
          </div>
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-gray-50 p-1.5 sm:p-2 rounded-lg transition-colors"
            onClick={onLogout}
          >
            <div className="text-right leading-tight hidden lg:block">
              <div className="font-bold text-gray-700 text-sm">Admin</div>
              <div className="text-xs text-gray-400">ออกจากระบบ</div>
            </div>
            <Avatar 
              size={{ xs: 32, sm: 40, md: 40 }}
              style={{ backgroundColor: '#fde3cf', color: '#f56a00' }} 
              icon={<UserOutlined />} 
            />
            <LogoutOutlined style={{ fontSize: 16 }} className="text-gray-400 hidden sm:block" />
          </div>
        </Header>
        <Content 
          className="m-0 bg-gray-50 overflow-auto" 
          style={{ 
            minHeight: 'calc(100vh - 64px - 48px)',
            marginTop: 64,
            padding: '16px',
          }}
        >
          <div className="max-w-full">
            {children}
          </div>
        </Content>
        <Footer 
          className="bg-white border-t border-gray-200 py-2 sm:py-3 px-4 sm:px-6 text-center"
          style={{
            marginLeft: collapsed ? 0 : 240,
            transition: 'margin-left 0.2s',
          }}
        >
          <Text type="secondary" className="text-xs sm:text-sm">
            Wedding Planner v{APP_VERSION}
          </Text>
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;

