/**
 * Admin Seating Page
 * จัดการที่นั่ง (เรียบง่าย, มี debounce)
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Card, Button, Space, Tabs, message, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useGuests } from '@/hooks/useGuests';
import { useZones } from '@/hooks/useZones';
import { useTables } from '@/hooks/useTables';
import { Zone, TableData, Guest } from '@/types';
import { ZoneService } from '@/services/firebase/ZoneService';
import { TableService } from '@/services/firebase/TableService';
import { GuestService } from '@/services/firebase/GuestService';
import DraggableTable from '@/pages/SeatingManagementPage/components/DraggableTable';
import ZoneModal from '@/pages/SeatingManagementPage/components/ZoneModal';
import TableModal from '@/pages/SeatingManagementPage/components/TableModal';
import TableDetailModal from '@/pages/SeatingManagementPage/components/TableDetailModal';
import { debounce } from '@/utils/debounce';

// Tabs component used directly

const SeatingPage: React.FC = () => {
  const { guests, isLoading: guestsLoading } = useGuests();
  const { zones, isLoading: zonesLoading } = useZones();
  const { tables, isLoading: tablesLoading } = useTables();
  const zoneService = ZoneService.getInstance();
  const tableService = TableService.getInstance();
  const guestService = GuestService.getInstance();

  const [selectedZoneId, setSelectedZoneId] = useState<string>(zones[0]?.id || '');
  const [isZoneModalVisible, setIsZoneModalVisible] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [isTableModalVisible, setIsTableModalVisible] = useState(false);
  const [editingTable, setEditingTable] = useState<TableData | null>(null);
  const [activeTable, setActiveTable] = useState<TableData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const currentZone = zones.find((z) => z.id === selectedZoneId);
  const tablesInCurrentZone = useMemo(
    () => tables.filter((t) => t.zoneId === selectedZoneId).sort((a, b) => a.order - b.order),
    [selectedZoneId, tables]
  );

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

  // Table position update handler
  const handleTablePositionUpdate = useCallback(
    debounce(async (id: string, newX: number, newY: number) => {
      try {
        await tableService.update(id, { x: newX, y: newY });
      } catch (error) {
        console.error('Error updating table position:', error);
        message.error('เกิดข้อผิดพลาดในการอัปเดตตำแหน่งโต๊ะ');
      }
    }, 300) as (id: string, newX: number, newY: number) => void,
    []
  );

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
      console.error('Error saving zone:', error);
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
      console.error('Error saving table:', error);
      message.error('เกิดข้อผิดพลาด');
    }
  };

  const handleDeleteZone = async (id: string) => {
    Modal.confirm({
      title: 'ยืนยันการลบ',
      content: 'คุณต้องการลบโซนนี้หรือไม่? (จะลบโต๊ะทั้งหมดในโซนนี้ด้วย)',
      onOk: async () => {
        try {
          const zone = zones.find(z => z.id === id);
          if (zone) {
            const tablesToDelete = tables.filter(t => t.zoneId === zone.zoneId);
            for (const table of tablesToDelete) {
              await tableService.delete(table.id);
            }
            await zoneService.delete(id);
            message.success('ลบโซนเรียบร้อย');
          }
        } catch (error) {
          console.error('Error deleting zone:', error);
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
        activeKey={selectedZoneId}
        onChange={setSelectedZoneId}
        items={zones.map(zone => ({
          key: zone.id,
          label: zone.zoneName,
        }))}
      />

      {currentZone && (
        <Card className="mt-4">
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
            }}
          >
            {tablesInCurrentZone.map(table => {
              const seatedGuests = guestsByTable.get(table.tableId) || [];
              return (
                <DraggableTable
                  key={table.id}
                  table={table}
                  seatedGuests={seatedGuests}
                  zoneColor={currentZone.color}
                  onTablePositionUpdate={handleTablePositionUpdate}
                  onOpenDetail={(t: TableData) => {
                    setActiveTable(t);
                    setIsDetailModalOpen(true);
                  }}
                />
              );
            })}
          </div>
        </Card>
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
        zone={currentZone!}
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
              console.error('Error unassigning guest:', error);
              message.error('เกิดข้อผิดพลาด');
            }
          }}
        />
      )}
    </div>
  );
};

export default SeatingPage;

