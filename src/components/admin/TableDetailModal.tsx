import React, { useMemo, useState, useEffect } from 'react';
import { Modal, List, Avatar, Tag, Button, Space, Popconfirm, Typography, Input } from 'antd';
import { DeleteOutlined, SearchOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { TableData, Guest, GuestGroup } from '@/types';
import { formatGuestName, renderMemberLabel } from '@/utils/guestHelpers';

const { Text } = Typography;

interface TableDetailModalProps {
  visible: boolean;
  onClose: () => void;
  table: TableData | null;
  guests: Guest[];
  unassignedGuests?: Guest[];
  guestGroups?: GuestGroup[];
  onUnassignGuest: (guestId: string) => void;
  onAssignGuests?: (guestIds: string[]) => void;
}

const TableDetailModal: React.FC<TableDetailModalProps> = ({
  visible,
  onClose,
  table,
  guests,
  unassignedGuests = [],
  guestGroups = [],
  onUnassignGuest,
  onAssignGuests,
}) => {
  const [searchText, setSearchText] = useState('');

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setSearchText('');
    }
  }, [visible]);

  // Helper function to get member label for a guest
  const getGuestLabel = useMemo(() => {
    return (guest: Guest): string => {
      // Try to find member in groups
      for (const group of guestGroups) {
        const member = group.members.find(m => m.id === guest.id);
        if (member) {
          return renderMemberLabel(group, member);
        }
      }
      // Fallback to guest name
      return formatGuestName(guest);
    };
  }, [guestGroups]);

  // Filter unassigned guests
  const filteredUnassignedGuests = useMemo(() => {
    if (!searchText) return unassignedGuests;
    const lowerSearch = searchText.toLowerCase();
    return unassignedGuests.filter(g =>
      g.firstName.toLowerCase().includes(lowerSearch) ||
      g.lastName?.toLowerCase().includes(lowerSearch) ||
      g.nickname?.toLowerCase().includes(lowerSearch)
    );
  }, [unassignedGuests, searchText]);

  if (!table) return null;

  // Count members at this table (member-level counting)
  const memberCount = useMemo(() => {
    let count = 0;
    for (const group of guestGroups) {
      for (const member of group.members) {
        if (member.seat?.tableId === table.tableId) {
          count++;
        }
      }
    }
    // Also count individual guests not in groups
    for (const guest of guests) {
      if (guest.tableId === table.tableId && !guest.groupId) {
        count++;
      }
    }
    return count;
  }, [guestGroups, guests, table.tableId]);

  return (
    <Modal
      title={
        <Space>
          <Text strong style={{ fontSize: 18 }}>
            {table.tableName}
          </Text>
          <Tag color="blue">
            {memberCount} / {table.capacity} คน
          </Tag>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      styles={{
        body: {
          padding: '0',
          height: '500px',
          overflow: 'hidden',
        },
      }}
    >
      <div className="flex h-full">
        {/* Left Pane: Seated Guests */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col h-full">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <Text strong className="text-green-600">นั่งอยู่ที่นี่ (Seated)</Text>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {guests.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                ยังไม่มีใครนั่งโต๊ะนี้
              </div>
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={guests}
                renderItem={(guest) => (
                  <List.Item
                    actions={[
                      <Popconfirm
                        key="unassign"
                        title="ย้ายแขกออก?"
                        description={`นำคุณ ${guest.nickname || guest.firstName} ออกจากโต๊ะนี้?`}
                        onConfirm={() => onUnassignGuest(guest.id)}
                        okText="ย้ายออก"
                        cancelText="ยกเลิก"
                        okButtonProps={{ danger: true, type: 'primary' }}
                      >
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{
                            backgroundColor: guest.side === 'groom' ? '#52c41a' : '#f759ab', // Green for groom (as per image), Pink for bride
                          }}
                        >
                          {guest.nickname ? guest.nickname[0] : guest.firstName[0]}
                        </Avatar>
                      }
                      title={getGuestLabel(guest)}
                      description={guest.relationToCouple || 'ไม่มีข้อมูล'}
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        </div>

        {/* Right Pane: Available Guests */}
        <div className="w-1/2 flex flex-col h-full">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <Text strong className="text-orange-500">เลือกคนเข้าโต๊ะ (Available)</Text>
          </div>
          <div className="p-4 border-b border-gray-100">
            <Input
              placeholder="ค้นหาชื่อแขก..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <List
              itemLayout="horizontal"
              dataSource={filteredUnassignedGuests}
              locale={{ emptyText: 'ไม่พบแขกที่ยังไม่มีที่นั่ง' }}
              renderItem={(guest) => (
                <List.Item
                  actions={[
                    <Button
                      key="select"
                      type="default"
                      className="text-pink-500 border-pink-500 hover:text-pink-600 hover:border-pink-600"
                      icon={<ArrowRightOutlined />}
                      onClick={() => {
                        if (onAssignGuests) {
                          onAssignGuests([guest.id]);
                        }
                      }}
                    >
                      เลือก
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        className="bg-gray-300"
                      >
                        {guest.nickname ? guest.nickname[0] : guest.firstName[0]}
                      </Avatar>
                    }
                    title={
                      <Space>
                        <Text>{getGuestLabel(guest)}</Text>
                        <Tag>{guest.side === 'groom' ? 'บ่าว' : guest.side === 'bride' ? 'สาว' : 'ทั้งคู่'}</Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TableDetailModal;

