/**
 * Admin Guests Page
 * รวม Guest List และ Check-in (เรียบง่าย)
 */

import React, { useState, useMemo } from 'react';
import { Tabs, Input, Table, Tag, Button, Space, message, Modal, Card, List, Avatar, Checkbox, Row, Col, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined, EditOutlined, DeleteOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons';
import { useGuests } from '@/hooks/useGuests';
import { useZones } from '@/hooks/useZones';
import { useTables } from '@/hooks/useTables';
import { useRSVPs } from '@/hooks/useRSVPs';
import { useGuestGroups } from '@/hooks/useGuestGroups';
import { Guest, Side, RSVPData } from '@/types';
import { GuestService } from '@/services/firebase/GuestService';
import { calculateCheckedInCount } from '@/utils/rsvpHelpers';
import GuestFormDrawer from '@/components/admin/GuestFormDrawer';
import RSVPStatusTag from '@/components/admin/RSVPStatusTag';
import { formatGuestName, getGuestRSVPStatus, renderMemberLabel } from '@/utils/guestHelpers';
import { logger } from '@/utils/logger';

const { Text } = Typography;

const { TabPane } = Tabs;
const { Search } = Input;

const GuestsPage: React.FC = () => {
  const { guests, isLoading } = useGuests();
  const { zones } = useZones();
  const { tables } = useTables();
  const { rsvps } = useRSVPs(); // Get RSVP data for status integration
  const { guestGroups } = useGuestGroups(); // Get GuestGroup data
  const guestService = GuestService.getInstance();
  
  const [activeTab, setActiveTab] = useState('list');
  const [searchText, setSearchText] = useState('');
  const [checkInSearchText, setCheckInSearchText] = useState('');
  const [selectedSide, setSelectedSide] = useState<Side | 'all'>('all');
  const [checkInSelectedSide, setCheckInSelectedSide] = useState<Side | 'all'>('all');
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [selectedCheckInIds, setSelectedCheckInIds] = useState<string[]>([]);

  // Filter guests for list tab
  const filteredGuests = useMemo(() => {
    return guests.filter(guest => {
      const matchesSearch = !searchText || 
        formatGuestName(guest).toLowerCase().includes(searchText.toLowerCase());
      const matchesSide = selectedSide === 'all' || guest.side === selectedSide;
      return matchesSearch && matchesSide;
    });
  }, [guests, searchText, selectedSide]);

  // Get all members from groups for check-in
  const allMembersForCheckIn = useMemo(() => {
    const members: Array<{ guest: Guest; group: typeof guestGroups[0] | null; member: typeof guestGroups[0]['members'][0] | null }> = [];
    
    // Add members from groups
    guestGroups.forEach(group => {
      group.members.forEach(member => {
        const guest = guests.find(g => g.id === member.id);
        if (guest && !guest.checkedInAt) {
          members.push({ guest, group, member });
        }
      });
    });
    
    // Add individual guests (not in groups)
    guests.forEach(guest => {
      if (!guest.checkedInAt && !guest.groupId) {
        members.push({ guest, group: null, member: null });
      }
    });
    
    return members;
  }, [guests, guestGroups]);

  // Filter members for check-in tab
  const filteredCheckInMembers = useMemo(() => {
    return allMembersForCheckIn.filter(({ guest, group }) => {
      const matchesSearch = !checkInSearchText || 
        formatGuestName(guest).toLowerCase().includes(checkInSearchText.toLowerCase()) ||
        (group && group.groupName.toLowerCase().includes(checkInSearchText.toLowerCase()));
      const matchesSide = checkInSelectedSide === 'all' || guest.side === checkInSelectedSide;
      return matchesSearch && matchesSide;
    });
  }, [allMembersForCheckIn, checkInSearchText, checkInSelectedSide]);

  // Check-in stats
  const totalCheckedIn = useMemo(() => calculateCheckedInCount(guests), [guests]);

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

  // Handle bulk check-in
  const handleBulkCheckIn = async () => {
    if (selectedCheckInIds.length === 0) {
      message.warning('กรุณาเลือกแขกที่ต้องการเช็คอิน');
      return;
    }

    try {
      const now = new Date().toISOString();
      let successCount = 0;
      let failCount = 0;

      for (const guestId of selectedCheckInIds) {
        const guest = guests.find(g => g.id === guestId);
        if (guest) {
          const rsvpStatus = getGuestRSVPStatus(guest, rsvpMap);
          if (rsvpStatus !== 'no') {
            await guestService.update(guestId, {
              checkedInAt: now,
              checkInMethod: 'manual',
            });
            successCount++;
          } else {
            failCount++;
          }
        }
      }

      if (successCount > 0) {
        message.success(`เช็คอิน ${successCount} คนสำเร็จ${failCount > 0 ? ` (${failCount} คนไม่สามารถเช็คอินได้)` : ''}`);
      } else {
        message.warning('ไม่มีแขกที่สามารถเช็คอินได้');
      }
      setSelectedCheckInIds([]);
    } catch (error) {
      logger.error('Error bulk checking in:', error);
      message.error('เกิดข้อผิดพลาดในการเช็คอิน');
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
        const group = guestGroups.find(g => g.groupId === guest.groupId);
        const member = group?.members.find(m => m.id === guest.id);
        
        if (group && member) {
          return (
            <div>
              <div>{renderMemberLabel(group, member)}</div>
              {group.totalCount > 1 && (
                <Text type="secondary" className="text-xs">
                  {group.groupName} ({group.totalCount} คน)
                </Text>
              )}
            </div>
          );
        }
        
        return <div>{formatGuestName(guest)}</div>;
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
          
          <Table
            columns={columns}
            dataSource={filteredGuests.filter(g => {
              // Only show group headers and individual guests in main table
              const group = guestGroups.find(gr => gr.groupId === g.groupId);
              if (group && group.totalCount > 1) {
                // Only show first member as header
                return group.members[0].id === g.id;
              }
              return true;
            })}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 20 }}
            expandable={{
              expandedRowRender: (record) => {
                const group = guestGroups.find(g => g.groupId === record.groupId);
                if (!group || group.totalCount <= 1) {
                  return null;
                }
                
                const otherMembers = group.members.slice(1).map(member => {
                  const memberGuest = guests.find(g => g.id === member.id);
                  return { member, guest: memberGuest };
                }).filter((item): item is { member: typeof group.members[0]; guest: Guest } => item.guest !== undefined);
                
                return (
                  <Table
                    columns={columns}
                    dataSource={otherMembers.map(item => item.guest)}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    showHeader={false}
                  />
                );
              },
              rowExpandable: (record) => {
                const group = guestGroups.find(g => g.groupId === record.groupId);
                return group ? group.totalCount > 1 : false;
              },
            }}
          />
        </TabPane>
        <TabPane tab={`เช็คอิน (${totalCheckedIn}/${guests.length})`} key="checkin">
          <div className="mb-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Search
                  placeholder="ค้นหาชื่อ/กลุ่ม"
                  allowClear
                  prefix={<SearchOutlined />}
                  value={checkInSearchText}
                  onChange={(e) => setCheckInSearchText(e.target.value)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} sm={12} md={16}>
                <Space.Compact>
                  <Button
                    onClick={() => setCheckInSelectedSide('all')}
                    type={checkInSelectedSide === 'all' ? 'primary' : 'default'}
                  >
                    ทั้งหมด
                  </Button>
                  <Button
                    onClick={() => setCheckInSelectedSide('groom')}
                    type={checkInSelectedSide === 'groom' ? 'primary' : 'default'}
                  >
                    เจ้าบ่าว
                  </Button>
                  <Button
                    onClick={() => setCheckInSelectedSide('bride')}
                    type={checkInSelectedSide === 'bride' ? 'primary' : 'default'}
                  >
                    เจ้าสาว
                  </Button>
                </Space.Compact>
              </Col>
            </Row>
          </div>

          {selectedCheckInIds.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-2">
              <Text strong className="text-base">เลือก {selectedCheckInIds.length} คน</Text>
              <Space>
                <Button onClick={() => setSelectedCheckInIds([])}>ยกเลิก</Button>
                <Button type="primary" onClick={handleBulkCheckIn} size="large">
                  เช็คอินที่เลือก ({selectedCheckInIds.length} คน)
                </Button>
              </Space>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCheckInMembers.map(({ guest, group, member }) => {
              const rsvpStatus = getGuestRSVPStatus(guest, rsvpMap);
              const canCheckIn = rsvpStatus !== 'no';
              const isSelected = selectedCheckInIds.includes(guest.id);
              
              const displayName = group && member 
                ? renderMemberLabel(group, member)
                : formatGuestName(guest);

              return (
                <Card
                  key={guest.id}
                  size="small"
                  className={isSelected ? 'border-blue-500 border-2' : ''}
                  actions={[
                    <Checkbox
                      key="select"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCheckInIds([...selectedCheckInIds, guest.id]);
                        } else {
                          setSelectedCheckInIds(selectedCheckInIds.filter(id => id !== guest.id));
                        }
                      }}
                      disabled={!canCheckIn}
                    >
                      เลือก
                    </Checkbox>,
                    <Button
                      key="checkin"
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleCheckIn(guest)}
                      disabled={!canCheckIn}
                      block
                    >
                      เช็คอิน
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={<UserOutlined />}
                        style={{ 
                          backgroundColor: guest.side === 'groom' ? '#1890ff' : '#eb2f96' 
                        }}
                      >
                        {displayName.charAt(0)}
                      </Avatar>
                    }
                    title={
                      <div>
                        <Text strong>{displayName}</Text>
                        {group && (
                          <Tag color="blue" className="ml-2">
                            {group.groupName}
                          </Tag>
                        )}
                      </div>
                    }
                    description={
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <div>
                          <Tag color={guest.side === 'groom' ? 'blue' : 'magenta'}>
                            {guest.side === 'groom' ? 'เจ้าบ่าว' : guest.side === 'bride' ? 'เจ้าสาว' : 'ทั้งคู่'}
                          </Tag>
                          <RSVPStatusTag guest={guest} rsvpMap={rsvpMap} />
                        </div>
                        {member && member.relationToMain && (
                          <Text type="secondary" className="text-xs">
                            {member.relationToMain}
                          </Text>
                        )}
                        {!canCheckIn && (
                          <Tag color="red">ไม่ตอบรับเข้าร่วมงาน</Tag>
                        )}
                      </Space>
                    }
                  />
                </Card>
              );
            })}
          </div>

          {filteredCheckInMembers.length === 0 && (
            <div className="text-center py-12">
              <Text type="secondary">
                {checkInSearchText || checkInSelectedSide !== 'all' 
                  ? 'ไม่พบแขกที่ยังไม่เช็คอิน' 
                  : 'ไม่มีแขกที่ยังไม่เช็คอิน'}
              </Text>
            </div>
          )}
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

    </div>
  );
};

export default GuestsPage;

