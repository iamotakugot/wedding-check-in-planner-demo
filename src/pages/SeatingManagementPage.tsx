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
  Drawer,
  Avatar,
  Input,
  Alert,
  Checkbox,
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
  SearchOutlined,
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
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState(false);
  const [unassignedSearchText, setUnassignedSearchText] = useState('');
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);

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
      
      // 🔧 Debug: Log ข้อมูลเพื่อตรวจสอบ
      if (relatedGuests.length > 0) {
        console.log('🔍 [Seating] RSVP:', rsvp.firstName, rsvp.lastName, 'มี Guests:', relatedGuests.length);
      }
      
      // กรองเฉพาะ Guests ที่ยังไม่ได้จัดโต๊ะ (zoneId === null && tableId === null)
      const unassignedGuests = relatedGuests.filter(g => 
        (g.zoneId === null || g.zoneId === undefined) && 
        (g.tableId === null || g.tableId === undefined)
      );
      
      if (unassignedGuests.length === 0) return;
      
      const groupName = rsvp.fullName || `${rsvp.firstName} ${rsvp.lastName}`;
      
      // 🔧 หา main guest - ใช้วิธีที่ยืดหยุ่นกว่า
      // 1. หาผ่าน guestId ก่อน (ถ้ามี)
      // 2. หาผ่าน rsvpUid และ firstName (case-insensitive)
      // 3. ถ้าไม่เจอ ใช้ตัวแรก
      let mainGuest = unassignedGuests.find(g => g.id === rsvp.guestId);
      
      if (!mainGuest) {
        mainGuest = unassignedGuests.find(g => 
          g.rsvpUid === rsvp.uid && 
          g.firstName?.toLowerCase().trim() === rsvp.firstName?.toLowerCase().trim()
        );
      }
      
      if (!mainGuest) {
        // ถ้ายังไม่เจอ ใช้ตัวแรกที่มี rsvpUid ตรงกัน
        mainGuest = unassignedGuests.find(g => g.rsvpUid === rsvp.uid) || unassignedGuests[0];
      }
      
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
          // 🔧 หา Guest ที่ match กับ accompanying guest - ใช้วิธีที่ยืดหยุ่นกว่า
          // 1. หาผ่าน firstName (case-insensitive, trim)
          // 2. หาผ่าน nickname (ถ้ามี)
          const relatedGuest = unassignedGuests.find(g => {
            if (g.id === mainGuest?.id) return false; // ข้าม main guest
            
            // Match ผ่าน firstName
            const firstNameMatch = g.firstName?.toLowerCase().trim() === accGuest.name?.toLowerCase().trim();
            
            // Match ผ่าน nickname (ถ้ามี)
            const nicknameMatch = g.nickname?.toLowerCase().trim() === accGuest.name?.toLowerCase().trim();
            
            return g.rsvpUid === rsvp.uid && (firstNameMatch || nicknameMatch);
          });
          
          if (relatedGuest) {
            items.push({
              guest: relatedGuest,
              rsvp,
              groupName,
              isMainGuest: false,
              accompanyingIndex: index,
              accompanyingName: accGuest.name,
            });
          } else {
            // 🔧 Debug: ถ้าไม่เจอ accompanying guest
            console.warn('⚠️ [Seating] ไม่พบ Guest สำหรับ accompanying guest:', accGuest.name, 'ใน RSVP:', rsvp.firstName);
          }
        });
      }
    });
    
    // 🔧 Debug: Log จำนวน items ที่พบ
    console.log('📊 [Seating] unassignedGuestItems:', items.length, 'items');
    
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

  // 🔧 Helper function สำหรับเพิ่ม guest เดียว (ใช้ใน handleAddMultipleGuestsToTable)
  const addSingleGuestToTable = async (guestId: string) => {
    if (!activeTable) {
      throw new Error('ไม่มีโต๊ะที่เลือก');
    }
    
    await updateGuest(guestId, { 
      zoneId: activeTable.zoneId, 
      tableId: activeTable.tableId 
    });
  };

  const handleAddMultipleGuestsToTable = async () => {
    if (!activeTable || selectedGuestIds.length === 0) {
      message.warning('กรุณาเลือกแขกที่ต้องการเพิ่ม');
      return;
    }
    
    const currentTableGuests = guests.filter((g) => g.tableId === activeTable.tableId);
    const currentCount = currentTableGuests.length;
    const availableSlots = activeTable.capacity - currentCount;
    
    if (availableSlots <= 0) {
      message.error(`โต๊ะเต็มแล้ว (${currentCount}/${activeTable.capacity})`);
      return;
    }
    
    const guestsToAdd = selectedGuestIds.slice(0, availableSlots);
    
    try {
      // เพิ่ม guests ทีละคน
      for (const guestId of guestsToAdd) {
        await addSingleGuestToTable(guestId);
      }
      
      message.success(`เพิ่ม ${guestsToAdd.length} คนเข้าโต๊ะสำเร็จ`);
      setSelectedGuestIds([]);
      setIsAssignDrawerOpen(false);
      
      if (guestsToAdd.length < selectedGuestIds.length) {
        message.warning(`เพิ่มได้เพียง ${guestsToAdd.length} คน (โต๊ะเต็ม)`);
      }
    } catch (error) {
      console.error('❌ [Seating] Error adding multiple guests:', error);
      message.error('เกิดข้อผิดพลาดในการเพิ่มแขก');
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

  const handleOpenDetailModal = (table: TableData) => {
    setActiveTable(table);
    setUnassignedSearchText('');
    setSelectedGuestIds([]);
    setIsDetailModalOpen(true);
  };

  const handleOpenAssignDrawer = (table: TableData) => {
    setActiveTable(table);
    setUnassignedSearchText('');
    setSelectedGuestIds([]);
    setIsAssignDrawerOpen(true);
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
  const LayoutMap = () => {
    // Maintain consistent aspect ratio (16:9) for coordinate system stability
    const ASPECT_RATIO = 16 / 9;
    const MIN_HEIGHT = 400; // Minimum height in pixels for smaller screens

    return (
      <div
        style={{
          width: '100%',
          position: 'relative',
          paddingBottom: `${(1 / ASPECT_RATIO) * 100}%`, // Maintain aspect ratio
          minHeight: MIN_HEIGHT,
          backgroundColor: '#f5f5f5',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div
          id="layout-canvas"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            minHeight: MIN_HEIGHT,
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
      </div>
    );
  };

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

      {/* 🔧 Redesign: Table Detail Modal - แสดงเฉพาะแขกที่นั่งอยู่ */}
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
        onCancel={() => {
          setIsDetailModalOpen(false);
          setActiveTable(null);
        }}
        footer={[
          <Button key="assign" type="primary" icon={<PlusOutlined />} onClick={() => {
            setIsDetailModalOpen(false);
            if (activeTable) handleOpenAssignDrawer(activeTable);
          }}>
            เพิ่มแขกเข้าโต๊ะ
          </Button>,
          <Button key="close" onClick={() => {
            setIsDetailModalOpen(false);
            setActiveTable(null);
          }}>
            ปิด
          </Button>,
        ]}
        width={600}
        key={activeTable?.id}
      >
        {activeTable && (() => {
          // Get current guests for this table - ensure we use the latest data
          const currentTableGuests = guests.filter((g) => g.tableId === activeTable.tableId);
          
          return (
            <div>
              <Divider orientation="left" style={{ margin: '0 0 16px 0' }}>
                <Text type="success" strong>แขกที่นั่งอยู่ ({currentTableGuests.length} / {activeTable.capacity})</Text>
              </Divider>
              <List
                itemLayout="horizontal"
                dataSource={currentTableGuests}
                locale={{ emptyText: 'ยังไม่มีใครนั่งโต๊ะนี้' }}
                renderItem={(guest) => (
                  <List.Item 
                    key={guest.id} 
                    actions={[
                      <Popconfirm
                        key="unassign"
                        title="ย้ายแขกออก?"
                        description={`นำคุณ ${guest.nickname || guest.firstName} ออกจากโต๊ะนี้?`}
                        onConfirm={() => handleUnassignGuest(guest.id)}
                        okText="ย้ายออก"
                        cancelText="ยกเลิก"
                      >
                        <Button type="text" danger icon={<DeleteOutlined />} size="small">
                          ย้ายออก
                        </Button>
                      </Popconfirm>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar style={{ backgroundColor: guest.side === 'groom' ? '#1890ff' : '#eb2f96' }}>{guest.nickname ? guest.nickname[0] : guest.firstName[0]}</Avatar>}
                      title={`${guest.firstName} ${guest.lastName}${guest.nickname ? ` (${guest.nickname})` : ''}`}
                      description={guest.relationToCouple || 'ไม่มีข้อมูล'}
                    />
                  </List.Item>
                )}
                style={{ maxHeight: 400, overflowY: 'auto' }}
              />
            </div>
          );
        })()}
      </Modal>

      {/* 🔧 Redesign: Drawer สำหรับเลือกคนเข้าโต๊ะ - มีพื้นที่มากขึ้นและใช้งานง่ายขึ้น */}
      <Drawer
        title={
          activeTable ? (
          <Space>
            <TeamOutlined />
            <Text strong style={{ fontSize: 18 }}>เพิ่มแขกเข้าโต๊ะ {activeTable.tableName}</Text>
            <Tag color="blue">
              {guests.filter((g) => g.tableId === activeTable.tableId).length} / {activeTable.capacity} คน
            </Tag>
          </Space>
          ) : 'เลือกคนเข้าโต๊ะ'
        }
        open={isAssignDrawerOpen}
        onClose={() => {
          setIsAssignDrawerOpen(false);
          setSelectedGuestIds([]);
          setUnassignedSearchText('');
        }}
        width={window.innerWidth > 768 ? 600 : '100%'}
        extra={
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              เลือกแล้ว: {selectedGuestIds.length} คน
            </Text>
            <Button 
              type="primary" 
              icon={<ArrowRightOutlined />}
              onClick={handleAddMultipleGuestsToTable}
              disabled={selectedGuestIds.length === 0}
            >
              เพิ่มเข้าโต๊ะ ({selectedGuestIds.length})
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="ค้นหาชื่อ, นามสกุล, หรือชื่อเล่น"
            value={unassignedSearchText}
            onChange={(e) => setUnassignedSearchText(e.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            size="large"
          />
        </div>

        {/* 🔧 แสดงจำนวน guests ที่ยังไม่ได้จัด */}
        {filteredUnassignedGuestItems.length === 0 && unassignedGuestItems.length === 0 && (
          <Alert
            message="ไม่พบแขกที่ยังไม่ได้จัดโต๊ะ"
            description="ไม่มี RSVP ที่ยังไม่ได้จัดโต๊ะ หรือ Guests ทั้งหมดถูกจัดโต๊ะแล้ว"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        {filteredUnassignedGuestItems.length === 0 && unassignedGuestItems.length > 0 && (
          <Alert
            message="ไม่พบผลลัพธ์จากการค้นหา"
            description={`พบ ${unassignedGuestItems.length} คนที่ยังไม่ได้จัด แต่ไม่ตรงกับคำค้นหา "${unassignedSearchText}"`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 🔧 แสดงรายการ guests ที่ยังไม่ได้จัดโต๊ะ */}
        <List
          itemLayout="horizontal"
          dataSource={filteredUnassignedGuestItems}
          locale={{ emptyText: 'ไม่พบ RSVP ที่ยังว่าง' }}
          renderItem={(item) => {
            const { guest, rsvp, groupName, isMainGuest, accompanyingIndex, accompanyingName } = item;
            
            if (!guest || !activeTable) {
              return null;
            }
            
            const currentTableGuests = guests.filter((g) => g.tableId === activeTable.tableId);
            const currentTableCount = currentTableGuests.length;
            const availableSlots = activeTable.capacity - currentTableCount;
            const isSelected = selectedGuestIds.includes(guest.id);
            // คำนวณว่าสามารถเลือกได้หรือไม่ (ต้องมีที่ว่างพอ)
            const alreadySelectedCount = selectedGuestIds.length;
            const canSelect = alreadySelectedCount < availableSlots || isSelected;
            
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
                style={{
                  backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
                  border: isSelected ? '1px solid #1890ff' : '1px solid transparent',
                  borderRadius: 8,
                  marginBottom: 8,
                  padding: '12px 16px',
                  cursor: canSelect ? 'pointer' : 'not-allowed',
                }}
                onClick={() => {
                  if (!canSelect && !isSelected) return;
                  
                  if (isSelected) {
                    setSelectedGuestIds(prev => prev.filter(id => id !== guest.id));
                  } else {
                    if (selectedGuestIds.length < availableSlots) {
                      setSelectedGuestIds(prev => [...prev, guest.id]);
                    } else {
                      message.warning(`เลือกได้สูงสุด ${availableSlots} คน (เหลือที่ว่าง ${availableSlots} ที่นั่ง)`);
                    }
                  }
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Checkbox
                      checked={isSelected}
                      disabled={!canSelect && !isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) {
                          if (selectedGuestIds.length < availableSlots) {
                            setSelectedGuestIds(prev => [...prev, guest.id]);
                          } else {
                            message.warning(`เลือกได้สูงสุด ${availableSlots} คน`);
                          }
                        } else {
                          setSelectedGuestIds(prev => prev.filter(id => id !== guest.id));
                        }
                      }}
                    />
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
                        {isMainGuest && (
                          <Tag color="purple" style={{ fontSize: 10 }}>
                            👤 ผู้แจ้ง
                          </Tag>
                        )}
                      </Space>
                      <div style={{ marginTop: 6 }}>
                        <Text style={{ fontSize: 13, fontWeight: 500 }}>
                          {guest.firstName} {guest.lastName}
                          {guest.nickname && <Text type="secondary"> ({guest.nickname})</Text>}
                        </Text>
                        {guest.relationToCouple && (
                          <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                            {guest.relationToCouple}
                          </div>
                        )}
                      </div>
                    </div>
                  }
                  description={
                    <Space size={4}>
                      <Tag style={{ fontSize: 10 }}>
                        {rsvp.side === 'groom' ? 'บ่าว' : rsvp.side === 'bride' ? 'สาว' : 'ทั้งคู่'}
                      </Tag>
                      {rsvp.note && (
                        <Tooltip title={rsvp.note}>
                          <Tag color="orange" style={{ fontSize: 10 }}>
                            📝 มีหมายเหตุ
                          </Tag>
                        </Tooltip>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Drawer>

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
