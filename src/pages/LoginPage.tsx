import React, { useState } from 'react';
import { Layout, Card, Form, Input, Button, Typography, Alert, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text } = Typography;

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
}

interface LoginFieldType {
  username?: string;
  password?: string;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { message } = App.useApp();

  const onFinish = (values: LoginFieldType) => {
    setLoading(true);
    setErrorMsg(null);

    // Mock authentication
    if (values.username === 'admin' && values.password === '1150') {
      setTimeout(() => {
        message.success('เข้าสู่ระบบสำเร็จ (Mock) กำลังนำไปยัง Dashboard...');
        setLoading(false);
        onLoginSuccess();
      }, 500);
    } else {
      setTimeout(() => {
        setErrorMsg('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        setLoading(false);
      }, 500);
    }
  };

  return (
    <Layout className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Content className="w-full max-w-md p-4">
        <Card className="shadow-lg rounded-xl overflow-hidden" variant="borderless">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 text-pink-600 rounded-full mb-4">
              <UserOutlined style={{ fontSize: '32px' }} />
            </div>
            <Title level={3} style={{ margin: 0, color: '#333' }}>
              Wedding Manager
            </Title>
            <Text type="secondary">ระบบจัดการรายชื่อและที่นั่ง</Text>
          </div>
          {errorMsg && <Alert message={errorMsg} type="error" showIcon className="mb-6" />}
          <Form
            layout="vertical"
            onFinish={onFinish}
            size="large"
            initialValues={{ username: 'admin', password: '1150' }}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'กรุณากรอกชื่อผู้ใช้' }]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="Username (admin)"
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Password (1150)"
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                className="bg-pink-500 hover:bg-pink-600 border-pink-500 h-12 text-lg font-medium"
              >
                เข้าสู่ระบบ
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default AdminLoginPage;
