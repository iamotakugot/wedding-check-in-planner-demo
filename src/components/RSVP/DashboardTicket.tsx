import React from 'react';
import { Card, Button, Space, Typography, Tag } from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  UsergroupAddOutlined,
  LogoutOutlined,
  UpOutlined,
  SnippetsOutlined,
} from '@ant-design/icons';
import { RSVPData } from '@/types';

const { Title, Text } = Typography;

interface DashboardTicketProps {
  data: RSVPData;
  onEditPersonal: () => void;
  onEditGuests: () => void;
  onLogout: () => void;
  onScrollTop: () => void;
}

const DashboardTicket: React.FC<DashboardTicketProps> = ({
  data,
  onEditPersonal,
  onEditGuests,
  onLogout,
  onScrollTop,
}) => {
  const isComing = data.isComing === 'yes';

  return (
    <div className="w-full max-w-md mx-auto pt-6">
      <Card
        className="shadow-xl rounded-3xl overflow-hidden border-none mb-6"
        bodyStyle={{ padding: 0 }}
      >
        {/* Status Header */}
        <div
          className={`p-8 text-center ${
            isComing
              ? 'bg-gradient-to-br from-green-400 to-green-600'
              : 'bg-gray-400'
          }`}
        >
          {isComing ? (
            <CheckCircleOutlined style={{ fontSize: 56, color: 'white' }} />
          ) : (
            <ExclamationCircleOutlined style={{ fontSize: 56, color: 'white' }} />
          )}
          <Title level={3} style={{ color: 'white', margin: '16px 0 4px' }}>
            {isComing ? 'ยืนยันเข้าร่วมงาน' : 'ไม่สามารถเข้าร่วม'}
          </Title>
          <Text className="text-white/90 text-lg">
            {isComing ? 'ขอบคุณที่มาร่วมเป็นสักขีพยาน' : 'ไว้โอกาสหน้าเจอกันครับ'}
          </Text>
        </div>

        {/* Ticket Body */}
        <div className="p-6 bg-white relative">
          <div className="absolute top-[-12px] left-[-12px] w-6 h-6 bg-gray-50 rounded-full"></div>
          <div className="absolute top-[-12px] right-[-12px] w-6 h-6 bg-gray-50 rounded-full"></div>

          <div className="text-center mb-8">
            <Title level={3} style={{ margin: 0 }}>
              {data.firstName} {data.lastName}
            </Title>
            <Text type="secondary" className="text-lg">
              ({data.nickname})
            </Text>
            <div className="mt-4 flex justify-center gap-2">
              <Tag
                color={data.side === 'groom' ? 'blue' : 'magenta'}
                className="text-base py-1 px-3 rounded-md"
              >
                {data.side === 'groom' ? 'ฝ่ายเจ้าบ่าว' : 'ฝ่ายเจ้าสาว'}
              </Tag>
              {data.relation && (
                <Tag className="text-base py-1 px-3 rounded-md">{data.relation}</Tag>
              )}
            </div>
          </div>

          {isComing && (
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 mb-8">
              <div className="flex justify-between items-center mb-3">
                <Text className="text-gray-500">
                  <UsergroupAddOutlined /> ผู้ติดตาม:
                </Text>
                <Text strong className="text-lg">
                  {data.accompanyingGuestsCount} ท่าน
                </Text>
              </div>
              {data.accompanyingGuests.length > 0 && (
                <div className="pl-4 border-l-4 border-gray-200 text-gray-600 space-y-1 mb-4">
                  {data.accompanyingGuests.map((g, idx) => (
                    <div key={idx}>
                      • {g.name}{' '}
                      <span className="text-gray-400 text-xs">({g.relationToMain})</span>
                    </div>
                  ))}
                </div>
              )}
              {data.note && (
                <div className="pt-3 border-t border-gray-200">
                  <Text type="secondary" className="block mb-1 text-xs uppercase tracking-wider">
                    หมายเหตุ / อาหาร
                  </Text>
                  <Text className="text-red-500 font-medium">
                    <SnippetsOutlined /> {data.note}
                  </Text>
                </div>
              )}
            </div>
          )}

          <Space direction="vertical" className="w-full" size="small">
            {/* ปุ่มจัดการข้อมูล */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              <Button
                type="default"
                block
                size="large"
                icon={<EditOutlined />}
                onClick={onEditPersonal}
                className="h-12 rounded-xl border-gray-300 text-gray-600 hover:text-blue-600 hover:border-blue-600"
              >
                แก้ไขข้อมูล
              </Button>
              <Button
                type="dashed"
                block
                size="large"
                icon={<UsergroupAddOutlined />}
                onClick={onEditGuests}
                className="h-12 rounded-xl border-gray-400 text-gray-600 hover:text-green-600 hover:border-green-600 bg-gray-50 hover:bg-white"
              >
                + ผู้ติดตาม
              </Button>
            </div>

            {/* ปุ่มดูการ์ด */}
            <Button
              type="primary"
              block
              size="large"
              icon={<UpOutlined />}
              onClick={onScrollTop}
              className="h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 border-none shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              กลับไปดูรายละเอียดการ์ดเชิญ
            </Button>

            {/* ปุ่มออกจากระบบ */}
            <div className="text-center mt-4">
              <Button
                type="text"
                size="small"
                danger
                icon={<LogoutOutlined />}
                onClick={onLogout}
                className="text-gray-400 hover:text-red-500"
              >
                ออกจากระบบ
              </Button>
            </div>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default DashboardTicket;
