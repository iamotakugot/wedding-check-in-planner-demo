// นำเข้า React hooks
import React, { useState, useEffect } from 'react';
// นำเข้า Ant Design components
import { Layout, Card, Form, Input, Button, Typography, Alert, App } from 'antd';
// นำเข้า icons จาก Ant Design
import { UserOutlined, LockOutlined } from '@ant-design/icons';
// นำเข้า Firebase service functions สำหรับ authentication
import { AuthService } from '@/services/firebase/AuthService';
import { logger } from '@/utils/logger';

const { Content } = Layout;
const { Title, Text } = Typography;

// Interface สำหรับ props ของ AdminLoginPage
interface AdminLoginPageProps {
  onLoginSuccess: () => void; // Callback เมื่อ login สำเร็จ
}

// Interface สำหรับ form fields
interface LoginFieldType {
  username?: string; // อีเมล
  password?: string; // รหัสผ่าน
}

// Component สำหรับหน้า Admin Login
const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess }) => {
  // State สำหรับสถานะการโหลด
  const [loading, setLoading] = useState(false);
  // State สำหรับข้อความ error
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // ใช้ message API จาก Ant Design
  const { message } = App.useApp();
  
  // 🔧 DevOps: ถ้ามี Guest login อยู่แล้ว → แสดงข้อความแนะนำให้ logout ก่อน
  useEffect(() => {
    const currentUser = AuthService.getInstance().getCurrentUser();
    if (currentUser) {
      // ตรวจสอบว่าเป็น admin หรือไม่
      AuthService.getInstance().checkIsAdmin(currentUser.uid).then((isAdmin) => {
        if (!isAdmin) {
          // Guest ที่ล็อคอินแล้ว → แสดงข้อความแนะนำ
          setErrorMsg('คุณล็อคอินด้วยบัญชี Guest อยู่ กรุณาลงชื่อออกก่อน หรือใช้บัญชี Admin ในการเข้าสู่ระบบ');
        }
      }).catch(() => {
        // Ignore error - ไม่แสดง error ถ้าตรวจสอบไม่ได้
      });
    }
  }, []);

  // ฟังก์ชันสำหรับจัดการเมื่อ submit form
  const onFinish = async (values: LoginFieldType) => {
    setLoading(true);
    setErrorMsg(null); // Reset error message

    try {
      // ตรวจสอบ input ก่อน
      const email = values.username?.trim() || '';
      const password = values.password || '';

      // ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
      if (!email || !password) {
        const errorMsg = 'กรุณากรอกอีเมลและรหัสผ่าน';
        setErrorMsg(errorMsg);
        message.error(errorMsg);
        setLoading(false);
        return;
      }

      // 🔧 DevOps: ถ้ามี Guest login อยู่แล้ว → logout ก่อน login ด้วย admin account
      const currentUser = AuthService.getInstance().getCurrentUser();
      if (currentUser) {
        const currentIsAdmin = await AuthService.getInstance().checkIsAdmin(currentUser.uid);
        if (!currentIsAdmin) {
          // Guest ที่ล็อคอินแล้ว → logout ก่อน
          logger.log('ℹ️ [Admin Login] Logging out Guest account before admin login');
          await AuthService.getInstance().logout();
        }
      }
      
      // Login ด้วย Firebase
      const user = await AuthService.getInstance().loginWithEmail(email, password);

      // ตรวจสอบว่าเป็น admin หรือไม่
      const isAdmin = await AuthService.getInstance().checkIsAdmin(user.uid);
      
      if (!isAdmin) {
        // ถ้าไม่ใช่ admin ให้ logout และแสดง error
        await AuthService.getInstance().logout();
        const errorMsg = 'บัญชีนี้ไม่มีสิทธิ์เข้าถึง Admin Panel';
        setErrorMsg(errorMsg);
        message.error(errorMsg);
        setLoading(false);
        return;
      }

      // Login สำเร็จ
      message.success('เข้าสู่ระบบสำเร็จ กำลังนำไปยัง Dashboard...');
      setLoading(false);
      onLoginSuccess(); // เรียก callback เพื่อบอก parent component
    } catch (error: unknown) {
      logger.error('Login error:', error);
      
      // แสดง error message ที่เข้าใจง่าย - รองรับ Firebase error codes ทุกเวอร์ชัน
      let errorMessage = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      
      if (error && typeof error === 'object' && 'code' in error) {
        // Firebase Auth error codes - แปลง error code เป็นข้อความภาษาไทย
        switch ((error as { code: string }).code) {
          case 'auth/user-not-found':
            errorMessage = 'ไม่พบผู้ใช้นี้ในระบบ';
            break;
          case 'auth/wrong-password':
            errorMessage = 'รหัสผ่านไม่ถูกต้อง';
            break;
          case 'auth/invalid-email':
            errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
            break;
          case 'auth/invalid-credential': // Firebase v9+ uses this instead of wrong-password
            errorMessage = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'มีการลองล็อคอินผิดพลาดหลายครั้ง กรุณารอสักครู่แล้วลองใหม่';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'เกิดข้อผิดพลาดเกี่ยวกับเครือข่าย กรุณาลองใหม่';
            break;
          case 'auth/user-disabled':
            errorMessage = 'บัญชีนี้ถูกปิดการใช้งาน';
            break;
          case 'auth/weak-password':
            errorMessage = 'รหัสผ่านไม่แข็งแรงพอ';
            break;
          default:
            // ถ้ามี error message ให้ใช้แทน
            if ('message' in error && typeof error.message === 'string') {
              errorMessage = error.message;
            }
        }
      } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        errorMessage = error.message;
      }
      
      setErrorMsg(errorMessage);
      message.error(errorMessage); // แสดง notification เพิ่มเติม
      setLoading(false);
    }
  };

  return (
    <Layout className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Content className="w-full max-w-md p-4">
        <Card className="shadow-lg rounded-xl overflow-hidden" variant="borderless">
          {/* Header section - แสดงชื่อแอปและไอคอน */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 text-pink-600 rounded-full mb-4">
              <UserOutlined style={{ fontSize: '32px' }} />
            </div>
            <Title level={3} style={{ margin: 0, color: '#333' }}>
              Wedding Manager
            </Title>
            <Text type="secondary">ระบบจัดการรายชื่อและที่นั่ง</Text>
          </div>
          {/* แสดง error message - ใช้ closable เพื่อให้ผู้ใช้ปิดได้ */}
          {errorMsg && (
            <Alert 
              message={errorMsg} 
              type="error" 
              showIcon 
              className="mb-6" 
              closable
              onClose={() => setErrorMsg(null)}
            />
          )}
          {/* Login Form */}
          <Form
            layout="vertical"
            onFinish={onFinish}
            size="large"
            onValuesChange={() => {
              // Clear error when user starts typing - ลบ error เมื่อผู้ใช้เริ่มพิมพ์
              if (errorMsg) {
                setErrorMsg(null);
              }
            }}
          >
            {/* Email input field */}
            <Form.Item
              name="username"
              rules={[
                { required: true, message: 'กรุณากรอกอีเมล' },
                { type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' }
              ]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="อีเมล (Email)"
                type="email"
                autoComplete="email"
              />
            </Form.Item>
            {/* Password input field */}
            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'กรุณากรอกรหัสผ่าน' },
                { min: 6, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="รหัสผ่าน (Password)"
                autoComplete="current-password"
              />
            </Form.Item>
            {/* Submit button */}
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                className="bg-pink-500 hover:bg-pink-600 border-pink-500 h-12 text-lg font-medium"
              >
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default AdminLoginPage;
