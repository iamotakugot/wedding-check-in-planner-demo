import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Tag, Button, Modal, Descriptions, message, Space, Avatar } from 'antd';
import { EyeOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import { subscribeRSVPs } from '@/services/firebaseService';
import type { RSVPData } from '@/services/firebaseService';
import type { TableProps } from 'antd';

const { Title, Text } = Typography;

interface RSVPListPageProps {
  onImportToGuests?: (rsvp: RSVPData) => void;
}

const RSVPListPage: React.FC<RSVPListPageProps> = ({ onImportToGuests }) => {
  const [rsvps, setRsvps] = useState<RSVPData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRSVP, setSelectedRSVP] = useState<RSVPData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeRSVPs((data) => {
      setRsvps(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleViewDetails = (rsvp: RSVPData) => {
    setSelectedRSVP(rsvp);
    setModalVisible(true);
  };

  const handleImportToGuests = (rsvp: RSVPData) => {
    if (onImportToGuests) {
      onImportToGuests(rsvp);
      message.success('นำเข้าข้อมูลไปยังรายชื่อแขกแล้ว');
    } else {
      message.info('ฟังก์ชันนำเข้าข้อมูลยังไม่พร้อมใช้งาน');
    }
  };

  const columns: TableProps<RSVPData>['columns'] = [
    {
      title: 'ชื่อ-นามสกุล',
      key: 'name',
      render: (_, record) => (
        <Space>
          <Avatar 
            size="small" 
            icon={<UserOutlined />}
            style={{ backgroundColor: record.isComing === 'yes' ? '#52c41a' : '#8c8c8c' }}
          />
          <div>
            <div className="font-medium">
              {record.firstName} {record.lastName}
            </div>
            {record.nickname && (
              <Text type="secondary" className="text-xs">({record.nickname})</Text>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'ฝ่าย',
      dataIndex: 'side',
      key: 'side',
      render: (side: string) => {
        const sideMap: Record<string, { label: string; color: string }> = {
          groom: { label: 'เจ้าบ่าว', color: 'blue' },
          bride: { label: 'เจ้าสาว', color: 'pink' },
          both: { label: 'ทั้งสองฝ่าย', color: 'purple' },
        };
        const sideInfo = sideMap[side] || { label: side, color: 'default' };
        return <Tag color={sideInfo.color}>{sideInfo.label}</Tag>;
      },
    },
    {
      title: 'ความสัมพันธ์',
      dataIndex: 'relation',
      key: 'relation',
    },
    {
      title: 'สถานะ',
      dataIndex: 'isComing',
      key: 'isComing',
      render: (isComing: string) => (
        <Tag color={isComing === 'yes' ? 'green' : 'red'}>
          {isComing === 'yes' ? 'ยินดีร่วมงาน' : 'ไม่สะดวก'}
        </Tag>
      ),
    },
    {
      title: 'จำนวนคน',
      key: 'attendees',
      render: (_, record) => {
        if (record.isComing === 'no') return <Text type="secondary">-</Text>;
        const total = 1 + (record.accompanyingGuestsCount || 0);
        return (
          <Space>
            <TeamOutlined />
            <Text strong>{total}</Text>
          </Space>
        );
      },
    },
    {
      title: 'วันที่ตอบรับ',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
    {
      title: 'จัดการ',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            ดูรายละเอียด
          </Button>
          {record.isComing === 'yes' && onImportToGuests && (
            record.guestId ? (
              <Tag color="success">นำเข้าแล้ว</Tag>
            ) : (
              <Button
                type="link"
                onClick={() => handleImportToGuests(record)}
              >
                นำเข้า
              </Button>
            )
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div className="mb-6">
        <Title level={2} style={{ margin: 0 }}>
          <TeamOutlined /> รายการตอบรับ
        </Title>
        <Text type="secondary">รายละเอียดการตอบรับจากแขกทั้งหมด</Text>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={rsvps}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `ทั้งหมด ${total} รายการ`,
          }}
        />
      </Card>

      <Modal
        title="รายละเอียดการตอบรับ"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            ปิด
          </Button>,
          selectedRSVP?.isComing === 'yes' && onImportToGuests ? (
            selectedRSVP.guestId ? (
              <Button key="imported" disabled>
                นำเข้าแล้ว
              </Button>
            ) : (
              <Button
                key="import"
                type="primary"
                onClick={() => {
                  if (selectedRSVP) {
                    handleImportToGuests(selectedRSVP);
                    setModalVisible(false);
                  }
                }}
              >
                นำเข้าข้อมูลไปยังรายชื่อแขก
              </Button>
            )
          ) : null,
        ].filter(Boolean)}
        width={700}
      >
        {selectedRSVP && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="ชื่อ-นามสกุล">
              {selectedRSVP.firstName} {selectedRSVP.lastName}
            </Descriptions.Item>
            {selectedRSVP.nickname && (
              <Descriptions.Item label="ชื่อเล่น">
                {selectedRSVP.nickname}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="ฝ่าย">
              <Tag color={selectedRSVP.side === 'groom' ? 'blue' : selectedRSVP.side === 'bride' ? 'pink' : 'purple'}>
                {selectedRSVP.side === 'groom' ? 'เจ้าบ่าว' : selectedRSVP.side === 'bride' ? 'เจ้าสาว' : 'ทั้งสองฝ่าย'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="ความสัมพันธ์">
              {selectedRSVP.relation || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="สถานะ">
              <Tag color={selectedRSVP.isComing === 'yes' ? 'green' : 'red'}>
                {selectedRSVP.isComing === 'yes' ? 'ยินดีร่วมงาน' : 'ไม่สะดวก'}
              </Tag>
            </Descriptions.Item>
            {selectedRSVP.isComing === 'yes' && (
              <>
                <Descriptions.Item label="จำนวนคนทั้งหมด">
                  <Space>
                    <TeamOutlined />
                    <Text strong>{1 + (selectedRSVP.accompanyingGuestsCount || 0)} ท่าน</Text>
                  </Space>
                </Descriptions.Item>
                {selectedRSVP.accompanyingGuests && selectedRSVP.accompanyingGuests.length > 0 && (
                  <Descriptions.Item label="ผู้ติดตาม">
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {selectedRSVP.accompanyingGuests.map((guest, index) => (
                        <li key={index}>
                          {guest.relationToMain} {guest.name ? `(${guest.name})` : ''}
                        </li>
                      ))}
                    </ul>
                  </Descriptions.Item>
                )}
              </>
            )}
            {selectedRSVP.note && (
              <Descriptions.Item label="หมายเหตุ">
                {selectedRSVP.note}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="วันที่ตอบรับ">
              {selectedRSVP.createdAt
                ? new Date(selectedRSVP.createdAt).toLocaleString('th-TH')
                : '-'}
            </Descriptions.Item>
            {selectedRSVP.updatedAt && selectedRSVP.updatedAt !== selectedRSVP.createdAt && (
              <Descriptions.Item label="แก้ไขล่าสุด">
                {new Date(selectedRSVP.updatedAt).toLocaleString('th-TH')}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default RSVPListPage;

