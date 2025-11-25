/**
 * Admin Seating Page
 * จัดการที่นั่ง (เรียบง่าย, มี debounce)
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, Button, Space, Tabs, message, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useGuests } from '@/hooks/useGuests';
import { useZones } from '@/hooks/useZones';
import { useTables } from '@/hooks/useTables';
import { useGuestGroups } from '@/hooks/useGuestGroups';
import { Zone, TableData, Guest } from '@/types';
import { ZoneService } from '@/services/firebase/ZoneService';
import { TableService } from '@/services/firebase/TableService';
import { GuestService } from '@/services/firebase/GuestService';
import { SeatingManager } from '@/managers/SeatingManager';
import DraggableTable from '@/components/admin/DraggableTable';
import ZoneModal from '@/components/admin/ZoneModal';
import TableModal from '@/components/admin/TableModal';
import TableDetailModal from '@/components/admin/TableDetailModal';
import GuestSelectionSidebar from '@/components/admin/GuestSelectionSidebar';
import SeatingSearchInput from '@/components/admin/SeatingSearchInput';
import { debounceAsync } from '@/utils/debounce';
import { logger } from '@/utils/logger';
import { renderMemberLabel } from '@/utils/guestHelpers';

// Tabs component used directly

const SeatingPage: React.FC = () => {
  const { guests, isLoading: guestsLoading } = useGuests();
  const { zones, isLoading: zonesLoading } = useZones();
  const { tables, isLoading: tablesLoading } = useTables();
  const { guestGroups } = useGuestGroups();
  const zoneService = ZoneService.getInstance();
  const tableService = TableService.getInstance();
  const guestService = GuestService.getInstance();

  // Initialize selectedZoneId with first valid zone
  // Use useEffect to update when zones load
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  
  useEffect(() => {
    if (zones.length > 0 && !selectedZoneId) {
      const firstValidZone = zones.find(z => z && z.id && z.zoneName);
      if (firstValidZone) {
        setSelectedZoneId(firstValidZone.id);
      }
    }
  }, [zones, selectedZoneId]);

  const [isZoneModalVisible, setIsZoneModalVisible] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [isTableModalVisible, setIsTableModalVisible] = useState(false);
  const [editingTable, setEditingTable] = useState<TableData | null>(null);
  const [activeTable, setActiveTable] = useState<TableData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Click-based assignment state
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [isAssignMode, setIsAssignMode] = useState(false);
  const seatingManager = new SeatingManager();

  const currentZone = zones.find((z) => z && z.id === selectedZoneId && z.zoneName);
  const tablesInCurrentZone = useMemo(
    () => tables
      .filter((t) => t && t.zoneId === selectedZoneId && t.tableId)
      .sort((a, b) => (a.order || 0) - (b.order || 0)),
    [selectedZoneId, tables]
  );

  // Count seated members per table (from guestGroups)
  const seatedMembersByTable = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tables) {
      if (t && t.tableId) {
        map.set(t.tableId, 0);
      }
    }
    // Count members with seat assignments
    for (const group of guestGroups) {
      for (const member of group.members) {
        if (member.seat?.tableId) {
          const currentCount = map.get(member.seat.tableId) || 0;
          map.set(member.seat.tableId, currentCount + 1);
        }
      }
    }
    return map;
  }, [guestGroups, tables]);

  // Keep guestsByTable for components that need Guest objects (backward compatibility)
  const guestsByTable = useMemo(() => {
    const map = new Map<string, Guest[]>();
    for (const t of tables) {
      if (t && t.tableId) {
        map.set(t.tableId, []);
      }
    }
    for (const g of guests) {
      if (g && g.tableId) {
        const list = map.get(g.tableId) || [];
        list.push(g);
        map.set(g.tableId, list);
      }
    }
    return map;
  }, [guests, tables]);

  // Note: GuestSelectionSidebar uses guestGroups directly for members
  // and filters guests prop internally for individual guests

  // Table position update handler
  const handleTablePositionUpdate = useCallback(
    debounceAsync(async (id: string, newX: number, newY: number) => {
      try {
        await tableService.update(id, { x: newX, y: newY });
      } catch (error) {
        logger.error('Error updating table position:', error);
        message.error('เกิดข้อผิดพลาดในการอัปเดตตำแหน่งโต๊ะ');
      }
    }, 300),
    []
  );

  // Handle guest/member click for assignment (รายบุคคล)
  const handleGuestClick = (guestId: string) => {
    setSelectedGuestId(guestId);
    setIsAssignMode(true);
    
    // Find member in groups to show proper label
    let memberLabel = '';
    for (const group of guestGroups) {
      const member = group.members.find(m => m.id === guestId);
      if (member) {
        memberLabel = renderMemberLabel(group, member);
        break;
      }
    }
    
    if (memberLabel) {
      message.info(`เลือกโต๊ะสำหรับ ${memberLabel}`);
    } else {
      const guest = guests.find(g => g.id === guestId);
      const guestName = guest ? `${guest.firstName} ${guest.lastName}`.trim() : 'แขก';
      message.info(`เลือกโต๊ะสำหรับ ${guestName}`);
    }
  };

  // Handle member click (same as guest click for now)
  const handleMemberClick = (memberId: string) => {
    handleGuestClick(memberId);
  };

  // Handle table click for assignment
  const handleTableClick = async (table: TableData) => {
    if (isAssignMode && selectedGuestId) {
      try {
        // จัดที่นั่งรายบุคคล
        await seatingManager.assignGuestToTable(selectedGuestId, table.id, table.zoneId);
        
        // Find member in groups to show proper success message
        let memberLabel = '';
        for (const group of guestGroups) {
          const member = group.members.find(m => m.id === selectedGuestId);
          if (member) {
            memberLabel = renderMemberLabel(group, member);
            break;
          }
        }
        
        if (memberLabel) {
          message.success(`จัดที่นั่ง ${memberLabel} สำเร็จ`);
        } else {
          const guest = guests.find(g => g.id === selectedGuestId);
          const guestName = guest ? `${guest.firstName} ${guest.lastName}`.trim() : 'แขก';
          message.success(`จัดที่นั่ง ${guestName} สำเร็จ`);
        }
        
        setSelectedGuestId(null);
        setIsAssignMode(false);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
        message.error(errorMessage);
      }
    }
  };

  // Cancel assignment mode
  const handleCancelAssign = () => {
    setSelectedGuestId(null);
    setIsAssignMode(false);
    message.info('ยกเลิกการจัดที่นั่ง');
  };

  // Handle search select
  const handleSearchSelect = (value: string) => {
    if (value.startsWith('member:')) {
      const memberId = value.replace('member:', '');
      handleMemberClick(memberId);
    } else if (value.startsWith('guest:')) {
      const guestId = value.replace('guest:', '');
      handleGuestClick(guestId);
    }
  };

  const handleZoneSubmit = async (zone: Zone) => {
    try {
      if (editingZone) {
        await zoneService.update(zone.id, zone);
        message.success('อัพเดทโซนเรียบร้อย');
      } else {
        await zoneService.create(zone);
        message.success('เพิ่มโซนเรียบร้อย');
      }
      setIsZoneModalVisible(false);
      setEditingZone(null);
    } catch (error) {
      logger.error('Error saving zone:', error);
      message.error('เกิดข้อผิดพลาด');
    }
  };

  const handleTableSubmit = async (table: TableData) => {
    try {
      if (editingTable) {
        await tableService.update(table.id, table);
        message.success('อัพเดทโต๊ะเรียบร้อย');
      } else {
        await tableService.create(table);
        message.success('เพิ่มโต๊ะเรียบร้อย');
      }
      setIsTableModalVisible(false);
      setEditingTable(null);
    } catch (error) {
      logger.error('Error saving table:', error);
      message.error('เกิดข้อผิดพลาด');
    }
  };

  const handleDeleteZone = async (id: string) => {
    Modal.confirm({
      title: 'ยืนยันการลบ',
      content: 'คุณต้องการลบโซนนี้หรือไม่? (จะลบโต๊ะทั้งหมดในโซนนี้ด้วย)',
      onOk: async () => {
        try {
          const zone = zones.find(z => z && z.id === id && z.zoneId);
          if (zone) {
            const tablesToDelete = tables.filter(t => t && t.zoneId === zone.zoneId);
            for (const table of tablesToDelete) {
              await tableService.delete(table.id);
            }
            await zoneService.delete(id);
            message.success('ลบโซนเรียบร้อย');
          }
        } catch (error) {
          logger.error('Error deleting zone:', error);
          message.error('เกิดข้อผิดพลาด');
        }
      },
    });
  };

  // Table deletion handled in TableDetailModal or can be added later

  if (zonesLoading || tablesLoading || guestsLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">จัดการที่นั่ง</h1>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingZone(null);
              setIsZoneModalVisible(true);
            }}
          >
            เพิ่มโซน
          </Button>
          {currentZone && (
            <Button
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingTable(null);
                setIsTableModalVisible(true);
              }}
            >
              เพิ่มโต๊ะ
            </Button>
          )}
        </Space>
      </div>

      <Tabs
        activeKey={selectedZoneId || undefined}
        onChange={setSelectedZoneId}
        items={zones
          .filter((zone): zone is Zone => !!(zone && zone.id && zone.zoneName))
          .map(zone => ({
            key: zone.id,
            label: zone.zoneName || 'ไม่มีชื่อ',
          }))}
      />

      {currentZone && (
        <div className="mt-4">
          {/* Search Input */}
          <div className="mb-4">
            <SeatingSearchInput
              guests={guests}
              guestGroups={guestGroups}
              onSearch={() => {}} // Search handled internally by SeatingSearchInput
              onSelect={handleSearchSelect}
              placeholder="ค้นหาชื่อกลุ่ม / สมาชิก / ความสัมพันธ์"
              style={{ maxWidth: 400 }}
            />
          </div>

          <div className="flex gap-4">
            {/* Guest Sidebar */}
            <GuestSelectionSidebar
              guests={guests}
              selectedGuestId={selectedGuestId}
              isAssignMode={isAssignMode}
              onGuestClick={handleGuestClick}
              onMemberClick={handleMemberClick}
              onCancelAssign={handleCancelAssign}
              guestGroups={guestGroups}
            />

          {/* Canvas Area */}
          <Card className="flex-1">
            <div className="mb-4">
              <Space>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditingZone(currentZone);
                    setIsZoneModalVisible(true);
                  }}
                >
                  แก้ไขโซน
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteZone(currentZone.id)}
                >
                  ลบโซน
                </Button>
              </Space>
            </div>

            <div
              id="layout-canvas"
              style={{
                position: 'relative',
                width: '100%',
                height: '600px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: '#fafafa',
                overflow: 'hidden',
              }}
            >
              {tablesInCurrentZone
                .filter(table => table && table.id && table.tableId)
                .map(table => {
                  const seatedGuests = guestsByTable.get(table.tableId) || [];
                  const seatedMemberCount = seatedMembersByTable.get(table.tableId) || 0;
                  return (
                    <DraggableTable
                      key={table.id}
                      table={table}
                      seatedGuests={seatedGuests}
                      seatedMemberCount={seatedMemberCount}
                      zoneColor={currentZone?.color || '#1890ff'}
                      onTablePositionUpdate={handleTablePositionUpdate}
                      onTableClick={handleTableClick}
                      isAssignMode={isAssignMode}
                      disabled={isAssignMode}
                      onOpenDetail={(t: TableData) => {
                        setActiveTable(t);
                        setIsDetailModalOpen(true);
                      }}
                    />
                  );
                })}
            </div>
          </Card>
          </div>
        </div>
      )}

      <ZoneModal
        visible={isZoneModalVisible}
        onClose={() => {
          setIsZoneModalVisible(false);
          setEditingZone(null);
        }}
        zoneToEdit={editingZone}
        onSubmit={handleZoneSubmit}
      />

      <TableModal
        visible={isTableModalVisible}
        onClose={() => {
          setIsTableModalVisible(false);
          setEditingTable(null);
        }}
        tableToEdit={editingTable}
        zone={currentZone || { id: '', zoneId: '', zoneName: '', description: '', capacity: 0, color: '#1890ff', order: 0 }}
        onSubmit={handleTableSubmit}
      />

      {activeTable && (
        <TableDetailModal
          visible={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setActiveTable(null);
          }}
          table={activeTable}
          guests={guestsByTable.get(activeTable.tableId) || []}
          guestGroups={guestGroups}
          onUnassignGuest={async (guestId: string) => {
            try {
              await guestService.update(guestId, { tableId: null, zoneId: null });
              message.success('ยกเลิกการจัดที่นั่งเรียบร้อย');
            } catch (error) {
              logger.error('Error unassigning guest:', error);
              message.error('เกิดข้อผิดพลาด');
            }
          }}
        />
      )}
    </div>
  );
};

export default SeatingPage;


