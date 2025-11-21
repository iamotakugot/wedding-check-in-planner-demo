import React, { useState, useMemo } from 'react';
import {
  Card,
  Input,
  Button,
  Table,
  Space,
  Select,
  Typography,
  Tag,
  Popconfirm,
  Empty,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { TableProps } from 'antd';
import { message } from 'antd';
import { Guest, Zone, TableData, Side } from '@/types';
import { MOCK_SIDE_OPTIONS } from '@/data/mockData';
import GuestFormDrawer from '@/pages/GuestListPage/components/GuestFormDrawer';
import { createGuest, updateGuest, deleteGuest } from '@/services/firebaseService';

const { Title, Text } = Typography;
const { Search } = Input;

interface GuestListPageProps {
  guests: Guest[];
  setGuests: React.Dispatch<React.SetStateAction<Guest[]>>;
  zones: Zone[];
  tables: TableData[];
}

const GuestListPage: React.FC<GuestListPageProps> = ({
  guests,
  setGuests,
  zones,
  tables,
}) => {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedSide, setSelectedSide] = useState<Side | 'all'>('all');
  const [selectedZone, setSelectedZone] = useState<string | 'all'>('all');

  const filteredGuests = useMemo(() => {
    let result = guests;

    if (selectedSide !== 'all') {
      result = result.filter((guest) => guest.side === selectedSide);
    }
    if (selectedZone !== 'all') {
      result = result.filter((guest) => guest.zoneId === selectedZone);
    }
    if (searchText) {
      const lowerCaseSearch = searchText.toLowerCase();
      result = result.filter(
        (guest) =>
          guest.firstName.toLowerCase().includes(lowerCaseSearch) ||
          guest.lastName.toLowerCase().includes(lowerCaseSearch) ||
          guest.relationToCouple.toLowerCase().includes(lowerCaseSearch),
      );
    }

    return result;
  }, [guests, selectedSide, selectedZone, searchText]);

  const handleOpenDrawer = (guest?: Guest) => {
    setEditingGuest(guest || null);
    setIsDrawerVisible(true);
  };

  const handleFormSubmit = async (guest: Guest) => {
    try {
      if (editingGuest) {
        await updateGuest(guest.id, guest);
        setGuests(guests.map((g) => (g.id === guest.id ? guest : g)));
        message.success('อัพเดทข้อมูลแขกเรียบร้อย');
      } else {
        await createGuest(guest);
        setGuests([...guests, guest]);
        message.success('เพิ่มแขกเรียบร้อย');
      }
      setIsDrawerVisible(false);
    } catch (error) {
      console.error('Error saving guest:', error);
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGuest(id);
      setGuests(guests.filter((g) => g.id !== id));
      message.success('ลบแขกเรียบร้อย');
    } catch (error) {
      console.error('Error deleting guest:', error);
      message.error('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const getSideTag = (side: Side) => {
    switch (side) {
      case 'groom':
        return <Tag color="blue">ฝ่ายเจ้าบ่าว</Tag>;
      case 'bride':
        return <Tag color="magenta">ฝ่ายเจ้าสาว</Tag>;
      case 'both':
        return <Tag color="purple">แขกทั้งคู่</Tag>;
      default:
        return <Tag>ไม่ระบุ</Tag>;
    }
  };

  const columns: TableProps<Guest>['columns'] = [
    {
      title: '#ID',
      dataIndex: 'id',
      key: 'id',
      fixed: 'left',
      width: 80,
      render: (id) => <Text copyable>{id}</Text>,
      responsive: ['md'],
    },
    {
      title: 'ชื่อ-นามสกุล',
      key: 'name',
      fixed: 'left',
      render: (_, record) => (
        <Text strong>
          {record.firstName} {record.lastName}
        </Text>
      ),
      width: 180,
    },
    {
      title: 'ความสัมพันธ์',
      dataIndex: 'relationToCouple',
      key: 'relationToCouple',
      ellipsis: true,
      width: 180,
    },
    {
      title: 'ฝ่าย',
      dataIndex: 'side',
      key: 'side',
      render: getSideTag,
      width: 120,
    },
    {
      title: 'ที่นั่ง',
      key: 'seating',
      width: 150,
      render: (_, record) => {
        const zone = zones.find((z) => z.zoneId === record.zoneId);
        const table = tables.find((t) => t.tableId === record.tableId);
        return (
          <div>
            {zone ? (
              <Tag color="volcano">{zone.zoneName}</Tag>
            ) : (
              <Tag color="default">ยังไม่จัด</Tag>
            )}
            {table && <Tag color="cyan">{table.tableName}</Tag>}
          </div>
        );
      },
    },
    {
      title: 'หมายเหตุ',
      dataIndex: 'note',
      key: 'note',
      responsive: ['lg'],
      ellipsis: true,
      render: (note) => (note ? <Text type="secondary">{note}</Text> : '-'),
    },
    {
      title: 'จัดการ',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleOpenDrawer(record)}
            size="small"
          />
          <Popconfirm
            title="ยืนยันการลบ?"
            description={`คุณต้องการลบ ${record.firstName} ${record.lastName} ใช่หรือไม่?`}
            onConfirm={() => handleDelete(record.id)}
            okText="ลบ"
            cancelText="ยกเลิก"
            placement="topRight"
          >
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const zoneOptions = zones.map((z) => ({ value: z.zoneId, label: z.zoneName }));

  return (
    <div className="p-4 md:p-6">
      <Title level={2} className="mb-6">
        จัดการรายชื่อคนเข้างาน
      </Title>

      {/* Search and Filter Row */}
      <Card className="shadow-sm mb-6" variant="borderless">
        <Space.Compact block style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <Space.Compact style={{ flex: 1, minWidth: 200 }}>
            <Search
              placeholder="ค้นหา: ชื่อ, นามสกุล, ความสัมพันธ์"
              allowClear
              size="large"
              onSearch={setSearchText}
              onChange={(e) => setSearchText(e.target.value)}
              enterButton={<SearchOutlined />}
            />
          </Space.Compact>
          <Select
            defaultValue="all"
            style={{ width: 150 }}
            size="large"
            onChange={(value: Side | 'all') => setSelectedSide(value)}
            options={[{ value: 'all', label: '--- ทุกฝ่าย ---' }, ...MOCK_SIDE_OPTIONS]}
          />
          <Select
            defaultValue="all"
            style={{ width: 150 }}
            size="large"
            onChange={(value: string | 'all') => setSelectedZone(value)}
            options={[{ value: 'all', label: '--- ทุกโซน ---' }, ...zoneOptions]}
          />
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => handleOpenDrawer()}
            className="bg-pink-500 hover:bg-pink-600 border-pink-500"
          >
            เพิ่มแขกใหม่
          </Button>
        </Space.Compact>
      </Card>

      {/* Guest Table */}
      <Card variant="borderless" className="shadow-sm">
        <Table
          columns={columns}
          dataSource={filteredGuests}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1200 }}
          locale={{ emptyText: <Empty description="ไม่พบรายชื่อแขกที่ตรงตามเงื่อนไข" /> }}
          summary={() => (
            <Table.Summary fixed="top">
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={7}>
                  <Text strong>
                    สรุป: พบแขกทั้งหมด {filteredGuests.length} ราย (จาก {guests.length} รายชื่อ)
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      {/* Drawer for Add/Edit Form */}
      <GuestFormDrawer
        visible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        guestToEdit={editingGuest}
        onSubmit={handleFormSubmit}
        zones={zones}
        tables={tables}
      />
    </div>
  );
};

export default GuestListPage;
