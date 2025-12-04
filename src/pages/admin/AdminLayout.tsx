/**
 * Admin Layout Component
 * Layout เรียบง่ายสำหรับ Admin Panel
 * Mobile: Bottom Navigation Bar
 * Desktop: Sidebar
 */

import React, { useState } from 'react';
import { Layout, Menu, Avatar, Button, Grid } from 'antd';
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

const { Header, Content, Sider } = Layout;
const { useBreakpoint } = Grid;

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
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

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
  ];

  const handleMenuClick = (e: { key: string }) => {
    if (e.key !== 'logout') {
      setCurrentView(e.key);
    }
  };

  const DesktopMenu = () => (
    <>
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
        onClick={handleMenuClick}
        items={menuItems}
        className="border-none mt-2"
      />
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100">
        <Menu
          theme="light"
          mode="inline"
          items={[
            {
              key: 'logout',
              icon: <LogoutOutlined />,
              label: 'ออกจากระบบ',
              danger: true,
              onClick: onLogout,
            },
          ]}
          className="border-none"
        />
      </div>
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="light"
          className="shadow-md"
          width={240}
          trigger={null}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
          }}
        >
          <DesktopMenu />
        </Sider>
      )}

      <Layout style={{ marginLeft: isMobile ? 0 : (collapsed ? 80 : 240), transition: 'margin-left 0.2s' }}>
        <Header
          className="bg-white p-0 flex justify-between items-center px-2 sm:px-4 md:px-6 shadow-sm"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            left: isMobile ? 0 : (collapsed ? 80 : 240),
            height: 56,
            lineHeight: '56px',
            zIndex: 99,
            transition: 'left 0.2s',
          }}
        >
          <div className="flex items-center gap-2">
            {!isMobile && (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                className="text-base"
                size="large"
              />
            )}
            {isMobile && (
              <div className="flex items-center gap-2">
                <HeartOutlined className="text-pink-500 text-lg" />
                <span className="font-bold text-base text-gray-700">Wedding Planner</span>
              </div>
            )}
          </div>
          <div
            className="flex items-center gap-1.5 sm:gap-3 cursor-pointer hover:bg-gray-50 p-1 sm:p-2 rounded-lg transition-colors"
            onClick={onLogout}
          >
            <div className="text-right leading-tight hidden md:block">
              <div className="font-bold text-gray-700 text-sm">Admin</div>
              <div className="text-xs text-gray-400">ออกจากระบบ</div>
            </div>
            <Avatar
              size={isMobile ? 32 : 40}
              style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}
              icon={<UserOutlined />}
            />
            <LogoutOutlined style={{ fontSize: 14 }} className="text-gray-400 hidden sm:block" />
          </div>
        </Header>

        <Content
          className="bg-gray-50 overflow-auto"
          style={{
            minHeight: 'calc(100vh - 56px)',
            marginTop: 56,
            marginBottom: isMobile ? 60 : 0, // Space for bottom nav on mobile
            padding: 0,
          }}
        >
          <div className="w-full h-full">
            {children}
          </div>
        </Content>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <div
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg"
            style={{
              height: 60,
              zIndex: 100,
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              padding: '0 8px',
            }}
          >
            {menuItems.map(item => {
              const isActive = currentView === item?.key;
              const menuItem = item as any;
              return (
                <button
                  key={item?.key}
                  onClick={() => handleMenuClick({ key: item?.key as string })}
                  className="flex flex-col items-center justify-center flex-1 h-full transition-colors"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: isActive ? '#ec4899' : '#6b7280',
                    minWidth: 0,
                  }}
                >
                  <div
                    className="transition-transform"
                    style={{
                      fontSize: isActive ? '22px' : '20px',
                      transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    {menuItem.icon}
                  </div>
                  <span
                    className="mt-0.5 truncate w-full text-center"
                    style={{
                      fontSize: 'clamp(9px, 2vw, 11px)',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {menuItem.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
