import React, { useState } from 'react';
import { Card, Button, Space, Typography, Spin } from 'antd';
import {
  FacebookFilled,
  GoogleCircleFilled,
  SmileOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';
import { AuthUser } from '@/types';
import { getFirebaseAuth, googleProvider, facebookProvider, lineProvider } from '@/firebase';
import { signInWithPopup } from 'firebase/auth';

const { Title, Text } = Typography;

interface AuthGateSectionProps {
  onAuthSuccess: (user: AuthUser) => void;
}

const generateMockAuthUser = (provider: string): AuthUser => {
  let firstName, lastName, nickname;
  switch (provider) {
    case 'Facebook':
      firstName = 'ธนากร';
      lastName = 'สุขใจ';
      nickname = 'เติ้ล';
      break;
    case 'Line':
      firstName = 'ณิชา';
      lastName = 'มีสกุล';
      nickname = 'นิดหน่อย';
      break;
    case 'Google':
      firstName = 'จิรายุ';
      lastName = 'รักการงาน';
      nickname = 'เจมส์';
      break;
    default:
      firstName = '';
      lastName = '';
      nickname = '';
  }
  const id = `${provider.toLowerCase()}-${firstName}-${lastName}`;
  return { id, firstName, lastName, nickname };
};

const AuthGateSection: React.FC<AuthGateSectionProps> = ({ onAuthSuccess }) => {
  const [authLoading, setAuthLoading] = useState(false);

  const handleFirebaseSignIn = async (provider: 'Google' | 'Facebook' | 'Line') => {
    const auth = getFirebaseAuth();
    if (!auth) return simulateAuth(provider);
    setAuthLoading(true);
    try {
      const prov =
        provider === 'Google' ? googleProvider :
        provider === 'Facebook' ? facebookProvider :
        lineProvider;
      const cred = await signInWithPopup(auth, prov as any);
      const user = cred.user;
      const displayName = user.displayName || '';
      const [firstName = '', lastName = ''] = displayName.split(' ');
      const nickname = (user.email || '').split('@')[0] || firstName || 'Guest';
      const authUser: AuthUser = {
        id: user.uid,
        firstName,
        lastName,
        nickname,
      };
      onAuthSuccess(authUser);
    } catch {
      // fallback to mock if sign-in fails
      simulateAuth(provider);
    } finally {
      setAuthLoading(false);
    }
  };

  const simulateAuth = (provider: string) => {
    setAuthLoading(true);
    const mockUser = generateMockAuthUser(provider);
    setTimeout(() => {
      setAuthLoading(false);
      onAuthSuccess(mockUser);
    }, 800);
  };

  return (
    <Card className="w-full shadow-none border-none bg-transparent text-center p-4">
      <UsergroupAddOutlined style={{ fontSize: 48, color: '#f97316' }} />
      <Title level={3} className="mt-4 mb-2 text-gray-700">
        ยืนยันตัวตนเพื่อลงทะเบียน
      </Title>
      <Text type="secondary" className="block mb-8 text-lg">
        กรุณาเลือกช่องทางที่คุณสะดวก <br /> ระบบจะช่วยดึงข้อมูลชื่อของคุณให้อัตโนมัติ
      </Text>
      <Space direction="vertical" size="middle" className="w-full max-w-xs mx-auto">
        <Button
          block
          size="large"
          disabled={authLoading}
          onClick={() => handleFirebaseSignIn('Facebook')}
          icon={<FacebookFilled />}
          className="h-12 bg-[#1877f2] text-white border-none hover:bg-[#166fe5]"
        >
          เข้าสู่ระบบด้วย Facebook
        </Button>
        <Button
          block
          size="large"
          disabled={authLoading}
          onClick={() => handleFirebaseSignIn('Line')}
          icon={<SmileOutlined />}
          className="h-12 bg-[#06c755] text-white border-none hover:bg-[#05b64d]"
        >
          เข้าสู่ระบบด้วย Line
        </Button>
        <Button
          block
          size="large"
          disabled={authLoading}
          onClick={() => handleFirebaseSignIn('Google')}
          icon={<GoogleCircleFilled />}
          className="h-12 bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
        >
          เข้าสู่ระบบด้วย Google
        </Button>
      </Space>
      <div className="mt-8">
        <Spin spinning={authLoading} tip="กำลังดึงข้อมูล..." size="large">
          <div style={{ width: 1, height: 1 }} />
        </Spin>
      </div>
    </Card>
  );
};

export default AuthGateSection;
