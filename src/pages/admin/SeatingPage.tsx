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
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isAssignMode, setIsAssignMode] = useState(false);
  const [searchText, setSearchText] = useState('');
  const seatingManager = new SeatingManager();

  const currentZone = zones.find((z) => z && z.id === selectedZoneId && z.zoneName);
  const tablesInCurrentZone = useMemo(
    () => tables
      .filter((t) => t && t.zoneId === selectedZoneId && t.tableId)
      .sort((a, b) => (a.order || 0) - (b.order || 0)),
    [selectedZoneId, tables]
  );

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

  // Get unassigned guests (no tableId) with search filter
  const unassignedGuests = useMemo(() => {
    let filtered = guests.filter(g => !g.tableId);
    
    // Apply search filter
    if (searchText && searchText.trim()) {
      const searchTerm = searchText.trim().toLowerCase();
      filtered = filtered.filter(g => {
        const name = `${g.firstName} ${g.lastName}`.toLowerCase();
        const relation = g.relationToCouple?.toLowerCase() || '';
        return name.includes(searchTerm) || relation.includes(searchTerm);
      });
    }
    
    return filtered;
  }, [guests, searchText]);

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

  // Handle guest click for assignment (รายบุคคล)
  const handleGuestClick = (guestId: string) => {
    setSelectedGuestId(guestId);
    setSelectedGroupId(null);
    setIsAssignMode(true);
    message.info('เลือกโต๊ะที่ต้องการจัดที่นั่ง');
  };

  // Handle group click for assignment (ทั้งกลุ่ม)
  const handleGroupClick = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedGuestId(null);
    setIsAssignMode(true);
    const group = guestGroups.find(g => g.groupId === groupId);
    if (group) {
      message.info(`เลือกโต๊ะที่ต้องการจัดที่นั่งสำหรับกลุ่ม "${group.groupName}" (${group.totalCount} คน)`);
    } else {
      message.info('เลือกโต๊ะที่ต้องการจัดที่นั่ง');
    }
  };

  // Handle table click for assignment
  const handleTableClick = async (table: TableData) => {
    if (isAssignMode) {
      try {
        if (selectedGroupId) {
          // จัดที่นั่งทั้งกลุ่ม
          await seatingManager.assignGroupToTable(selectedGroupId, table.id, table.zoneId);
          const group = guestGroups.find(g => g.groupId === selectedGroupId);
          message.success(`จัดที่นั่งกลุ่ม "${group?.groupName || ''}" สำเร็จ (${group?.totalCount || 0} คน)`);
        } else if (selectedGuestId) {
          // จัดที่นั่งรายบุคคล
          await seatingManager.assignGuestToTable(selectedGuestId, table.id, table.zoneId);
          message.success('จัดที่นั่งสำเร็จ');
        }
        setSelectedGuestId(null);
        setSelectedGroupId(null);
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
    setSelectedGroupId(null);
    setIsAssignMode(false);
    message.info('ยกเลิกการจัดที่นั่ง');
  };

  // Handle search select
  const handleSearchSelect = (value: string) => {
    if (value.startsWith('group:')) {
      const groupId = value.replace('group:', '');
      handleGroupClick(groupId);
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
              onSearch={setSearchText}
              onSelect={handleSearchSelect}
              placeholder="ค้นหาชื่อกลุ่ม / สมาชิก / ความสัมพันธ์"
              style={{ maxWidth: 400 }}
            />
          </div>

          <div className="flex gap-4">
            {/* Guest Sidebar */}
            <GuestSelectionSidebar
              guests={unassignedGuests}
              selectedGuestId={selectedGuestId}
              selectedGroupId={selectedGroupId}
              isAssignMode={isAssignMode}
              onGuestClick={handleGuestClick}
              onGroupClick={handleGroupClick}
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
                  return (
                    <DraggableTable
                      key={table.id}
                      table={table}
                      seatedGuests={seatedGuests}
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


