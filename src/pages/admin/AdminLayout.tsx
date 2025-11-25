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
        className="shadow-md z-10"
        breakpoint="lg"
        collapsedWidth={0}
        trigger={null}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-100">
          <HeartOutlined style={{ fontSize: '24px' }} className="text-pink-500 mr-2" />
          {!collapsed && <span className="font-bold text-lg text-gray-700">Wedding Planner</span>}
        </div>
        <Menu
          theme="light"
          selectedKeys={[currentView]}
          mode="inline"
          onClick={(e) => {
            if (e.key !== 'logout') {
              setCurrentView(e.key);
            }
          }}
          items={menuItems}
          className="border-none mt-2"
        />
      </Sider>
      <Layout>
        <Header className="bg-white p-0 flex justify-between items-center px-3 md:px-6 shadow-sm z-0">
          <div>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-base"
            />
          </div>
          <div
            className="flex items-center gap-2 md:gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
            onClick={onLogout}
          >
            <div className="text-right leading-tight hidden md:block">
              <div className="font-bold text-gray-700 text-sm">Admin</div>
              <div className="text-xs text-gray-400">ออกจากระบบ</div>
            </div>
            <Avatar style={{ backgroundColor: '#fde3cf', color: '#f56a00' }} icon={<UserOutlined />} />
            <LogoutOutlined style={{ fontSize: 16 }} className="text-gray-400 hidden sm:block" />
          </div>
        </Header>
        <Content className="m-0 bg-gray-50 overflow-auto" style={{ minHeight: 'calc(100vh - 64px - 48px)' }}>
          {children}
        </Content>
        <Footer className="bg-white border-t border-gray-200 py-2 px-6 text-center">
          <Text type="secondary" className="text-xs">
            Wedding Planner v{APP_VERSION}
          </Text>
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;

