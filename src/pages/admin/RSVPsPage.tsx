/**
 * Admin RSVPs Page
 * แสดงรายการ RSVP
 */

import React, { useState } from 'react';
import { Table, Tag, Button, Modal, Descriptions, Space, Avatar, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, UserOutlined } from '@ant-design/icons';
import { useRSVPs } from '@/hooks/useRSVPs';
import { RSVPData } from '@/types';

const { Search } = Input;

const RSVPsPage: React.FC = () => {
  const { rsvps, isLoading } = useRSVPs();
  const [selectedRSVP, setSelectedRSVP] = useState<RSVPData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filteredRSVPs = rsvps.filter(rsvp => {
    if (!searchText) return true;
    const fullName = `${rsvp.firstName} ${rsvp.lastName}`.toLowerCase();
    return fullName.includes(searchText.toLowerCase());
  });

  const columns: ColumnsType<RSVPData> = [
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
              <span className="text-xs text-gray-500">({record.nickname})</span>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'ฝ่าย',
      dataIndex: 'side',
      render: (side: string) => {
        switch (side) {
          case 'groom':
            return <Tag color="blue">เจ้าบ่าว</Tag>;
          case 'bride':
            return <Tag color="pink">เจ้าสาว</Tag>;
          default:
            return <Tag>{side}</Tag>;
        }
      },
    },
    {
      title: 'ความสัมพันธ์',
      dataIndex: 'relation',
    },
    {
      title: 'สถานะ',
      dataIndex: 'isComing',
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
        if (record.isComing !== 'yes') return '-';
        const total = 1 + (record.accompanyingGuestsCount || 0);
        return total;
      },
    },
    {
      title: 'จัดการ',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedRSVP(record);
            setModalVisible(true);
          }}
        >
          ดูรายละเอียด
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">รายการ RSVP</h1>
        <Search
          placeholder="ค้นหา RSVP"
          allowClear
          style={{ width: 300 }}
          onSearch={setSearchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredRSVPs}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title="รายละเอียด RSVP"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedRSVP(null);
        }}
        footer={null}
        width={600}
      >
        {selectedRSVP && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="ชื่อ-นามสกุล">
              {selectedRSVP.firstName} {selectedRSVP.lastName}
            </Descriptions.Item>
            <Descriptions.Item label="ชื่อเล่น">
              {selectedRSVP.nickname || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="ฝ่าย">
              {selectedRSVP.side === 'groom' ? 'เจ้าบ่าว' : 'เจ้าสาว'}
            </Descriptions.Item>
            <Descriptions.Item label="ความสัมพันธ์">
              {selectedRSVP.relation}
            </Descriptions.Item>
            <Descriptions.Item label="สถานะ">
              <Tag color={selectedRSVP.isComing === 'yes' ? 'green' : 'red'}>
                {selectedRSVP.isComing === 'yes' ? 'ยินดีร่วมงาน' : 'ไม่สะดวก'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="จำนวนคน">
              {selectedRSVP.isComing === 'yes' ? 1 + (selectedRSVP.accompanyingGuestsCount || 0) : '-'}
            </Descriptions.Item>
            {selectedRSVP.accompanyingGuests && selectedRSVP.accompanyingGuests.length > 0 && (
              <Descriptions.Item label="ผู้ติดตาม">
                <ul>
                  {selectedRSVP.accompanyingGuests.map((guest, index) => (
                    <li key={index}>
                      {guest.name} ({guest.relationToMain})
                    </li>
                  ))}
                </ul>
              </Descriptions.Item>
            )}
            {selectedRSVP.note && (
              <Descriptions.Item label="หมายเหตุ">
                {selectedRSVP.note}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="วันที่สร้าง">
              {selectedRSVP.createdAt ? new Date(selectedRSVP.createdAt).toLocaleString('th-TH') : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default RSVPsPage;

