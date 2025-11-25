/**
 * Admin RSVPs Page
 * แสดงรายการ RSVP
 */

import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, Descriptions, Space, Avatar, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons';
import { useRSVPs } from '@/hooks/useRSVPs';
import { RSVPData } from '@/types';

// Custom Search component to avoid Input.Search addonAfter warning
const CustomSearch: React.FC<{
  placeholder?: string;
  allowClear?: boolean;
  style?: React.CSSProperties;
  onSearch?: (value: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
}> = ({ placeholder, allowClear, style, onSearch, onChange, value }) => {
  const [searchValue, setSearchValue] = useState(value || '');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    if (onChange) {
      onChange(e);
    }
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchValue);
    }
  };

  const handleClear = () => {
    setSearchValue('');
    if (onSearch) {
      onSearch('');
    }
  };

  useEffect(() => {
    if (value !== undefined) {
      setSearchValue(value);
    }
  }, [value]);

  return (
    <Space.Compact style={style}>
      <Input
        placeholder={placeholder}
        value={searchValue}
        onChange={handleChange}
        onPressEnter={handleSearch}
        allowClear={allowClear}
        onClear={handleClear}
        style={{ flex: 1 }}
      />
      <Button icon={<SearchOutlined />} onClick={handleSearch} />
    </Space.Compact>
  );
};

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
      width: 200,
      fixed: 'left' as const,
      render: (_, record) => (
        <Space>
          <Avatar
            size="small"
            src={record.photoURL || undefined}
            icon={!record.photoURL && <UserOutlined />}
            style={{ 
              backgroundColor: record.isComing === 'yes' ? '#52c41a' : '#8c8c8c' 
            }}
          />
          <div className="min-w-0">
            <div className="font-medium text-sm md:text-base truncate" title={`${record.firstName} ${record.lastName}`}>
              {record.firstName} {record.lastName}
            </div>
            {record.nickname && (
              <span className="text-xs text-gray-500 truncate block" title={record.nickname}>
                ({record.nickname})
              </span>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'ฝ่าย',
      dataIndex: 'side',
      width: 100,
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
      width: 150,
      render: (relation: string) => (
        <span className="truncate block" title={relation}>
          {relation}
        </span>
      ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'isComing',
      width: 120,
      render: (isComing: string) => (
        <Tag color={isComing === 'yes' ? 'green' : 'red'}>
          {isComing === 'yes' ? 'ยินดีร่วมงาน' : 'ไม่สะดวก'}
        </Tag>
      ),
    },
    {
      title: 'จำนวนคน',
      key: 'attendees',
      width: 100,
      align: 'center' as const,
      render: (_, record) => {
        if (record.isComing !== 'yes') return '-';
        const total = 1 + (record.accompanyingGuestsCount || 0);
        return <span className="font-medium">{total}</span>;
      },
    },
    {
      title: 'เวลาแก้ไข',
      key: 'updatedAt',
      width: 180,
      render: (_, record) => {
        if (!record.updatedAt) return '-';
        try {
          const date = new Date(record.updatedAt);
          const formattedDate = date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });
          const formattedTime = date.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          return (
            <span className="text-xs text-gray-600" title={date.toLocaleString('th-TH')}>
              {formattedDate} {formattedTime}
            </span>
          );
        } catch (error) {
          return <span className="text-xs text-gray-400">-</span>;
        }
      },
    },
    {
      title: 'จัดการ',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => {
            setSelectedRSVP(record);
            setModalVisible(true);
          }}
        >
          <span className="hidden md:inline">ดูรายละเอียด</span>
          <span className="md:hidden">ดู</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">ตอบรับ</h1>
        <CustomSearch
          placeholder="ค้นหาชื่อ-นามสกุล"
          allowClear
          style={{ width: '100%', maxWidth: 300 }}
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
        scroll={{ x: 'max-content' }}
        className="shadow-sm"
      />

      <Modal
        title="รายละเอียด RSVP"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedRSVP(null);
        }}
        footer={null}
        width="90%"
        style={{ maxWidth: 600 }}
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

