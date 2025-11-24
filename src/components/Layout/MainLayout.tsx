import React, { useState } from 'react';
import { Layout, Menu, Avatar, Button } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  TableOutlined,
  LogoutOutlined,
  UserOutlined,
  HeartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LinkOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header, Content, Sider } = Layout;

interface MainLayoutProps {
  onLogout: () => void;
  currentView: string;
  setCurrentView: (key: string) => void;
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  onLogout,
  currentView,
  setCurrentView,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems: MenuProps['items'] = [
    {
      key: '1',
      icon: <DashboardOutlined />,
      label: 'Dashboard ภาพรวม',
    },
    {
      key: '2',
      icon: <TeamOutlined />,
      label: 'รายชื่อคนเข้างาน',
    },
    {
      key: '3',
      icon: <TableOutlined />,
      label: 'จัดการผังโต๊ะ & โซน',
    },
    {
      key: '4',
      icon: <TeamOutlined />,
      label: 'เช็คอินหน้างาน',
    },
    {
      key: '5',
      icon: <LinkOutlined />,
      label: 'จัดการการ์ด',
    },
    {
      key: '6',
      icon: <CheckCircleOutlined />,
      label: 'รายการตอบรับ',
    },
    {
      type: 'divider',
    },
    {
      key: '99',
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
          onClick={(e) => setCurrentView(e.key)}
          items={menuItems}
          className="border-none mt-2"
        />
      </Sider>
      <Layout>
        <Header className="bg-white p-0 flex justify-between items-center px-6 shadow-sm z-0">
          <div>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
          </div>
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
            onClick={onLogout}
          >
            <div className="text-right leading-tight hidden sm:block">
              <div className="font-bold text-gray-700 text-sm">Admin Team</div>
              <div className="text-xs text-gray-400">ออกจากระบบ</div>
            </div>
            <Avatar style={{ backgroundColor: '#fde3cf', color: '#f56a00' }} icon={<UserOutlined />} />
            <LogoutOutlined style={{ fontSize: 16 }} className="text-gray-400" />
          </div>
        </Header>
        <Content className="m-0 bg-gray-50 overflow-auto h-[calc(100vh-64px)]">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
