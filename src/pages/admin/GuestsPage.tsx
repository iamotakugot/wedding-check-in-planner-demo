/**
 * Admin Guests Page
 * รวม Guest List และ Check-in (เรียบง่าย)
 */

import React, { useState, useMemo } from 'react';
import { Tabs, Input, Table, Tag, Button, Space, message, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined, EditOutlined, DeleteOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { useGuests } from '@/hooks/useGuests';
import { useZones } from '@/hooks/useZones';
import { useTables } from '@/hooks/useTables';
import { useRSVPs } from '@/hooks/useRSVPs';
import { useGuestGroups } from '@/hooks/useGuestGroups';
import { Guest, Side, RSVPData } from '@/types';
import { GuestService } from '@/services/firebase/GuestService';
import { CheckInManager } from '@/managers/CheckInManager';
import { calculateCheckedInCount } from '@/utils/rsvpHelpers';
import GuestFormDrawer from '@/components/admin/GuestFormDrawer';
import GroupCheckInModal from '@/components/admin/GroupCheckInModal';
import RSVPStatusTag from '@/components/admin/RSVPStatusTag';
import GroupMemberTooltip from '@/components/admin/GroupMemberTooltip';
import { formatGuestName, getGuestRSVPStatus } from '@/utils/guestHelpers';
import { logger } from '@/utils/logger';

const { TabPane } = Tabs;
const { Search } = Input;

const GuestsPage: React.FC = () => {
  const { guests, isLoading } = useGuests();
  const { zones } = useZones();
  const { tables } = useTables();
  const { rsvps } = useRSVPs(); // Get RSVP data for status integration
  const { guestGroups } = useGuestGroups(); // Get GuestGroup data
  const guestService = GuestService.getInstance();
  const checkInManager = new CheckInManager();
  
  const [activeTab, setActiveTab] = useState('list');
  const [searchText, setSearchText] = useState('');
  const [selectedSide, setSelectedSide] = useState<Side | 'all'>('all');
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  
  // Group Check-in Modal state
  const [isGroupCheckInModalVisible, setIsGroupCheckInModalVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<{ groupId: string; guests: Guest[]; groupName: string } | null>(null);
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);

  // Filter guests
  const filteredGuests = useMemo(() => {
    return guests.filter(guest => {
      const matchesSearch = !searchText || 
        formatGuestName(guest).toLowerCase().includes(searchText.toLowerCase());
      const matchesSide = selectedSide === 'all' || guest.side === selectedSide;
      return matchesSearch && matchesSide;
    });
  }, [guests, searchText, selectedSide]);

  // Check-in stats
  const totalCheckedIn = useMemo(() => calculateCheckedInCount(guests), [guests]);

  // Group guests by groupId (ใช้ guestGroups เป็นหลัก, fallback ไปที่ guests ถ้าไม่มี)
  const groupedGuests = useMemo(() => {
    const groups = new Map<string, { guests: Guest[]; groupName: string }>();
    
    // ใช้ guestGroups เป็นหลัก
    guestGroups.forEach(group => {
      const groupGuests = group.members.map(member => {
        // หา Guest object จาก member.id
        return guests.find(g => g.id === member.id);
      }).filter((g): g is Guest => g !== undefined);
      
      if (groupGuests.length > 0) {
        groups.set(group.groupId, {
          guests: groupGuests,
          groupName: group.groupName,
        });
      }
    });
    
    // Fallback: group guests ที่ไม่มีใน guestGroups (backward compatibility)
    guests.forEach(g => {
      if (g.groupId && !groups.has(g.groupId)) {
        const existing = groups.get(g.groupId) || { guests: [], groupName: g.groupName || '' };
        existing.guests.push(g);
        groups.set(g.groupId, existing);
      }
    });
    
    return groups;
  }, [guests, guestGroups]);

  // RSVP Map for status lookup
  const rsvpMap = useMemo(() => {
    const map = new Map<string, RSVPData>();
    rsvps.forEach(r => {
      if (r.uid) map.set(r.uid, r);
      if (r.id) map.set(r.id, r);
    });
    return map;
  }, [rsvps]);

  // Handle check-in
  const handleCheckIn = async (guest: Guest) => {
    // Check RSVP status - disable check-in if isComing === 'no'
    const rsvpStatus = getGuestRSVPStatus(guest, rsvpMap);
    if (rsvpStatus === 'no') {
      message.warning('แขกคนนี้ไม่ได้ตอบรับเข้าร่วมงาน ไม่สามารถเช็คอินได้');
      return;
    }

    try {
      const now = new Date().toISOString();
      await guestService.update(guest.id, {
        checkedInAt: guest.checkedInAt ? null : now,
        checkInMethod: guest.checkedInAt ? null : 'manual',
      });
      message.success(guest.checkedInAt ? 'ยกเลิกเช็คอินแล้ว' : 'เช็คอินสำเร็จ');
    } catch (error) {
      logger.error('Error checking in:', error);
      message.error('เกิดข้อผิดพลาด');
    }
  };

  // Handle group check-in modal open
  const handleOpenGroupCheckIn = (groupId: string) => {
    const group = groupedGuests.get(groupId);
    if (group) {
      setSelectedGroup({ groupId, guests: group.guests, groupName: group.groupName });
      setSelectedGuestIds([]);
      setIsGroupCheckInModalVisible(true);
    }
  };

  // Handle group check-in submit
  const handleGroupCheckInSubmit = async () => {
    if (!selectedGroup || selectedGuestIds.length === 0) {
      message.warning('กรุณาเลือกแขกที่ต้องการเช็คอิน');
      return;
    }

    try {
      await checkInManager.checkInGroupMembers(selectedGroup.groupId, selectedGuestIds, 'manual');
      message.success(`เช็คอิน ${selectedGuestIds.length} คนสำเร็จ`);
      setIsGroupCheckInModalVisible(false);
      setSelectedGroup(null);
      setSelectedGuestIds([]);
    } catch (error) {
      logger.error('Error checking in group:', error);
      message.error('เกิดข้อผิดพลาดในการเช็คอินกลุ่ม');
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
      logger.error('Error saving guest:', error);
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
          logger.error('Error deleting guest:', error);
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
      render: (_, guest) => {
        // Show group name if exists
        const groupName = guest.groupName;
        const groupSize = guest.groupId ? groupedGuests.get(guest.groupId)?.guests.length || 0 : 0;
        const group = guestGroups.find(g => g.groupId === guest.groupId);
        
        const nameContent = (
          <div>
            <div>{formatGuestName(guest)}</div>
            {groupName && groupSize > 1 && (
              <div className="text-xs text-gray-500">{`${groupName} (${groupSize} คน)`}</div>
            )}
          </div>
        );
        
        // ถ้ามี group และมีสมาชิกมากกว่า 1 คน → แสดง tooltip
        if (group && group.totalCount > 1) {
          return (
            <GroupMemberTooltip group={group}>
              {nameContent}
            </GroupMemberTooltip>
          );
        }
        
        return nameContent;
      },
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
      title: 'สถานะตอบรับ',
      key: 'rsvpStatus',
      render: (_, guest) => {
        return <RSVPStatusTag guest={guest} rsvpMap={rsvpMap} />;
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
      title: 'เช็คอินกลุ่ม',
      key: 'groupCheckIn',
      render: (_, guest) => {
        if (!guest.groupId) {
          return '-';
        }
        
        // หา group จาก guestGroups
        const group = guestGroups.find(g => g.groupId === guest.groupId);
        if (!group || group.totalCount <= 1) {
          return '-';
        }
        
        return (
          <Tag color={group.checkedInCount === group.totalCount ? 'green' : 'orange'}>
            เช็คอินแล้ว {group.checkedInCount} / {group.totalCount} คน
          </Tag>
        );
      },
    },
    {
      title: 'จัดการ',
      key: 'actions',
      render: (_, guest) => {
        const rsvpStatus = getGuestRSVPStatus(guest, rsvpMap);
        const canCheckIn = rsvpStatus !== 'no';
        
        return (
          <Space>
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={() => handleCheckIn(guest)}
              disabled={!canCheckIn && !guest.checkedInAt}
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
        );
      },
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
          
          {/* Group Check-in Buttons */}
          {groupedGuests.size > 0 && (
            <div className="mb-4">
              <Space wrap>
                {Array.from(groupedGuests.entries()).map(([groupId, group]) => {
                  const mainGuest = group.guests.find(g => !g.rsvpUid || g.rsvpUid === g.id) || group.guests[0];
                  const groupName = group.groupName || formatGuestName(mainGuest);
                  return (
                    <Button
                      key={groupId}
                      icon={<UsergroupAddOutlined />}
                      onClick={() => handleOpenGroupCheckIn(groupId)}
                    >
                      {groupName} ({group.guests.length} คน)
                    </Button>
                  );
                })}
              </Space>
            </div>
          )}
          
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
                  formatGuestName(g).toLowerCase().includes(value.toLowerCase())
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
      />

      {/* Group Check-in Modal */}
      <GroupCheckInModal
        visible={isGroupCheckInModalVisible}
        onClose={() => {
          setIsGroupCheckInModalVisible(false);
          setSelectedGroup(null);
          setSelectedGuestIds([]);
        }}
        onSubmit={handleGroupCheckInSubmit}
        group={selectedGroup}
        selectedGuestIds={selectedGuestIds}
        onSelectionChange={setSelectedGuestIds}
        rsvpMap={rsvpMap}
      />
    </div>
  );
};

export default GuestsPage;

