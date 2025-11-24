import React, { useState, useMemo, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  List,
  Button,
  Typography,
  Tabs,
  Empty,
  Table,
  Space,
  Tag,
  Popconfirm,
  Badge,
  Tooltip,
  Divider,
  message,
  Modal,
  Avatar,
  Input,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TableOutlined,
  BorderOuterOutlined,
  EnvironmentOutlined,
  QuestionCircleOutlined,
  ArrowRightOutlined,
  TeamOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { TableProps } from 'antd';
import { Guest, Zone, TableData } from '@/types';
import DraggableTable from '@/pages/SeatingManagementPage/components/DraggableTable';
import ZoneModal from '@/pages/SeatingManagementPage/components/ZoneModal';
import TableModal from '@/pages/SeatingManagementPage/components/TableModal';
import { createZone, updateZone, deleteZone, createTable, updateTable, deleteTable, updateGuest } from '@/services/firebaseService';
import type { RSVPData } from '@/types';
import { getGuestsFromRSVP } from '@/utils/rsvpHelpers';

const { Title, Text } = Typography;

interface SeatingManagementPageProps {
  guests: Guest[];
  zones: Zone[];
  setZones: React.Dispatch<React.SetStateAction<Zone[]>>;
  tables: TableData[];
  setTables: React.Dispatch<React.SetStateAction<TableData[]>>;
  rsvps?: RSVPData[];
}

const SeatingManagementPage: React.FC<SeatingManagementPageProps> = (props) => {
  const { guests, zones, setZones, tables, setTables, rsvps = [] } = props;
  const [selectedZoneId, setSelectedZoneId] = useState<string>(
    zones[0]?.id || '',
  );
  const [viewMode, setViewMode] = useState<'layout' | 'list'>('layout');

  // In-page detail modal state (simpler UX)
  const [activeTable, setActiveTable] = useState<TableData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [unassignedSearchText, setUnassignedSearchText] = useState('');

  // Zone/Table CRUD modals
  const [isZoneModalVisible, setIsZoneModalVisible] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [isTableModalVisible, setIsTableModalVisible] = useState(false);
  const [editingTable, setEditingTable] = useState<TableData | null>(null);

  // Derived state
  const sortedZones = useMemo(
    () => [...zones].sort((a, b) => a.order - b.order),
    [zones],
  );
  const currentZone = zones.find((z) => z.id === selectedZoneId);
  const tablesInCurrentZone = useMemo(
    () =>
      tables
        .filter((t) => t.zoneId === selectedZoneId)
        .sort((a, b) => a.order - b.order),
    [selectedZoneId, tables],
  );

  // 🔧 DevOps: หา Guests ที่มาจาก RSVP และยังไม่ได้จัดโต๊ะ
  const unassignedGuests = useMemo(() => {
    const guestSet = new Set<string>();
    rsvps.forEach(rsvp => {
      if (rsvp.isComing === 'yes') {
        const relatedGuests = getGuestsFromRSVP(rsvp, guests);
        relatedGuests.forEach(g => {
          if (g.zoneId === null || g.tableId === null) {
            guestSet.add(g.id);
          }
        });
      }
    });
    return guests.filter(g => guestSet.has(g.id));
  }, [guests, rsvps]);

  const guestsByTable = useMemo(() => {
    const map = new Map<string, Guest[]>();
    for (const t of tables) map.set(t.tableId, []);
    for (const g of guests) {
      if (g.tableId) {
        const list = map.get(g.tableId) || [];
        list.push(g);
        map.set(g.tableId, list);
      }
    }
    return map;
  }, [guests, tables]);

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

  const rsvpsComing = useMemo(() => {
    if (!rsvps || rsvps.length === 0) return 0;
    return rsvps.filter(r => r && r.isComing === 'yes').length;
  }, [rsvps]);

  // 🔧 DevOps: แสดง Guests แบบรายบุคคล (ไม่ใช่แบบกลุ่ม) สำหรับ modal
  // แต่ยังคงแสดงข้อมูล RSVP และชื่อกลุ่ม
  type UnassignedGuestItem = {
    guest: Guest;
    rsvp: RSVPData;
    groupName: string;
    isMainGuest: boolean;
    accompanyingIndex?: number; // index ของผู้ติดตาม (0-based)
    accompanyingName?: string; // ชื่อผู้ติดตามจาก RSVP
  };

  const unassignedGuestItems = useMemo(() => {
    const items: UnassignedGuestItem[] = [];
    
    // วน loop ผ่าน RSVPs ที่ตอบรับเข้างาน
    rsvps.forEach(rsvp => {
      if (!rsvp || rsvp.isComing !== 'yes') return;
      
      // หา Guests ที่ link กับ RSVP นี้
      const relatedGuests = getGuestsFromRSVP(rsvp, guests);
      
      // กรองเฉพาะ Guests ที่ยังไม่ได้จัดโต๊ะ
      const unassignedGuests = relatedGuests.filter(g => g.zoneId === null || g.tableId === null);
      
      if (unassignedGuests.length === 0) return;
      
      const groupName = rsvp.fullName || `${rsvp.firstName} ${rsvp.lastName}`;
      
      // หา main guest (ตัวแรกที่ match กับ RSVP)
      const mainGuest = unassignedGuests.find(g => 
        g.rsvpUid === rsvp.uid && 
        (g.firstName === rsvp.firstName || g.id === rsvp.guestId)
      ) || unassignedGuests[0];
      
      // เพิ่ม main guest
      if (mainGuest) {
        items.push({
          guest: mainGuest,
          rsvp,
          groupName,
          isMainGuest: true,
        });
      }
      
      // เพิ่ม accompanying guests
      if (rsvp.accompanyingGuests && rsvp.accompanyingGuests.length > 0) {
        rsvp.accompanyingGuests.forEach((accGuest, index) => {
          // หา Guest ที่ match กับ accompanying guest
          const relatedGuest = unassignedGuests.find(g => 
            g.rsvpUid === rsvp.uid && 
            g.firstName === accGuest.name &&
            g.id !== mainGuest?.id
          );
          
          if (relatedGuest) {
            items.push({
              guest: relatedGuest,
              rsvp,
              groupName,
              isMainGuest: false,
              accompanyingIndex: index,
              accompanyingName: accGuest.name,
            });
          }
        });
      }
    });
    
    return items;
  }, [rsvps, guests]);

  const filteredUnassignedGuestItems = useMemo(() => {
    const q = unassignedSearchText.trim().toLowerCase();
    if (!q) return unassignedGuestItems;
    return unassignedGuestItems.filter((item) => {
      const rsvpName = (item.rsvp.fullName || `${item.rsvp.firstName} ${item.rsvp.lastName}`).toLowerCase();
      const guestName = `${item.guest.firstName} ${item.guest.lastName} ${item.guest.nickname || ''}`.toLowerCase();
      return (
        rsvpName.includes(q) ||
        guestName.includes(q) ||
        item.groupName.toLowerCase().includes(q)
      );
    });
  }, [unassignedGuestItems, unassignedSearchText]);

  // --- Handlers ---
  const handleUnassignGuest = async (guestId: string) => {
    try {
      await updateGuest(guestId, { zoneId: null, tableId: null });
      message.success('ย้ายออกจากโต๊ะแล้ว');
    } catch (error) {
      console.error('Error unassigning guest:', error);
      message.error('เกิดข้อผิดพลาด');
    }
  };

  const handleAddGuestToTable = async (guestId: string) => {
    if (!activeTable) return;
    const currentCount = (guestsByTable.get(activeTable.tableId) || []).length;
    if (currentCount >= activeTable.capacity) {
      message.error('โต๊ะเต็มแล้ว');
      return;
    }
    try {
      await updateGuest(guestId, { zoneId: activeTable.zoneId, tableId: activeTable.tableId });
      // 🔧 DevOps: ไม่ต้องเรียก setGuests เพราะ Firebase subscription จะอัปเดต state อัตโนมัติ
      message.success('เพิ่มเข้าโต๊ะสำเร็จ');
    } catch (error) {
      console.error('Error adding guest to table:', error);
      message.error('เกิดข้อผิดพลาด');
    }
  };

  const handleTablePositionUpdate = useCallback(
    async (id: string, newX: number, newY: number) => {
      try {
        await updateTable(id, { x: newX, y: newY });
        setTables((prevTables) =>
          prevTables.map((table) => (table.id === id ? { ...table, x: newX, y: newY } : table)),
        );
      } catch (error) {
        console.error('Error updating table position:', error);
        message.error('เกิดข้อผิดพลาดในการอัพเดทตำแหน่งโต๊ะ');
      }
    },
    [setTables],
  );

  const handleOpenDetailModal = (table: TableData /*, seatedGuests: Guest[] */) => {
    setActiveTable(table);
    setUnassignedSearchText('');
    setIsDetailModalOpen(true);
  };

  // Zone handlers
  const handleZoneSubmit = async (zone: Zone) => {
    try {
      if (editingZone) {
        await updateZone(zone.id, zone);
        setZones(zones.map((z) => (z.id === zone.id ? zone : z)));
        message.success(`แก้ไขโซน ${zone.zoneName} สำเร็จ`);
      } else {
        if (zones.some((z) => z.zoneId === zone.zoneId)) {
          message.error(`รหัสโซน ${zone.zoneId} ซ้ำกัน`);
          return;
        }
        await createZone(zone);
        setZones([...zones, zone]);
        setSelectedZoneId(zone.id);
        message.success(`เพิ่มโซน ${zone.zoneName} สำเร็จ`);
      }
      setEditingZone(null);
      setIsZoneModalVisible(false);
    } catch (error) {
      console.error('Error saving zone:', error);
      message.error('เกิดข้อผิดพลาดในการบันทึกโซน');
    }
  };

  const handleZoneDelete = async (id: string, name: string) => {
    try {
      const zone = zones.find((z) => z.id === id);
      if (!zone) return;

      // Delete zone
      await deleteZone(id);
      setZones(zones.filter((z) => z.id !== id));

      // Delete tables in this zone
      const tablesToDelete = tables.filter((t) => t.zoneId === zone.zoneId);
      for (const table of tablesToDelete) {
        await deleteTable(table.id);
      }
      setTables(tables.filter((t) => t.zoneId !== zone.zoneId));

      // Unassign guests from this zone
      const guestsToUpdate = guests.filter((g) => g.zoneId === zone.zoneId);
      for (const guest of guestsToUpdate) {
        await updateGuest(guest.id, { zoneId: null, tableId: null });
      }
      // 🔧 DevOps: ไม่ต้องเรียก setGuests เพราะ Firebase subscription จะอัปเดต state อัตโนมัติ

      if (selectedZoneId === id) {
        setSelectedZoneId(zones.filter((z) => z.id !== id)[0]?.id || '');
      }
      message.success(`ลบโซน ${name} และโต๊ะทั้งหมดที่เกี่ยวข้องแล้ว`);
    } catch (error) {
      console.error('Error deleting zone:', error);
      message.error('เกิดข้อผิดพลาดในการลบโซน');
    }
  };

  // Table handlers
  const handleTableSubmit = async (table: TableData) => {
    try {
      if (editingTable) {
        await updateTable(table.id, table);
        setTables(tables.map((t) => (t.id === table.id ? table : t)));
        message.success(`แก้ไขโต๊ะ ${table.tableName} สำเร็จ`);
      } else {
        if (tables.some((t) => t.tableId === table.tableId)) {
          message.error(`รหัสโต๊ะ ${table.tableId} ซ้ำกัน`);
          return;
        }
        await createTable(table);
        setTables([...tables, table]);
        message.success(`เพิ่มโต๊ะ ${table.tableName} สำเร็จ`);
      }
      setEditingTable(null);
      setIsTableModalVisible(false);
    } catch (error) {
      console.error('Error saving table:', error);
      message.error('เกิดข้อผิดพลาดในการบันทึกโต๊ะ');
    }
  };

  const handleTableDelete = async (id: string, name: string) => {
    try {
      await deleteTable(id);
      setTables(tables.filter((t) => t.id !== id));

      // Unassign guests from this table
      const guestsToUpdate = guests.filter((g) => g.tableId === id);
      for (const guest of guestsToUpdate) {
        await updateGuest(guest.id, { tableId: null, zoneId: null });
      }
      // 🔧 DevOps: ไม่ต้องเรียก setGuests เพราะ Firebase subscription จะอัปเดต state อัตโนมัติ
      message.success(`ลบโต๊ะ ${name} แล้ว`);
    } catch (error) {
      console.error('Error deleting table:', error);
      message.error('เกิดข้อผิดพลาดในการลบโต๊ะ');
    }
  };

  // --- Sub-views ---
  const LayoutMap = () => (
    <div
      id="layout-canvas"
      style={{
        position: 'relative',
        width: '100%',
        height: '600px',
        minHeight: '400px',
        border: `2px dashed ${currentZone?.color || '#ccc'}`,
        borderRadius: 8,
        backgroundColor: '#fff',
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      {tablesInCurrentZone.length === 0 ? (
        <Empty
          description={`โซน ${currentZone?.zoneName || 'นี้'} ยังไม่มีโต๊ะ`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ) : (
        tablesInCurrentZone.map((table) => {
          const seatedGuests = guests.filter((g) => g.tableId === table.tableId);
          return (
            <DraggableTable
              key={table.id}
              table={table}
              seatedGuests={seatedGuests}
              zoneColor={currentZone?.color || '#ccc'}
              onTablePositionUpdate={handleTablePositionUpdate}
              onOpenDetail={(t) => handleOpenDetailModal(t)}
            />
          );
        })
      )}

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '50px',
          backgroundColor: '#333',
          color: '#fff',
          borderRadius: '0 0 8px 8px',
          textAlign: 'center',
          padding: 8,
          fontSize: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
        }}
      >
        เวที (Stage)
      </div>
    </div>
  );

  const ManagementList = () => {
    const tableColumns: TableProps<TableData>['columns'] = [
      {
        title: 'ลำดับ',
        dataIndex: 'order',
        key: 'order',
        width: 80,
        sorter: (a, b) => a.order - b.order,
      },
      { title: 'รหัสโต๊ะ', dataIndex: 'tableId', key: 'tableId', width: 100, render: (id) => <Text code>{id}</Text> },
      { title: 'ชื่อโต๊ะ', dataIndex: 'tableName', key: 'tableName', ellipsis: true },
      { title: 'ความจุ', dataIndex: 'capacity', key: 'capacity', width: 100, align: 'center' as const, render: (cap) => <Tag color="geekblue">{cap} ที่</Tag> },
      {
        title: 'ที่นั่งใช้ไป',
        key: 'seated',
        width: 120,
        align: 'center' as const,
        render: (_, record) => {
          const seatedCount = guests.filter((g) => g.tableId === record.tableId).length;
          const isFull = seatedCount >= record.capacity;
          return <Text type={isFull ? 'danger' : 'success'}>{seatedCount}</Text>;
        },
      },
      { title: 'หมายเหตุ', dataIndex: 'note', key: 'note', ellipsis: true, responsive: ['lg'] },
      {
        title: 'จัดการ',
        key: 'action',
        width: 120,
        render: (_, record) => (
          <Space size="small">
            <Button icon={<EditOutlined />} onClick={() => { setEditingTable(record); setIsTableModalVisible(true); }} size="small" />
            <Popconfirm
              title="ยืนยันการลบโต๊ะ?"
              description={`การลบโต๊ะ "${record.tableName}" จะทำให้แขกที่นั่งโต๊ะนี้ถูกยกเลิกการจัดโต๊ะ`}
              onConfirm={() => handleTableDelete(record.id, record.tableName)}
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

    return (
      <Table
        columns={tableColumns}
        dataSource={tablesInCurrentZone}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        size="middle"
        locale={{ emptyText: <Empty description={`โซน ${currentZone?.zoneName} ยังไม่มีโต๊ะ`} /> }}
        scroll={{ x: 800 }}
      />
    );
  };

  // --- Render ---
  return (
    <div className="p-4 md:p-6">
      <Title level={2} className="mb-6">
        <TableOutlined /> จัดการผังโต๊ะ & โซน
      </Title>

      {/* 🔧 DevOps: แสดง Alert ถ้ามี RSVP ที่ยังไม่ได้ import */}
      {rsvpsNotImported > 0 && (
        <Alert
          message={`มี RSVP ที่ยังไม่ได้นำเข้า ${rsvpsNotImported} รายการ`}
          description="RSVP ที่ยังไม่ได้นำเข้าจะไม่สามารถจัดโต๊ะได้ กรุณานำเข้าผ่านหน้า รายการตอบรับ ก่อน"
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
            <Space direction="vertical" size={0}>
              <Text type="secondary" style={{ fontSize: '12px' }}>RSVP ตอบรับเข้างาน</Text>
              <Text strong style={{ fontSize: '20px', color: '#1890ff' }}>{rsvpsComing}</Text>
            </Space>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Space direction="vertical" size={0}>
              <Text type="secondary" style={{ fontSize: '12px' }}>ยังไม่ได้นำเข้า</Text>
              <Text strong style={{ fontSize: '20px', color: rsvpsNotImported > 0 ? '#faad14' : '#52c41a' }}>{rsvpsNotImported}</Text>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Left Sidebar (zones) */}
        <Col xs={24} md={6} lg={5}>
          <Card
            title="โซนที่นั่ง"
            className="shadow-sm"
            extra={
              <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => { setEditingZone(null); setIsZoneModalVisible(true); }}>
                เพิ่มโซน
              </Button>
            }
            styles={{ body: { padding: '12px' } }}
            style={{ height: '100%', borderRadius: 12 }}
          >
            <List
              itemLayout="horizontal"
              dataSource={sortedZones}
              renderItem={(zone) => {
                const isActive = zone.id === selectedZoneId;
                const tableCount = tables.filter((t) => t.zoneId === zone.zoneId).length;
                return (
                  <List.Item
                    onClick={() => setSelectedZoneId(zone.id)}
                    style={{ cursor: 'pointer', background: isActive ? '#f0faff' : 'transparent', borderRadius: 8, padding: '8px 16px', border: isActive ? `1px solid ${zone.color}55` : '1px solid transparent', marginBottom: 8, transition: 'all 0.3s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, marginRight: 8 }}>
                      <Badge count={zone.order} size="small" color={isActive ? zone.color : '#d9d9d9'} offset={[0, 25]}>
                        <Avatar style={{ backgroundColor: zone.color, marginRight: 12 }} icon={<EnvironmentOutlined />} />
                      </Badge>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Tooltip title={zone.zoneName}>
                          <Text strong style={{ color: isActive ? zone.color : undefined, display: 'block' }} ellipsis>
                            {zone.zoneName}
                          </Text>
                        </Tooltip>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }} ellipsis>
                          {tableCount} โต๊ะ
                        </Text>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 4 }}>
                      <Button type="text" icon={<EditOutlined />} size="small" style={{ padding: '0 2px', width: 24 }} onClick={(e) => { e.stopPropagation(); setEditingZone(zone); setIsZoneModalVisible(true); }} />
                      <Popconfirm title={`ลบโซน ${zone.zoneName}?`} onConfirm={() => handleZoneDelete(zone.id, zone.zoneName)} okText="ลบ" cancelText="ยกเลิก" onCancel={(e) => e?.stopPropagation()}>
                        <Button type="text" danger icon={<DeleteOutlined />} size="small" style={{ padding: '0 2px', width: 24 }} onClick={(e) => e.stopPropagation()} />
                      </Popconfirm>
                    </div>
                  </List.Item>
                );
              }}
            />
            <Divider style={{ margin: '16px 0 8px 0' }} />
            <Space style={{ width: '100%', justifyContent: 'space-between', padding: '0 8px' }}>
              <Text>
                <QuestionCircleOutlined style={{ marginRight: 8, color: '#faad14' }} /> ยังไม่ได้จัดโต๊ะ
              </Text>
              <Tag color="warning" style={{ fontSize: 14 }}>
                {unassignedGuests.length} คน
              </Tag>
            </Space>
          </Card>
        </Col>

        {/* Right Content */}
        <Col xs={24} md={18} lg={19}>
          <Card
            className="shadow-sm"
            style={{ minHeight: '600px', borderRadius: 12 }}
            title={<Text style={{ fontSize: 20, fontWeight: 600 }}>{currentZone?.zoneName || 'เลือกโซน'}</Text>}
            extra={
              currentZone && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingTable(null); setIsTableModalVisible(true); }}>
                  เพิ่มโต๊ะในโซนนี้
                </Button>
              )
            }
          >
            <Tabs
              activeKey={viewMode}
              onChange={(key) => setViewMode(key as 'layout' | 'list')}
              items={[
                { key: 'layout', label: (<Space size={4}><BorderOuterOutlined /> ผังโต๊ะ (Layout)</Space>), children: LayoutMap() },
                { key: 'list', label: (<Space size={4}><TableOutlined /> จัดการโต๊ะ (List)</Space>), children: ManagementList() },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* In-page Table Detail Modal */}
      <Modal
        title={
          activeTable ? (
            <Space>
              <TeamOutlined />
              <Text strong style={{ fontSize: 18 }}>{activeTable.tableName}</Text>
              <Tag color="blue">{(guestsByTable.get(activeTable.tableId) || []).length} / {activeTable.capacity} คน</Tag>
            </Space>
          ) : 'รายละเอียดโต๊ะ'
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={800}
      >
        {activeTable && (
          <Row gutter={[24, 24]}>
            {/* Left: current guests */}
            <Col xs={24} md={12} style={{ borderRight: '1px solid #f0f0f0' }}>
              <Divider orientation="left" style={{ margin: '0 0 16px 0' }}>
                <Text type="success">นั่งอยู่ที่นี่</Text>
              </Divider>
              <List
                itemLayout="horizontal"
                dataSource={guestsByTable.get(activeTable.tableId) || []}
                locale={{ emptyText: 'ยังไม่มีใครนั่งโต๊ะนี้' }}
                renderItem={(guest) => (
                  <List.Item key={guest.id} actions={[<Button key="delete" type="text" danger icon={<DeleteOutlined />} onClick={() => handleUnassignGuest(guest.id)} />]}>
                    <List.Item.Meta
                      avatar={<Avatar style={{ backgroundColor: guest.side === 'groom' ? '#1890ff' : '#eb2f96' }}>{guest.nickname ? guest.nickname[0] : guest.firstName[0]}</Avatar>}
                      title={`${guest.firstName} ${guest.lastName}${guest.nickname ? ` (${guest.nickname})` : ''}`}
                      description={guest.relationToCouple}
                    />
                  </List.Item>
                )}
                style={{ maxHeight: 400, overflowY: 'auto' }}
              />
            </Col>

            {/* Right: available guests */}
            <Col xs={24} md={12}>
              <Divider orientation="left" style={{ margin: '0 0 16px 0' }}>
                <Text type="warning">เลือกคนเข้าโต๊ะ</Text>
              </Divider>
              <Input placeholder="ค้นหาชื่อจาก RSVP" value={unassignedSearchText} onChange={(e) => setUnassignedSearchText(e.target.value)} style={{ marginBottom: 16 }} />
              <List
                itemLayout="horizontal"
                dataSource={filteredUnassignedGuestItems}
                locale={{ emptyText: 'ไม่พบ RSVP ที่ยังว่าง' }}
                renderItem={(item) => {
                  const { guest, rsvp, groupName, isMainGuest, accompanyingIndex, accompanyingName } = item;
                  const currentTableCount = (guestsByTable.get(activeTable.tableId) || []).length;
                  const canAdd = currentTableCount < activeTable.capacity;
                  
                  // กำหนด title ตามประเภท
                  let displayTitle = '';
                  if (isMainGuest) {
                    displayTitle = `${groupName} (ข้อมูลผู้แจ้ง)`;
                  } else if (accompanyingIndex !== undefined && accompanyingName) {
                    displayTitle = `${groupName} (ผู้ติดตามคนที่ ${accompanyingIndex + 1}: ${accompanyingName})`;
                  } else {
                    displayTitle = `${groupName} (${guest.firstName} ${guest.lastName})`;
                  }
                  
                  return (
                    <List.Item 
                      key={guest.id}
                      actions={[
                        <Button 
                          key="select" 
                          type="primary" 
                          ghost 
                          size="small" 
                          icon={<ArrowRightOutlined />} 
                          onClick={() => handleAddGuestToTable(guest.id)} 
                          disabled={!canAdd}
                        >
                          เลือก
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            size="small" 
                            style={{ 
                              backgroundColor: isMainGuest ? '#722ed1' : '#52c41a',
                            }}
                          >
                            {isMainGuest ? '👤' : `${(accompanyingIndex || 0) + 1}`}
                          </Avatar>
                        }
                        title={
                          <div>
                            <Space>
                              <Text strong style={{ fontSize: 14, color: isMainGuest ? '#722ed1' : '#52c41a' }}>
                                {displayTitle}
                              </Text>
                              <Tag color="blue" icon={<FileTextOutlined />} style={{ fontSize: 10 }}>
                                RSVP
                              </Tag>
                            </Space>
                            <div style={{ marginTop: 4 }}>
                              <Text style={{ fontSize: 12, color: '#666' }}>
                                {guest.firstName} {guest.lastName} {guest.nickname ? `(${guest.nickname})` : ''}
                              </Text>
                              {guest.relationToCouple && (
                                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                                  {guest.relationToCouple}
                                </div>
                              )}
                            </div>
                            {/* 🔧 DevOps: แสดงข้อมูล RSVP */}
                            <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f0faff', borderRadius: 4, fontSize: 11 }}>
                              <Text type="secondary" strong>ข้อมูล RSVP:</Text>
                              <div style={{ marginTop: 4 }}>
                                <Text type="secondary">
                                  {isMainGuest ? 'ข้อมูลผู้แจ้ง' : `ผู้ติดตามคนที่ ${(accompanyingIndex || 0) + 1}`}
                                </Text>
                                {rsvp.note && (
                                  <div style={{ marginTop: 2 }}>
                                    <Text type="secondary">หมายเหตุ: {rsvp.note}</Text>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        }
                        description={
                          <Tag style={{ fontSize: 10, lineHeight: '16px' }}>
                            {rsvp.side === 'groom' ? 'บ่าว' : rsvp.side === 'bride' ? 'สาว' : 'ทั้งคู่'} • {groupName}
                          </Tag>
                        }
                      />
                    </List.Item>
                  );
                }}
                style={{ maxHeight: 350, overflowY: 'auto' }}
              />
            </Col>
          </Row>
        )}
      </Modal>

      {/* Zone modal */}
      <ZoneModal visible={isZoneModalVisible} onClose={() => setIsZoneModalVisible(false)} zoneToEdit={editingZone} onSubmit={handleZoneSubmit} />

      {/* Table modal */}
      {currentZone && (
        <TableModal visible={isTableModalVisible} onClose={() => setIsTableModalVisible(false)} tableToEdit={editingTable} zone={currentZone} onSubmit={handleTableSubmit} />
      )}
    </div>
  );
};

export default SeatingManagementPage;
