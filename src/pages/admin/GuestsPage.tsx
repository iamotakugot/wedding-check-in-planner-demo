/**
 * Admin Guests Page
 * รวม Guest List และ Check-in (เรียบง่าย)
 */

import React, { useState, useMemo } from 'react';
import { Tabs, Input, Table, Tag, Button, Space, message, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useGuests } from '@/hooks/useGuests';
import { useZones } from '@/hooks/useZones';
import { useTables } from '@/hooks/useTables';
import { useRSVPs } from '@/hooks/useRSVPs';
import { Guest, Side } from '@/types';
import { GuestService } from '@/services/firebase/GuestService';
import { calculateCheckedInCount } from '@/utils/rsvpHelpers';
import GuestFormDrawer from '@/pages/GuestListPage/components/GuestFormDrawer';

const { TabPane } = Tabs;
const { Search } = Input;

const GuestsPage: React.FC = () => {
  const { guests, isLoading } = useGuests();
  const { zones } = useZones();
  const { tables } = useTables();
  useRSVPs(); // Keep hook active for data sync
  const guestService = GuestService.getInstance();
  
  const [activeTab, setActiveTab] = useState('list');
  const [searchText, setSearchText] = useState('');
  const [selectedSide, setSelectedSide] = useState<Side | 'all'>('all');
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  // Filter guests
  const filteredGuests = useMemo(() => {
    return guests.filter(guest => {
      const matchesSearch = !searchText || 
        `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(searchText.toLowerCase());
      const matchesSide = selectedSide === 'all' || guest.side === selectedSide;
      return matchesSearch && matchesSide;
    });
  }, [guests, searchText, selectedSide]);

  // Check-in stats
  const totalCheckedIn = useMemo(() => calculateCheckedInCount(guests), [guests]);

  // Handle check-in
  const handleCheckIn = async (guest: Guest) => {
    try {
      const now = new Date().toISOString();
      await guestService.update(guest.id, {
        checkedInAt: guest.checkedInAt ? null : now,
        checkInMethod: guest.checkedInAt ? null : 'manual',
      });
      message.success(guest.checkedInAt ? 'ยกเลิกเช็คอินแล้ว' : 'เช็คอินสำเร็จ');
    } catch (error) {
      console.error('Error checking in:', error);
      message.error('เกิดข้อผิดพลาด');
    }
  };

  // Handle form submit
  const handleFormSubmit = async (guest: Guest) => {
    try {
      if (editingGuest) {
        await guestService.update(guest.id, guest);
        message.success('อัพเดทข้อมูลแขกเรียบร้อย');
      } else {
        await guestService.create(guest);
        message.success('เพิ่มแขกเรียบร้อย');
      }
      setIsDrawerVisible(false);
      setEditingGuest(null);
    } catch (error) {
      console.error('Error saving guest:', error);
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'ยืนยันการลบ',
      content: 'คุณต้องการลบแขกคนนี้หรือไม่?',
      onOk: async () => {
        try {
          await guestService.delete(id);
          message.success('ลบแขกเรียบร้อย');
        } catch (error) {
          console.error('Error deleting guest:', error);
          message.error('เกิดข้อผิดพลาดในการลบข้อมูล');
        }
      },
    });
  };

  // Table columns
  const columns: ColumnsType<Guest> = [
    {
      title: 'ชื่อ-นามสกุล',
      key: 'name',
      render: (_, guest) => `${guest.firstName} ${guest.lastName}`,
    },
    {
      title: 'ฝ่าย',
      dataIndex: 'side',
      render: (side: Side) => {
        switch (side) {
          case 'groom': return <Tag color="blue">เจ้าบ่าว</Tag>;
          case 'bride': return <Tag color="magenta">เจ้าสาว</Tag>;
          case 'both': return <Tag color="purple">ทั้งคู่</Tag>;
          default: return <Tag>ไม่ระบุ</Tag>;
        }
      },
    },
    {
      title: 'โต๊ะ',
      key: 'table',
      render: (_, guest) => {
        const table = tables.find(t => t.id === guest.tableId);
        const zone = zones.find(z => z.id === guest.zoneId);
        if (table && zone) {
          return `${zone.zoneName} - ${table.tableName}`;
        }
        return '-';
      },
    },
    {
      title: 'เช็คอิน',
      dataIndex: 'checkedInAt',
      render: (checkedInAt: string | null) => {
        return checkedInAt ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>เช็คอินแล้ว</Tag>
        ) : (
          <Tag>ยังไม่เช็คอิน</Tag>
        );
      },
    },
    {
      title: 'จัดการ',
      key: 'actions',
      render: (_, guest) => (
        <Space>
          <Button
            type="link"
            icon={<CheckCircleOutlined />}
            onClick={() => handleCheckIn(guest)}
          >
            {guest.checkedInAt ? 'ยกเลิกเช็คอิน' : 'เช็คอิน'}
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingGuest(guest);
              setIsDrawerVisible(true);
            }}
          >
            แก้ไข
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(guest.id)}
          >
            ลบ
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">จัดการแขก</h1>
        <Button
          type="primary"
          onClick={() => {
            setEditingGuest(null);
            setIsDrawerVisible(true);
          }}
        >
          เพิ่มแขก
        </Button>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="รายชื่อแขก" key="list">
          <div className="mb-4">
            <Space>
              <Search
                placeholder="ค้นหาแขก"
                allowClear
                style={{ width: 300 }}
                onSearch={setSearchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button
                onClick={() => setSelectedSide('all')}
                type={selectedSide === 'all' ? 'primary' : 'default'}
              >
                ทั้งหมด
              </Button>
              <Button
                onClick={() => setSelectedSide('groom')}
                type={selectedSide === 'groom' ? 'primary' : 'default'}
              >
                เจ้าบ่าว
              </Button>
              <Button
                onClick={() => setSelectedSide('bride')}
                type={selectedSide === 'bride' ? 'primary' : 'default'}
              >
                เจ้าสาว
              </Button>
            </Space>
          </div>
          <Table
            columns={columns}
            dataSource={filteredGuests}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 20 }}
          />
        </TabPane>
        <TabPane tab={`เช็คอิน (${totalCheckedIn}/${guests.length})`} key="checkin">
          <div className="mb-4">
            <Search
              placeholder="ค้นหาเพื่อเช็คอิน"
              allowClear
              style={{ width: 300 }}
              onSearch={(value) => {
                const guest = guests.find(g => 
                  `${g.firstName} ${g.lastName}`.toLowerCase().includes(value.toLowerCase())
                );
                if (guest && !guest.checkedInAt) {
                  handleCheckIn(guest);
                }
              }}
            />
          </div>
          <Table
            columns={columns}
            dataSource={filteredGuests.filter(g => !g.checkedInAt)}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 20 }}
          />
        </TabPane>
      </Tabs>

      <GuestFormDrawer
        visible={isDrawerVisible}
        onClose={() => {
          setIsDrawerVisible(false);
          setEditingGuest(null);
        }}
        guestToEdit={editingGuest}
        onSubmit={handleFormSubmit}
        zones={zones}
        tables={tables}
      />
    </div>
  );
};

export default GuestsPage;

