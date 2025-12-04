import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, Descriptions, Space, Avatar, Input, Tooltip, Typography, List, Card, Grid } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, UserOutlined, SearchOutlined, PhoneOutlined, ManOutlined, WomanOutlined } from '@ant-design/icons';
import { useRSVPs } from '@/hooks/useRSVPs';
import { useGuests } from '@/hooks/useGuests';
import { useTables } from '@/hooks/useTables';
import { RSVPData } from '@/types';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

dayjs.locale('th');

const { Text } = Typography;

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

const { useBreakpoint } = Grid;

const RSVPsPage: React.FC = () => {
  const screens = useBreakpoint();
  const { rsvps, isLoading: rsvpsLoading } = useRSVPs();
  const { guests, isLoading: guestsLoading } = useGuests();
  const { tables, isLoading: tablesLoading } = useTables();
  const isLoading = rsvpsLoading || guestsLoading || tablesLoading;
  const [selectedRSVP, setSelectedRSVP] = useState<RSVPData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');


  const filteredRSVPs = rsvps.filter(rsvp => {
    if (!searchText) return true;
    const fullName = `${rsvp.firstName} ${rsvp.lastName}`.toLowerCase();
    const phone = rsvp.phoneNumber || '';
    const nickname = rsvp.nickname || '';
    const search = searchText.toLowerCase();
    return fullName.includes(search) || phone.includes(search) || nickname.toLowerCase().includes(search);
  });

  // Prepare filter options
  const relationFilters = Array.from(new Set(rsvps.map(r => r.relation).filter(Boolean))).map(r => ({ text: r, value: r }));
  const tableFilters = Array.from(new Set(
    rsvps.map(r => {
      const guest = guests.find(g => g.rsvpId === r.id || g.rsvpUid === r.uid);
      if (!guest?.tableId) return 'ยังไม่จัดโต๊ะ';
      const table = tables.find(t => t.tableId === guest.tableId);
      return table ? table.tableName : 'Unknown Table';
    })
  )).map(t => ({ text: t, value: t }));

  const columns: ColumnsType<RSVPData> = [
    {
      title: '#',
      key: 'index',
      width: 60,
      align: 'center',
      fixed: 'left' as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'เวลาตอบรับ',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      sorter: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      render: (date: string) => (
        <div className="flex flex-col text-xs">
          <span>{dayjs(date).format('DD/MM/YYYY')}</span>
          <span className="text-gray-500">{dayjs(date).format('HH:mm')}</span>
        </div>
      ),
    },
    {
      title: 'ผู้ร่วมงาน',
      key: 'name',
      width: 250,
      fixed: 'left' as const,
      sorter: (a, b) => a.firstName.localeCompare(b.firstName),
      render: (_, record) => (
        <Space size="middle">
          <Avatar
            size="large"
            src={record.photoURL || undefined}
            icon={!record.photoURL && <UserOutlined />}
            className={record.isComing === 'yes' ? 'bg-green-500' : 'bg-gray-400'}
          />
          <div className="flex flex-col">
            <Text strong className="text-base">
              {record.firstName} {record.lastName}
            </Text>
            <Space size="small">
              {record.nickname && (
                <Tag color="default" className="mr-0 text-xs">
                  {record.nickname}
                </Tag>
              )}
              {record.side === 'groom' ? (
                <Tag icon={<ManOutlined />} color="blue" className="mr-0 text-xs">เจ้าบ่าว</Tag>
              ) : (
                <Tag icon={<WomanOutlined />} color="magenta" className="mr-0 text-xs">เจ้าสาว</Tag>
              )}
            </Space>
          </div>
        </Space>
      ),
    },
    {
      title: 'เบอร์โทรศัพท์',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: 150,
      render: (phone: string | undefined) => {
        if (!phone) return <Text type="secondary">-</Text>;
        return (
          <Space>
            <PhoneOutlined className="text-gray-400" />
            <Text copyable>{phone}</Text>
            <Tooltip title="โทรออก">
              <Button
                type="link"
                size="small"
                icon={<PhoneOutlined />}
                href={`tel:${phone}`}
                className="text-green-600 hover:text-green-700"
              />
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: 'ความสัมพันธ์',
      dataIndex: 'relation',
      width: 120,
      filters: relationFilters,
      onFilter: (value, record) => record.relation === value,
      render: (relation: string) => (
        <Tag color="purple">{relation}</Tag>
      ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'isComing',
      width: 120,
      filters: [
        { text: 'ยินดีร่วมงาน', value: 'yes' },
        { text: 'ไม่สะดวก', value: 'no' },
      ],
      onFilter: (value, record) => record.isComing === value,
      render: (isComing: string) => (
        <Tag color={isComing === 'yes' ? 'success' : 'error'} className="px-3 py-1 text-sm rounded-full">
          {isComing === 'yes' ? 'ยินดีร่วมงาน' : 'ไม่สะดวก'}
        </Tag>
      ),
    },
    {
      title: 'ฝ่าย',
      dataIndex: 'side',
      width: 100,
      filters: [
        { text: 'เจ้าบ่าว', value: 'groom' },
        { text: 'เจ้าสาว', value: 'bride' },
      ],
      onFilter: (value, record) => record.side === value,
      render: (side: string) => (
        <Tag color={side === 'groom' ? 'blue' : 'magenta'}>
          {side === 'groom' ? 'เจ้าบ่าว' : 'เจ้าสาว'}
        </Tag>
      ),
    },
    {
      title: 'โต๊ะ',
      key: 'table',
      width: 150,
      filters: tableFilters,
      onFilter: (value, record) => {
        const guest = guests.find(g => g.rsvpId === record.id || g.rsvpUid === record.uid);
        if (!guest?.tableId) return value === 'ยังไม่จัดโต๊ะ';
        const table = tables.find(t => t.tableId === guest.tableId);
        return (table ? table.tableName : 'Unknown Table') === value;
      },
      render: (_, record) => {
        const guest = guests.find(g => g.rsvpId === record.id || g.rsvpUid === record.uid);
        if (!guest?.tableId) return <Text type="secondary">-</Text>;
        const table = tables.find(t => t.tableId === guest.tableId);
        return table ? <Tag color="geekblue">{table.tableName}</Tag> : <Text type="secondary">-</Text>;
      },
    },
    {
      title: 'ผู้ติดตาม',
      key: 'attendees',
      width: 100,
      align: 'center' as const,
      sorter: (a, b) => (a.accompanyingGuestsCount || 0) - (b.accompanyingGuestsCount || 0),
      render: (_, record) => {
        if (record.isComing !== 'yes') return '-';
        const total = 1 + (record.accompanyingGuestsCount || 0);
        return (
          <Space direction="vertical" size={0}>
            <Text strong className="text-lg">{total}</Text>
            <Text type="secondary" className="text-xs">ท่าน</Text>
          </Space>
        );
      },
    },
    {
      title: 'จัดการ',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          icon={<EyeOutlined />}
          size="small"
          onClick={() => {
            setSelectedRSVP(record);
            setModalVisible(true);
          }}
        >
          ดู
        </Button>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 m-0">รายการตอบรับ (RSVP)</h1>
            <Text type="secondary">จัดการและตรวจสอบรายชื่อผู้ตอบรับเข้าร่วมงาน</Text>
          </div>
          <div className="w-full md:w-80">
            <CustomSearch
              placeholder="ค้นหาชื่อ, เบอร์โทร, หรือชื่อเล่น"
              allowClear
              style={{ width: '100%' }}
              onSearch={setSearchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        {!screens.md ? (
          <List
            grid={{ gutter: 16, column: 1 }}
            dataSource={filteredRSVPs}
            renderItem={(item) => (
              <List.Item>
                <Card
                  actions={[
                    <Button type="link" icon={<PhoneOutlined />} href={`tel:${item.phoneNumber}`} disabled={!item.phoneNumber}>โทร</Button>,
                    <Button type="link" icon={<EyeOutlined />} onClick={() => { setSelectedRSVP(item); setModalVisible(true); }}>ดู</Button>
                  ]}
                >
                  <Card.Meta
                    avatar={
                      <Avatar
                        size="large"
                        src={item.photoURL}
                        icon={!item.photoURL && <UserOutlined />}
                        className={item.isComing === 'yes' ? 'bg-green-500' : 'bg-gray-400'}
                      />
                    }
                    title={
                      <div className="flex justify-between items-start">
                        <span className="truncate pr-2">{item.firstName} {item.lastName}</span>
                        <Tag color={item.isComing === 'yes' ? 'success' : 'error'} className="mr-0 shrink-0">
                          {item.isComing === 'yes' ? 'มา' : 'ไม่มา'}
                        </Tag>
                      </div>
                    }
                    description={
                      <Space direction="vertical" size={0} className="w-full">
                        <Space size={4} wrap>
                          {item.nickname && <Tag className="m-0">{item.nickname}</Tag>}
                          <Tag color={item.side === 'groom' ? 'blue' : 'magenta'} className="m-0">
                            {item.side === 'groom' ? 'เจ้าบ่าว' : 'เจ้าสาว'}
                          </Tag>
                        </Space>
                        {item.isComing === 'yes' && (
                          <Text type="secondary" className="text-xs mt-1 block">
                            ผู้ติดตาม: {item.accompanyingGuestsCount || 0} ท่าน
                          </Text>
                        )}
                      </Space>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredRSVPs}
            rowKey="id"
            loading={isLoading}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => `ทั้งหมด ${total} รายการ`,
            }}
            scroll={{ x: 1000 }}
            className="border border-gray-100 rounded-lg overflow-hidden"
          />
        )}
      </div>

      <Modal
        title={
          <Space>
            <UserOutlined />
            <span>รายละเอียดการตอบรับ</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedRSVP(null);
        }}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            ปิด
          </Button>
        ]}
        width={600}
        centered
      >
        {selectedRSVP && (
          <div className="py-4">
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <Avatar
                size={64}
                src={selectedRSVP.photoURL || undefined}
                icon={!selectedRSVP.photoURL && <UserOutlined />}
                className={selectedRSVP.isComing === 'yes' ? 'bg-green-500' : 'bg-gray-400'}
              />
              <div>
                <h3 className="text-xl font-bold m-0 text-gray-800">
                  {selectedRSVP.firstName} {selectedRSVP.lastName}
                </h3>
                <Space className="mt-1">
                  {selectedRSVP.nickname && <Tag>{selectedRSVP.nickname}</Tag>}
                  <Tag color={selectedRSVP.side === 'groom' ? 'blue' : 'magenta'}>
                    {selectedRSVP.side === 'groom' ? 'ฝั่งเจ้าบ่าว' : 'ฝั่งเจ้าสาว'}
                  </Tag>
                </Space>
              </div>
            </div>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="เบอร์โทรศัพท์">
                {selectedRSVP.phoneNumber ? (
                  <Space>
                    <PhoneOutlined />
                    <Text copyable>{selectedRSVP.phoneNumber}</Text>
                    <Button type="link" size="small" href={`tel:${selectedRSVP.phoneNumber}`}>โทรออก</Button>
                  </Space>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="สถานะ">
                <Tag color={selectedRSVP.isComing === 'yes' ? 'green' : 'red'}>
                  {selectedRSVP.isComing === 'yes' ? 'ยินดีร่วมงาน' : 'ไม่สะดวก'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="ความสัมพันธ์">
                {selectedRSVP.relation}
              </Descriptions.Item>
              <Descriptions.Item label="จำนวนผู้ร่วมงาน">
                {selectedRSVP.isComing === 'yes' ? `${1 + (selectedRSVP.accompanyingGuestsCount || 0)} ท่าน` : '-'}
              </Descriptions.Item>
              {selectedRSVP.accompanyingGuests && selectedRSVP.accompanyingGuests.length > 0 && (
                <Descriptions.Item label="รายชื่อผู้ติดตาม">
                  <ul className="list-disc pl-4 m-0">
                    {selectedRSVP.accompanyingGuests.map((guest, index) => (
                      <li key={index} className="text-gray-600">
                        {guest.name} <span className="text-gray-400">({guest.relationToMain})</span>
                      </li>
                    ))}
                  </ul>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="หมายเหตุ">
                {selectedRSVP.note || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="วันที่ตอบรับ">
                {selectedRSVP.createdAt ? new Date(selectedRSVP.createdAt).toLocaleString('th-TH') : '-'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RSVPsPage;

