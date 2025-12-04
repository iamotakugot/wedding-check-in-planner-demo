import React, { useMemo, useState, useEffect } from 'react';
import { Modal, List, Avatar, Tag, Button, Space, Popconfirm, Typography, Input } from 'antd';
import { DeleteOutlined, SearchOutlined, ArrowRightOutlined, UserOutlined } from '@ant-design/icons';
import { TableData, Guest, GuestGroup } from '@/types';
import { formatGuestName, renderMemberLabel } from '@/utils/guestHelpers';

const { Text } = Typography;

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red' }}>
          <h3>Something went wrong in TableDetailModal.</h3>
          <pre>{this.state.error?.message}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

interface TableDetailModalProps {
  visible: boolean;
  onClose: () => void;
  table?: TableData | null;
  guests?: Guest[];
  allGuests?: Guest[];
  tables?: TableData[];
  guestGroups?: GuestGroup[];
  onUnassignGuest?: (guestId: string) => void;
  onUnassignAllGuests?: (guestIds: string[]) => void;
  onAssignGuests?: (guestIds: string[]) => void;
}

const TableDetailModalContent: React.FC<TableDetailModalProps> = ({
  visible,
  onClose,
  table,
  guests = [], // Guests seated at THIS table
  allGuests = [], // All guests in the system
  tables = [], // All tables
  guestGroups = [],
  onUnassignGuest,
  onUnassignAllGuests,
  onAssignGuests,
}) => {
  const [searchText, setSearchText] = useState('');

  // Ensure arrays are arrays
  const safeGuests = Array.isArray(guests) ? guests : [];
  const safeAllGuests = Array.isArray(allGuests) ? allGuests : [];
  const safeGuestGroups = Array.isArray(guestGroups) ? guestGroups : [];

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
      for (const group of safeGuestGroups) {
        if (!group || !group.members) continue;
        const member = group.members.find(m => m.id === guest.id);
        if (member) {
          return renderMemberLabel(group, member);
        }
      }
      // Fallback to guest name
      return formatGuestName(guest);
    };
  }, [safeGuestGroups]);

  // Filter available guests (from ALL guests)
  const filteredAvailableGuests = useMemo(() => {
    let filtered = safeAllGuests;

    // If searching, filter by name
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter(g =>
        (g.firstName && g.firstName.toLowerCase().includes(lowerSearch)) ||
        (g.lastName && g.lastName.toLowerCase().includes(lowerSearch)) ||
        (g.nickname && g.nickname.toLowerCase().includes(lowerSearch))
      );
    } else {
      filtered = filtered.filter(g => !g.tableId);
    }

    // Sort: Effective Group Name -> Owner -> Order -> First Name
    return filtered.sort((a, b) => {
      // 1. Seated status (unassigned first)
      if (!!a.tableId !== !!b.tableId) return a.tableId ? 1 : -1;

      // Helper to find member info from ANY group
      const getMemberInfo = (guestId: string) => {
        for (const group of safeGuestGroups) {
          if (!group || !group.members) continue;
          const member = group.members.find(m => m.id === guestId);
          if (member) return { member, group };
        }
        return null;
      };

      const infoA = getMemberInfo(a.id);
      const infoB = getMemberInfo(b.id);

      // Helper to get effective name
      const getName = (g: Guest, info: { group: GuestGroup } | null) => {
        if (info) return info.group.groupName.trim();
        if ((g as any).groupName) return (g as any).groupName.trim();
        return (g.firstName || '').trim();
      };

      const nameA = getName(a, infoA);
      const nameB = getName(b, infoB);

      // 2. Compare Effective Names (Thai locale)
      const nameCompare = nameA.localeCompare(nameB, 'th');
      if (nameCompare !== 0) return nameCompare;

      // 3. If names are equal (Same Group context), sort by internal structure
      // Owner first
      const isOwnerA = infoA?.member.isOwner || false;
      const isOwnerB = infoB?.member.isOwner || false;
      if (isOwnerA !== isOwnerB) return isOwnerA ? -1 : 1;

      // Then by orderIndex (Ascending: 1, 2, 3...)
      const orderA = typeof infoA?.member.orderIndex === 'number' ? infoA.member.orderIndex : 999;
      const orderB = typeof infoB?.member.orderIndex === 'number' ? infoB.member.orderIndex : 999;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // 4. Fallback: Sort by First Name
      return (a.firstName || '').localeCompare(b.firstName || '', 'th');
    });
  }, [safeAllGuests, searchText, safeGuestGroups]);

  // Count total unassigned guests
  const unassignedCount = useMemo(() => {
    return safeAllGuests.filter(g => !g.tableId).length;
  }, [safeAllGuests]);

  // Count members at this table (member-level counting)
  const memberCount = useMemo(() => {
    if (!table) return 0;
    let count = 0;
    for (const group of safeGuestGroups) {
      if (!group || !group.members) continue;
      for (const member of group.members) {
        if (member.seat?.tableId === table.tableId) {
          count++;
        }
      }
    }
    // Also count individual guests not in groups
    for (const guest of safeGuests) {
      if (guest.tableId === table.tableId && !guest.groupId) {
        count++;
      }
    }
    return count;
  }, [safeGuestGroups, safeGuests, table]);

  if (!table) return null;

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
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <Text strong className="text-green-600">นั่งอยู่ที่นี่ (Seated)</Text>
            {safeGuests.length > 0 && (
              <Popconfirm
                title="ย้ายออกทั้งหมด?"
                description="คุณต้องการนำแขกทุกคนออกจากโต๊ะนี้ใช่หรือไม่?"
                onConfirm={() => {
                  if (onUnassignAllGuests) {
                    onUnassignAllGuests(safeGuests.map(g => g.id));
                  } else if (onUnassignGuest) {
                    safeGuests.forEach(g => onUnassignGuest(g.id));
                  }
                }}
                okText="ย้ายออกทั้งหมด"
                cancelText="ยกเลิก"
                okButtonProps={{ danger: true, type: 'primary' }}
              >
                <Button size="small" danger type="dashed">
                  ย้ายออกทั้งหมด
                </Button>
              </Popconfirm>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {safeGuests.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                ยังไม่มีใครนั่งโต๊ะนี้
              </div>
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={safeGuests}
                renderItem={(guest, index) => (
                  <List.Item
                    actions={[
                      <Popconfirm
                        key="unassign"
                        title="ย้ายแขกออก?"
                        description={`นำคุณ ${guest.nickname || guest.firstName} ออกจากโต๊ะนี้?`}
                        onConfirm={() => onUnassignGuest && onUnassignGuest(guest.id)}
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
                    <div className="mr-3 text-gray-400 font-mono w-6 text-right">
                      {index + 1}
                    </div>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{
                            backgroundColor: guest.side === 'groom' ? '#52c41a' : '#f759ab',
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
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <Text strong className="text-orange-500">เลือกคนเข้าโต๊ะ (Available)</Text>
            <Tag color="orange">ยังไม่จัดโต๊ะ {unassignedCount} คน</Tag>
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
              dataSource={filteredAvailableGuests}
              locale={{ emptyText: 'ไม่พบแขก' }}
              renderItem={(guest, index) => {
                const isSeated = !!guest.tableId;
                const isSeatedHere = guest.tableId === table.tableId;
                const seatedTable = tables.find(t => t.tableId === guest.tableId);

                return (
                  <List.Item
                    actions={[
                      !isSeated ? (
                        <Button
                          key="select"
                          type="default"
                          className="text-pink-500 border-pink-500 hover:text-pink-600 hover:border-pink-600"
                          icon={<ArrowRightOutlined />}
                          onClick={() => {
                            if (onAssignGuests) {
                              // Check if guest belongs to a group
                              const group = safeGuestGroups.find(g => g.groupId === guest.groupId);

                              if (group && group.members.length > 1) {
                                // Find all unseated members in this group
                                const unseatedMembers = group.members.filter(m => {
                                  const memberGuest = safeAllGuests.find(g => g.id === m.id);
                                  return memberGuest && !memberGuest.tableId;
                                });

                                if (unseatedMembers.length > 1) {
                                  // Assign ALL unseated members automatically
                                  onAssignGuests(unseatedMembers.map(m => m.id));
                                } else {
                                  onAssignGuests([guest.id]);
                                }
                              } else {
                                onAssignGuests([guest.id]);
                              }
                            }
                          }}
                        >
                          เลือก
                        </Button>
                      ) : (
                        <Tag color={isSeatedHere ? "green" : "orange"}>
                          {isSeatedHere ? "นั่งโต๊ะนี้แล้ว" : (seatedTable ? `นั่งโต๊ะ ${seatedTable.tableName}` : "มีที่นั่งแล้ว")}
                        </Tag>
                      )
                    ]}
                  >
                    <div className="mr-3 text-gray-400 font-mono w-6 text-right">
                      {index + 1}
                    </div>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          className={isSeated ? "bg-gray-200 opacity-50" : "bg-gray-300"}
                        >
                          {guest.nickname ? guest.nickname[0] : guest.firstName[0]}
                        </Avatar>
                      }
                      title={
                        <Space direction="vertical" size={0}>
                          <Space>
                            <Text disabled={isSeated}>{getGuestLabel(guest)}</Text>
                            <Tag>{guest.side === 'groom' ? 'บ่าว' : guest.side === 'bride' ? 'สาว' : 'ทั้งคู่'}</Tag>
                          </Space>
                          {guest.groupName && (
                            <Text type="secondary" style={{ fontSize: '10px' }}>
                              <UserOutlined /> กลุ่ม: {guest.groupName}
                            </Text>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

const TableDetailModal: React.FC<TableDetailModalProps> = (props) => {
  return (
    <ErrorBoundary>
      <TableDetailModalContent {...props} />
    </ErrorBoundary>
  );
};

export default TableDetailModal;
