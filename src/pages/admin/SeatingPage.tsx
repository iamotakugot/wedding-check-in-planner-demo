/**
 * Admin Seating Page
 * จัดการที่นั่ง (Responsive & Mobile Friendly)
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, Button, Tabs, App, Modal, List, Tag, Space, Typography, Grid, Segmented, Progress, Alert } from 'antd';
import { PlusOutlined, AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useGuests } from '@/hooks/useGuests';
import { useZones } from '@/hooks/useZones';
import { useTables } from '@/hooks/useTables';
import { useGuestGroups } from '@/hooks/useGuestGroups';
import { GuestService } from '@/services/firebase/GuestService';
import { Zone, TableData, Guest } from '@/types';
import { ZoneService } from '@/services/firebase/ZoneService';
import { TableService } from '@/services/firebase/TableService';

import DraggableTable from '@/components/admin/DraggableTable';
import ZoneModal from '@/components/admin/ZoneModal';
import TableModal from '@/components/admin/TableModal';
import TableDetailModal from '@/components/admin/TableDetailModal';
import { debounceAsync } from '@/utils/debounce';
import { logger } from '@/utils/logger';
import { GRID_X_POSITIONS, GRID_Y_START, GRID_Y_STEP } from '@/constants/layout';

const { Text } = Typography;
const { useBreakpoint } = Grid;

const SeatingPage: React.FC = () => {
  const { message } = App.useApp();
  const { guests, isLoading: guestsLoading } = useGuests();
  const { zones, isLoading: zonesLoading } = useZones();
  const { tables, isLoading: tablesLoading } = useTables();
  const { guestGroups } = useGuestGroups();
  const zoneService = ZoneService.getInstance();
  const tableService = TableService.getInstance();
  const screens = useBreakpoint();

  // Initialize selectedZoneId
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

  // View Mode (Canvas vs List)
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');

  // Default to list view on mobile
  useEffect(() => {
    if (!screens.md && screens.xs) {
      setViewMode('list');
    }
  }, [screens.md, screens.xs]);



  const currentZone = zones.find((z) => z && z.id === selectedZoneId && z.zoneName);
  const tablesInCurrentZone = useMemo(
    () => tables
      .filter((t) => t && t.zoneId === selectedZoneId && t.tableId)
      .sort((a, b) => (a.order || 0) - (b.order || 0)),
    [selectedZoneId, tables]
  );

  // Count seated members per table
  const seatedMembersByTable = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tables) {
      if (t && t.tableId) {
        map.set(t.tableId, 0);
      }
    }
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

  // Guests by table map
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

  // Handle table click
  const handleTableClick = async (table: TableData) => {
    setSelectedTableId(table.id === selectedTableId ? null : table.id);
    setActiveTable(table);
    setIsDetailModalOpen(true);
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
        // Calculate next available position
        let newX = table.x;
        let newY = table.y;

        // If it's a new table (no ID yet, or just created), find a free spot
        // We check if the proposed position overlaps with any existing table
        const existingTables = tables.filter(t => t.zoneId === selectedZoneId);

        // Function to check overlap
        const isOverlapping = (x: number, y: number) => {
          return existingTables.some(t =>
            Math.abs(t.x - x) < 10 && Math.abs(t.y - y) < 10 // Increased threshold for safety
          );
        };

        // If the default position is taken, find the next available slot
        if (isOverlapping(newX, newY)) {
          let found = false;
          // Grid search: Top to bottom, Left to right
          for (let y = GRID_Y_START; y <= 100; y += GRID_Y_STEP) {
            for (const x of GRID_X_POSITIONS) {
              if (!isOverlapping(x, y)) {
                newX = x;
                newY = y;
                found = true;
                break;
              }
            }
            if (found) break;
          }
        }

        await tableService.create({
          ...table,
          x: newX,
          y: newY
        });
        message.success('เพิ่มโต๊ะเรียบร้อย');
      }
      setIsTableModalVisible(false);
      setEditingTable(null);
    } catch (error) {
      logger.error('Error saving table:', error);
      message.error('เกิดข้อผิดพลาด');
    }
  };

  const handleDeleteZoneByKey = async (zoneId: string) => {
    Modal.confirm({
      title: 'ยืนยันการลบ',
      content: 'คุณต้องการลบโซนนี้หรือไม่? (จะลบโต๊ะทั้งหมดในโซนนี้ด้วย)',
      onOk: async () => {
        try {
          const zone = zones.find(z => z && z.id === zoneId && z.zoneId);
          if (zone) {
            const tablesToDelete = tables.filter(t => t && t.zoneId === zone.zoneId);

            const { GuestService } = await import('@/services/firebase/GuestService');
            const guestService = GuestService.getInstance();

            for (const table of tablesToDelete) {
              const guestsInTable = guests.filter(g => g.tableId === table.tableId && g.zoneId === zone.zoneId);
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

  // Drag & Drop State
  const [dragIndex, setDragIndex] = useState(-1);
  const [dragOverIndex, setDragOverIndex] = useState(-1);

  // Sort zones by order
  const sortedZones = useMemo(() => {
    return [...zones].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [zones]);

  if (zonesLoading || tablesLoading || guestsLoading) {
    return <div className="p-6">Loading...</div>;
  }

  // Handle assign guests
  const handleAssignGuests = async (guestIds: string[]) => {
    if (!activeTable) return;
    try {
      const updates = guestIds.map(id => GuestService.getInstance().update(id, {
        tableId: activeTable.tableId,
        zoneId: activeTable.zoneId
      }));
      await Promise.all(updates);
      message.success('เพิ่มแขกเข้าโต๊ะเรียบร้อย');
    } catch (error) {
      logger.error('Error assigning guests:', error);
      message.error('เกิดข้อผิดพลาดในการเพิ่มแขก');
    }
  };

  // Handle unassign guest
  const handleUnassignGuest = async (guestId: string) => {
    try {
      await GuestService.getInstance().update(guestId, {
        tableId: null,
        zoneId: null
      });
      message.success('นำแขกออกจากโต๊ะเรียบร้อย');
    } catch (error) {
      logger.error('Error unassigning guest:', error);
      message.error('เกิดข้อผิดพลาดในการนำแขกออก');
    }
  };

  // Handle unassign all guests
  const handleUnassignAllGuests = async (guestIds: string[]) => {
    try {
      const updates = guestIds.map(id => GuestService.getInstance().update(id, {
        tableId: null,
        zoneId: null
      }));
      await Promise.all(updates);
      message.success('นำแขกทั้งหมดออกจากโต๊ะเรียบร้อย');
    } catch (error) {
      logger.error('Error unassigning all guests:', error);
      message.error('เกิดข้อผิดพลาดในการนำแขกทั้งหมดออก');
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h1 className="text-2xl font-bold text-gray-800 m-0">จัดการที่นั่ง</h1>
        <Space>
          {/* Mobile View Toggle */}
          <Segmented
            options={[
              { label: 'ผัง', value: 'canvas', icon: <AppstoreOutlined /> },
              { label: 'รายการ', value: 'list', icon: <UnorderedListOutlined /> },
            ]}
            value={viewMode}
            onChange={(val) => setViewMode(val as 'canvas' | 'list')}
            className="md:hidden"
          />
        </Space>
      </div>

      {/* Mobile Hint */}
      {!screens.md && (
        <Alert
          message="แนะนำ: ใช้มุมมอง 'รายการ' เพื่อการจัดการที่ง่ายขึ้นบนมือถือ"
          type="info"
          showIcon
          closable
          className="mb-4"
        />
      )}

      <Tabs
        type="editable-card"
        activeKey={selectedZoneId || undefined}
        onChange={setSelectedZoneId}
        size="small"
        className="responsive-tabs"
        renderTabBar={(props, DefaultTabBar) => (
          <DefaultTabBar {...props}>
            {(node) => {
              // Ensure items exist before trying to find index
              const items = (props as any).items;
              if (!items) return node;
              const index = items.findIndex((item: any) => item.key === node.key);
              if (index === -1) return node;

              return (
                <div
                  key={node.key}
                  draggable
                  onDragStart={(e) => {
                    setDragIndex(index);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnter={() => setDragOverIndex(index)}
                  onDragEnd={async () => {
                    if (dragIndex !== -1 && dragOverIndex !== -1 && dragIndex !== dragOverIndex) {
                      const newZones = [...sortedZones];
                      const [draggedItem] = newZones.splice(dragIndex, 1);
                      newZones.splice(dragOverIndex, 0, draggedItem);

                      try {
                        const updates = newZones.map((z, i) => zoneService.update(z.id, { order: i + 1 }));
                        await Promise.all(updates);
                        message.success('จัดลำดับโซนเรียบร้อย');
                      } catch (error) {
                        logger.error('Error reordering zones:', error);
                        message.error('เกิดข้อผิดพลาดในการจัดลำดับ');
                      }
                    }
                    setDragIndex(-1);
                    setDragOverIndex(-1);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  style={{ cursor: 'move', display: 'inline-flex' }}
                  className={`draggable-tab ${dragOverIndex === index ? 'drag-over' : ''}`}
                >
                  {node}
                </div>
              );
            }}
          </DefaultTabBar>
        )}
        onEdit={(targetKey, action) => {
          if (action === 'add') {
            setEditingZone(null);
            setIsZoneModalVisible(true);
          } else if (action === 'remove' && typeof targetKey === 'string') {
            const zoneToDelete = zones.find(z => z && z.id === targetKey);
            if (zoneToDelete) {
              handleDeleteZoneByKey(targetKey);
            }
          }
        }}
        items={sortedZones
          .filter((zone): zone is Zone => !!(zone && zone.id && zone.zoneName))
          .map(zone => ({
            key: zone.id,
            closable: zones.length > 1,
            label: (
              <span
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingZone(zone);
                  setIsZoneModalVisible(true);
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
                        const { GuestService } = await import('@/services/firebase/GuestService');
                        const guestService = GuestService.getInstance();
                        for (const table of tablesToDelete) {
                          const guestsInTable = guests.filter(g => g.tableId === table.tableId && g.zoneId === zone.zoneId);
                          for (const guest of guestsInTable) {
                            await guestService.update(guest.id, { tableId: null, zoneId: null });
                          }
                          await tableService.delete(table.id);
                        }
                        await zoneService.delete(zone.id);
                        message.success('ลบโซนเรียบร้อย');
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
                title="ดับเบิ้ลคลิกเพื่อแก้ไขโซน | คลิกขวาเพื่อลบโซน"
              >
                {zone.zoneName || 'ไม่มีชื่อ'}
              </span>
            ),
          }))}
      />

      {currentZone && (
        <div className="mt-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Main Content Area */}
            <Card
              className="flex-1 shadow-sm min-w-0"
              title={
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">{currentZone?.zoneName || 'ไม่มีชื่อโซน'}</span>
                  {currentZone && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setEditingTable(null);
                        setIsTableModalVisible(true);
                      }}
                      size="small"
                    >
                      เพิ่มโต๊ะ
                    </Button>
                  )}
                </div>
              }
              styles={{ body: { padding: '16px' } }}
            >
              {viewMode === 'canvas' && (screens.md || viewMode === 'canvas') ? (
                <div
                  id="layout-canvas"
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: 'calc(100vh - 220px)',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa',
                    overflow: 'auto',
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
                          isAssignMode={false}
                          disabled={false}
                          isSelected={selectedTableId === table.id}
                          selectedCount={0}
                          onOpenDetail={(t: TableData) => {
                            setActiveTable(t);
                            setIsDetailModalOpen(true);
                            setSelectedTableId(t.id);
                          }}
                        />
                      );
                    })}
                </div>
              ) : (
                // List View for Mobile
                <List
                  grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 6 }}
                  dataSource={tablesInCurrentZone}
                  renderItem={table => {
                    const seatedMemberCount = seatedMembersByTable.get(table.tableId) || 0;
                    const isFull = seatedMemberCount >= table.capacity;
                    return (
                      <List.Item>
                        <Card
                          hoverable
                          onClick={() => handleTableClick(table)}
                          className={`border-2 ${selectedTableId === table.id ? 'border-blue-500' : 'border-transparent'}`}
                          size="small"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <Text strong>{table.tableName}</Text>
                            <Tag color={isFull ? 'red' : 'green'}>{seatedMemberCount}/{table.capacity}</Tag>
                          </div>
                          <Progress
                            percent={Math.round((seatedMemberCount / table.capacity) * 100)}
                            showInfo={false}
                            size="small"
                            status={isFull ? 'exception' : 'active'}
                          />
                          <div className="mt-2 text-xs text-gray-500 text-center">
                            แตะเพื่อจัดการ
                          </div>
                          <div className="text-center mt-2">
                            <Button size="small" type="primary" ghost onClick={(e) => {
                              e.stopPropagation();
                              setActiveTable(table);
                              setIsDetailModalOpen(true);
                            }}>ดูแขก</Button>
                          </div>
                        </Card>
                      </List.Item>
                    );
                  }}
                />
              )}
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

      <TableDetailModal
        visible={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setActiveTable(null);
          setSelectedTableId(null);
        }}
        table={activeTable}
        guests={guestsByTable.get(activeTable?.tableId || '') || []}
        allGuests={guests}
        tables={tables}
        guestGroups={guestGroups}
        onAssignGuests={handleAssignGuests}
        onUnassignGuest={handleUnassignGuest}
        onUnassignAllGuests={handleUnassignAllGuests}
      />

    </div>
  );
};

export default SeatingPage;
