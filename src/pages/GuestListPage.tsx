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
  Alert,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { TableProps } from 'antd';
import { message } from 'antd';
import { Guest, Zone, TableData, Side } from '@/types';
import { SIDE_OPTIONS } from '@/data/formOptions';
import GuestFormDrawer from '@/pages/GuestListPage/components/GuestFormDrawer';
import { createGuest, updateGuest, deleteGuest, type RSVPData } from '@/services/firebaseService';
import { groupRSVPsWithGuests, getGuestsFromRSVP } from '@/utils/rsvpHelpers';

const { Title, Text } = Typography;
const { Search } = Input;

interface GuestListPageProps {
  guests: Guest[];
  zones: Zone[];
  tables: TableData[];
  rsvps?: RSVPData[];
}

const GuestListPage: React.FC<GuestListPageProps> = ({
  guests,
  zones,
  tables,
  rsvps = [],
}) => {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedSide, setSelectedSide] = useState<Side | 'all'>('all');
  const [selectedZone, setSelectedZone] = useState<string | 'all'>('all');

  // 🔧 DevOps: จัดกลุ่มจาก RSVP และเชื่อมกับ Guests
  const rsvpGroups = useMemo(() => {
    return groupRSVPsWithGuests(rsvps, guests, {
      side: selectedSide,
      zoneId: selectedZone,
      search: searchText,
    });
  }, [rsvps, guests, selectedSide, selectedZone, searchText]);

  // 🔧 DevOps: คำนวณ RSVP statistics
  const rsvpsNotImported = useMemo(() => {
    if (!rsvps || rsvps.length === 0) return 0;
    const guestsList = guests || [];
    
    return rsvps.filter(r => {
      if (!r || r.isComing !== 'yes') return false;
      const relatedGuests = getGuestsFromRSVP(r, guestsList);
      return relatedGuests.length === 0;
    }).length;
  }, [rsvps, guests]);

  const totalRSVPsComing = useMemo(() => {
    if (!rsvps || rsvps.length === 0) return 0;
    return rsvps.filter(r => r && r.isComing === 'yes').length;
  }, [rsvps]);

  const handleOpenDrawer = (guest?: Guest) => {
    setEditingGuest(guest || null);
    setIsDrawerVisible(true);
  };

  const handleFormSubmit = async (guest: Guest) => {
    try {
      if (editingGuest) {
        await updateGuest(guest.id, guest);
        message.success('อัพเดทข้อมูลแขกเรียบร้อย');
      } else {
        await createGuest(guest);
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

  const columns: TableProps<typeof rsvpGroups[0]>['columns'] = [
    {
      title: 'กลุ่ม (จาก RSVP)',
      key: 'group',
      fixed: 'left',
      width: 300,
      render: (_, row) => {
        const { rsvp, guests } = row;
        return (
          <div>
            <Space>
              <Text strong>{row.groupName}</Text>
              <Tag color="blue" icon={<FileTextOutlined />}>
                RSVP
              </Tag>
            </Space>
            {/* 🔧 DevOps: แสดงรายการย่อยจาก RSVP */}
            <div style={{ marginTop: 8, paddingLeft: 16 }}>
              <div style={{ fontSize: '12px', color: '#666' }}>
                ตัวเอง {rsvp.firstName} {rsvp.lastName}
              </div>
              {rsvp.accompanyingGuests && rsvp.accompanyingGuests.length > 0 && (
                <>
                  {rsvp.accompanyingGuests.map((acc, index) => {
                    const relatedGuest = guests.find(g => g.firstName === acc.name);
                    return (
                      <div key={index} style={{ fontSize: '12px', color: '#666' }}>
                        คนที่ {index + 1} {acc.name} {relatedGuest ? `(${relatedGuest.id})` : '(ยังไม่มี Guest)'}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
            {/* 🔧 DevOps: แสดงข้อมูล RSVP */}
            {rsvp.note && (
              <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f0faff', borderRadius: 4, fontSize: 11 }}>
                <Text type="secondary" strong>หมายเหตุ: </Text>
                <Text type="secondary">{rsvp.note}</Text>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '#ID',
      key: 'id',
      width: 100,
      render: (_, row) => (
        <Text copyable style={{ fontSize: '11px' }}>
          {row.guests.map(g => g.id).join(', ') || '-'}
        </Text>
      ),
      responsive: ['md'],
    },
    {
      title: 'ชื่อ-นามสกุล',
      key: 'name',
      width: 200,
      render: (_, row) => (
        <div>
          <Text strong>{row.groupName}</Text>
          {row.guests.length > 0 && (
            <div style={{ marginTop: 4 }}>
              {row.guests.map((g) => (
                <div key={g.id} style={{ marginBottom: 4, fontSize: '12px' }}>
                  {g.firstName} {g.lastName} {g.nickname ? `(${g.nickname})` : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'ความสัมพันธ์',
      key: 'relationToCouple',
      ellipsis: true,
      width: 150,
      render: (_, row) => (
        <Text>{row.rsvp.relation || '-'}</Text>
      ),
    },
    {
      title: 'ฝ่าย',
      key: 'side',
      width: 120,
      render: (_, row) => getSideTag(row.side),
    },
    {
      title: 'ที่นั่ง',
      key: 'seating',
      width: 150,
      render: (_, row) => {
        const mainGuest = row.guests[0];
        if (!mainGuest) return <Tag color="default">ยังไม่มี Guest</Tag>;
        const zone = zones.find((z) => z.zoneId === mainGuest.zoneId);
        const table = tables.find((t) => t.tableId === mainGuest.tableId);
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
      title: 'จำนวนคน',
      key: 'people',
      width: 120,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Text strong>{row.actualGuests} / {row.totalPeople}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Guest / RSVP
          </Text>
        </Space>
      ),
    },
    {
      title: 'จัดการ',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, row) => (
        <Space size="small">
          {row.guests.length > 0 && (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={() => handleOpenDrawer(row.guests[0])}
                size="small"
              />
              <Popconfirm
                title="ยืนยันการลบ?"
                description={`คุณต้องการลบกลุ่ม "${row.groupName}" ทั้งหมดใช่หรือไม่?`}
                onConfirm={() => {
                  // ลบทุกคนในกลุ่ม
                  row.guests.forEach(g => handleDelete(g.id));
                }}
                okText="ลบ"
                cancelText="ยกเลิก"
                placement="topRight"
              >
                <Button icon={<DeleteOutlined />} danger size="small" />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const zoneOptions = zones.map((z) => ({ value: z.zoneId, label: z.zoneName }));

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <Title level={2} style={{ margin: 0 }}>
          รายชื่อคนเข้างาน
        </Title>
        <Text type="secondary">รายชื่อจากรายการตอบรับ (RSVP)</Text>
      </div>

      {/* 🔧 DevOps: แสดง Alert ถ้ามี RSVP ที่ยังไม่ได้ import */}
      {rsvpsNotImported > 0 && (
        <Alert
          message={`มี RSVP ที่ยังไม่ได้นำเข้า ${rsvpsNotImported} รายการ`}
          description="RSVP ที่ยังไม่ได้นำเข้าจะไม่แสดงในรายชื่อคนเข้างาน กรุณานำเข้าผ่านหน้า รายการตอบรับ ก่อน"
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          className="mb-4"
          closable
        />
      )}

      {/* 🔧 DevOps: RSVP Statistics Section */}
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>สรุปข้อมูล RSVP</span>
          </Space>
        }
        className="mb-4"
        size="small"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="RSVP ตอบรับเข้างาน"
              value={totalRSVPsComing}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="ยังไม่ได้นำเข้า"
              value={rsvpsNotImported}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: rsvpsNotImported > 0 ? '#faad14' : '#52c41a' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Search and Filter Row */}
      <Card className="shadow-sm mb-6" variant="borderless">
        <Space.Compact block style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <Space.Compact style={{ flex: 1, minWidth: 200 }}>
            <Search
              placeholder="ค้นหา: ชื่อจาก RSVP"
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
            options={[{ value: 'all', label: '--- ทุกฝ่าย ---' }, ...SIDE_OPTIONS]}
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
          dataSource={rsvpGroups}
          rowKey="key"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1200 }}
          locale={{ emptyText: <Empty description="ไม่พบรายชื่อจาก RSVP ที่ตรงตามเงื่อนไข" /> }}
          summary={() => {
            const totalPeople = rsvpGroups.reduce((acc, g) => acc + g.totalPeople, 0);
            const totalGuests = rsvpGroups.reduce((acc, g) => acc + g.actualGuests, 0);
            return (
              <Table.Summary fixed="top">
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={7}>
                    <Text strong>
                      สรุป: พบกลุ่มทั้งหมด {rsvpGroups.length} กลุ่ม ({totalGuests} Guest / {totalPeople} คนจาก RSVP)
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
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
