/**
 * Admin Seating Page
 * จัดการที่นั่ง (เรียบง่าย, มี debounce)
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, Button, Tabs, App, Modal, Drawer, Input } from 'antd';
import { PlusOutlined, MenuOutlined } from '@ant-design/icons';
import { useGuests } from '@/hooks/useGuests';
import { useZones } from '@/hooks/useZones';
import { useTables } from '@/hooks/useTables';
import { useGuestGroups } from '@/hooks/useGuestGroups';
import { Zone, TableData, Guest } from '@/types';
import { ZoneService } from '@/services/firebase/ZoneService';
import { TableService } from '@/services/firebase/TableService';
import { SeatingManager } from '@/managers/SeatingManager';
import DraggableTable from '@/components/admin/DraggableTable';
import ZoneModal from '@/components/admin/ZoneModal';
import TableModal from '@/components/admin/TableModal';
import TableDetailModal from '@/components/admin/TableDetailModal';
import GuestSelectionSidebar from '@/components/admin/GuestSelectionSidebar';
import { debounceAsync } from '@/utils/debounce';
import { logger } from '@/utils/logger';
import { renderMemberLabel } from '@/utils/guestHelpers';

// Tabs component used directly

const SeatingPage: React.FC = () => {
  const { message } = App.useApp();
  const { guests, isLoading: guestsLoading } = useGuests();
  const { zones, isLoading: zonesLoading } = useZones();
  const { tables, isLoading: tablesLoading } = useTables();
  const { guestGroups } = useGuestGroups();
  const zoneService = ZoneService.getInstance();
  const tableService = TableService.getInstance();

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
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  
  // Click-based assignment state
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [isAssignMode, setIsAssignMode] = useState(false);
  const [sidebarDrawerVisible, setSidebarDrawerVisible] = useState(false);
  const [editingZoneKey, setEditingZoneKey] = useState<string | null>(null);
  const [editingZoneName, setEditingZoneName] = useState<string>('');
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

  // Handle table click for assignment or selection
  const handleTableClick = async (table: TableData) => {
    // Bulk assignment: if multiple guests selected
    if (selectedGuestIds.length > 0) {
      try {
        let successCount = 0;
        let failCount = 0;
        
        for (const guestId of selectedGuestIds) {
          try {
            await seatingManager.assignGuestToTable(guestId, table.tableId, table.zoneId);
            successCount++;
          } catch (error) {
            failCount++;
            logger.error(`Error assigning guest ${guestId}:`, error);
          }
        }
        
        if (successCount > 0) {
          message.success(`จัดที่นั่ง ${successCount} คนสำเร็จ${failCount > 0 ? ` (${failCount} คนไม่สำเร็จ)` : ''}`);
        } else {
          message.error(`ไม่สามารถจัดที่นั่งได้ (${failCount} คน)`);
        }
        
        setSelectedGuestIds([]);
        setSelectedGuestId(null);
        setIsAssignMode(false);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
        message.error(errorMessage);
      }
      return;
    }
    
    if (isAssignMode && selectedGuestId) {
      // Single assignment mode: assign guest to table
      try {
        // จัดที่นั่งรายบุคคล
        await seatingManager.assignGuestToTable(selectedGuestId, table.tableId, table.zoneId);
        
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
    } else {
      // Selection mode: select table
      setSelectedTableId(table.id === selectedTableId ? null : table.id);
    }
  };

  // Cancel assignment mode
  const handleCancelAssign = () => {
    setSelectedGuestId(null);
    setSelectedGuestIds([]);
    setIsAssignMode(false);
    message.info('ยกเลิกการจัดที่นั่ง');
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


  // Handle delete zone by key (used by editable tabs)
  const handleDeleteZoneByKey = async (zoneId: string) => {
    Modal.confirm({
      title: 'ยืนยันการลบ',
      content: 'คุณต้องการลบโซนนี้หรือไม่? (จะลบโต๊ะทั้งหมดในโซนนี้ด้วย)',
      onOk: async () => {
        try {
          const zone = zones.find(z => z && z.id === zoneId && z.zoneId);
          if (zone) {
            const tablesToDelete = tables.filter(t => t && t.zoneId === zone.zoneId);
            
            // Clear tableId/zoneId ของ guests ที่ถูก assign ไปยังโต๊ะ/โซนที่ถูกลบ
            const { GuestService } = await import('@/services/firebase/GuestService');
            const guestService = GuestService.getInstance();
            
            for (const table of tablesToDelete) {
              // หา guests ที่ถูก assign ไปยังโต๊ะนี้
              const guestsInTable = guests.filter(g => g.tableId === table.tableId && g.zoneId === zone.zoneId);
              
              // Clear tableId/zoneId ของ guests เหล่านี้
              for (const guest of guestsInTable) {
                await guestService.update(guest.id, {
                  tableId: null,
                  zoneId: null,
                });
              }
              
              await tableService.delete(table.id);
            }
            
            await zoneService.delete(zoneId);
            message.success('ลบโซนเรียบร้อย');
            
            // Force refresh selectedZoneId if deleted zone was selected
            if (selectedZoneId === zoneId) {
              const remainingZones = zones.filter(z => z.id !== zoneId);
              if (remainingZones.length > 0) {
                setSelectedZoneId(remainingZones[0].id);
              } else {
                setSelectedZoneId('');
              }
            }
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
    <div className="p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2 sm:gap-3">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">จัดการที่นั่ง</h1>
        <Button
          icon={<MenuOutlined />}
          onClick={() => setSidebarDrawerVisible(true)}
          className="md:hidden w-full sm:w-auto"
          size="middle"
        >
          เปิดรายชื่อแขก
        </Button>
      </div>

      <Tabs
        type="editable-card"
        activeKey={selectedZoneId || undefined}
        onChange={setSelectedZoneId}
        size="small"
        className="responsive-tabs"
        onEdit={(targetKey, action) => {
          if (action === 'add') {
            // เพิ่มโซนใหม่
            setEditingZone(null);
            setIsZoneModalVisible(true);
          } else if (action === 'remove' && typeof targetKey === 'string') {
            // ลบโซน
            const zoneToDelete = zones.find(z => z && z.id === targetKey);
            if (zoneToDelete) {
              handleDeleteZoneByKey(targetKey);
            }
          }
        }}
        items={zones
          .filter((zone): zone is Zone => !!(zone && zone.id && zone.zoneName))
          .map(zone => ({
            key: zone.id,
            closable: zones.length > 1, // ไม่ให้ลบถ้ามีโซนเดียว
            label: editingZoneKey === zone.id ? (
              <Input
                value={editingZoneName}
                onChange={(e) => setEditingZoneName(e.target.value)}
                onBlur={async () => {
                  if (editingZoneName.trim() && editingZoneName !== zone.zoneName) {
                    try {
                      await zoneService.update(zone.id, {
                        ...zone,
                        zoneName: editingZoneName.trim(),
                      });
                      message.success('แก้ไขชื่อโซนเรียบร้อย');
                    } catch (error) {
                      logger.error('Error updating zone name:', error);
                      message.error('เกิดข้อผิดพลาด');
                      setEditingZoneName(zone.zoneName || '');
                    }
                  } else {
                    setEditingZoneName(zone.zoneName || '');
                  }
                  setEditingZoneKey(null);
                }}
                onPressEnter={async (e) => {
                  e.currentTarget.blur();
                }}
                onClick={(e) => e.stopPropagation()}
                style={{ width: 150, minWidth: 100 }}
                autoFocus
                size="small"
              />
            ) : (
              <span
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingZoneKey(zone.id);
                  setEditingZoneName(zone.zoneName || '');
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  Modal.confirm({
                    title: 'ยืนยันการลบ',
                    content: 'คุณต้องการลบโซนนี้หรือไม่? (จะลบโต๊ะทั้งหมดในโซนนี้ด้วย)',
                    onOk: async () => {
                      try {
                        const tablesToDelete = tables.filter(t => t && t.zoneId === zone.zoneId);
                        
                        // Clear tableId/zoneId ของ guests ที่ถูก assign ไปยังโต๊ะ/โซนที่ถูกลบ
                        const { GuestService } = await import('@/services/firebase/GuestService');
                        const guestService = GuestService.getInstance();
                        
                        for (const table of tablesToDelete) {
                          // หา guests ที่ถูก assign ไปยังโต๊ะนี้
                          const guestsInTable = guests.filter(g => g.tableId === table.tableId && g.zoneId === zone.zoneId);
                          
                          // Clear tableId/zoneId ของ guests เหล่านี้
                          for (const guest of guestsInTable) {
                            await guestService.update(guest.id, {
                              tableId: null,
                              zoneId: null,
                            });
                          }
                          
                          await tableService.delete(table.id);
                        }
                        
                        await zoneService.delete(zone.id);
                        message.success('ลบโซนเรียบร้อย');
                        
                        // Force refresh selectedZoneId if deleted zone was selected
                        if (selectedZoneId === zone.id) {
                          const remainingZones = zones.filter(z => z.id !== zone.id);
                          if (remainingZones.length > 0) {
                            setSelectedZoneId(remainingZones[0].id);
                          } else {
                            setSelectedZoneId('');
                          }
                        }
                      } catch (error) {
                        logger.error('Error deleting zone:', error);
                        message.error('เกิดข้อผิดพลาด');
                      }
                    },
                  });
                }}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title="ดับเบิ้ลคลิกเพื่อแก้ไขชื่อโซน | คลิกขวาเพื่อลบโซน"
              >
                {zone.zoneName || 'ไม่มีชื่อ'}
              </span>
            ),
          }))}
      />

      {currentZone && (
        <div className="mt-4">

          <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
            {/* Guest Sidebar - Hidden on mobile, shown in drawer */}
            <div className="hidden md:block flex-shrink-0">
              <GuestSelectionSidebar
                guests={guests}
                selectedGuestId={selectedGuestId}
                selectedGuestIds={selectedGuestIds}
                isAssignMode={isAssignMode}
                onGuestClick={handleGuestClick}
                onMemberClick={handleMemberClick}
                onCancelAssign={handleCancelAssign}
                onGuestIdsChange={setSelectedGuestIds}
                guestGroups={guestGroups}
              />
            </div>
            
            {/* Drawer for mobile */}
            <Drawer
              title="แขกที่ยังไม่ได้จัดที่นั่ง"
              placement="left"
              onClose={() => setSidebarDrawerVisible(false)}
              open={sidebarDrawerVisible}
              width="85%"
              styles={{ body: { padding: '12px' } }}
              style={{ maxWidth: 400 }}
            >
              <GuestSelectionSidebar
                guests={guests}
                selectedGuestId={selectedGuestId}
                selectedGuestIds={selectedGuestIds}
                isAssignMode={isAssignMode}
                onGuestClick={(id) => {
                  handleGuestClick(id);
                  setSidebarDrawerVisible(false);
                }}
                onMemberClick={(id) => {
                  handleMemberClick(id);
                  setSidebarDrawerVisible(false);
                }}
                onCancelAssign={handleCancelAssign}
                onGuestIdsChange={setSelectedGuestIds}
                guestGroups={guestGroups}
              />
            </Drawer>

          {/* Canvas Area */}
          <Card 
            className="flex-1 shadow-sm min-w-0"
            title={
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-sm sm:text-base md:text-lg font-semibold truncate flex-1 min-w-0">
                  {currentZone?.zoneName || 'ไม่มีชื่อโซน'}
                </span>
                {currentZone && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingTable(null);
                      setIsTableModalVisible(true);
                    }}
                    size="small"
                    className="flex-shrink-0"
                  >
                    <span className="hidden sm:inline">เพิ่มโต๊ะ</span>
                    <span className="sm:hidden">เพิ่ม</span>
                  </Button>
                )}
              </div>
            }
            styles={{ body: { padding: '12px sm:16px' } }}
          >
            <div
              id="layout-canvas"
              style={{
                position: 'relative',
                width: '100%',
                height: '300px',
                minHeight: '300px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: '#fafafa',
                overflow: 'auto',
              }}
              className="sm:h-[400px] md:h-[500px] lg:h-[600px]"
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
                      isAssignMode={isAssignMode || selectedGuestIds.length > 0}
                      disabled={isAssignMode}
                      isSelected={selectedTableId === table.id}
                      selectedCount={selectedGuestIds.length}
                      onOpenDetail={(t: TableData) => {
                        setActiveTable(t);
                        setIsDetailModalOpen(true);
                        setSelectedTableId(t.id);
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
            setSelectedTableId(null);
          }}
          table={activeTable}
          guests={guestsByTable.get(activeTable.tableId) || []}
          guestGroups={guestGroups}
          onUnassignGuest={async (guestId: string) => {
            try {
              // Unassign guest from table using SeatingManager
              await seatingManager.unassignGuestFromTable(guestId);
              message.success('ย้ายแขกออกจากโต๊ะเรียบร้อย');
            } catch (error) {
              logger.error('Error unassigning guest:', error);
              message.error('เกิดข้อผิดพลาด');
            }
          }}
          onUnassignGuests={async (guestIds: string[]) => {
            try {
              let successCount = 0;
              let failCount = 0;
              
              for (const guestId of guestIds) {
                try {
                  await seatingManager.unassignGuestFromTable(guestId);
                  successCount++;
                } catch (error) {
                  failCount++;
                  logger.error(`Error unassigning guest ${guestId}:`, error);
                }
              }
              
              if (successCount > 0) {
                message.success(`ย้าย ${successCount} คนออกจากโต๊ะเรียบร้อย${failCount > 0 ? ` (${failCount} คนไม่สำเร็จ)` : ''}`);
              } else {
                message.error(`ไม่สามารถย้ายออกได้ (${failCount} คน)`);
              }
            } catch (error) {
              logger.error('Error unassigning guests:', error);
              message.error('เกิดข้อผิดพลาด');
            }
          }}
        />
      )}
    </div>
  );
};

export default SeatingPage;


