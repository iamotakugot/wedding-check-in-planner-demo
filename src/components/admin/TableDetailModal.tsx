import React, { useMemo, useState, useEffect } from 'react';
import { Modal, List, Avatar, Tag, Button, Space, Badge, Popconfirm, Typography, Divider, Checkbox, Card } from 'antd';
import { DeleteOutlined, CloseOutlined } from '@ant-design/icons';
import { TableData, Guest, GuestGroup } from '@/types';
import { formatGuestName, renderMemberLabel } from '@/utils/guestHelpers';

const { Text } = Typography;

interface TableDetailModalProps {
  visible: boolean;
  onClose: () => void;
  table: TableData | null;
  guests: Guest[];
  guestGroups?: GuestGroup[];
  onUnassignGuest: (guestId: string) => void;
  onUnassignGuests?: (guestIds: string[]) => void;
}

const TableDetailModal: React.FC<TableDetailModalProps> = ({
  visible,
  onClose,
  table,
  guests,
  guestGroups = [],
  onUnassignGuest,
  onUnassignGuests,
}) => {
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  
  // Reset selection when modal closes
  useEffect(() => {
    if (!visible) {
      setSelectedGuestIds([]);
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

  // จัดกลุ่มแขกตาม groupId
  const guestsByGroup = useMemo(() => {
    const groups = new Map<string, Guest[]>();
    const ungrouped: Guest[] = [];

    guests.forEach(guest => {
      if (guest.groupId) {
        const existing = groups.get(guest.groupId) || [];
        existing.push(guest);
        groups.set(guest.groupId, existing);
      } else {
        ungrouped.push(guest);
      }
    });

    return { groups, ungrouped };
  }, [guests]);

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

  let itemIndex = 0;

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
      footer={[
        selectedGuestIds.length > 0 && onUnassignGuests ? (
          <Popconfirm
            key="bulk-unassign"
            title="ย้ายแขกออก?"
            description={`ย้าย ${selectedGuestIds.length} คนออกจากโต๊ะนี้?`}
            onConfirm={() => {
              onUnassignGuests(selectedGuestIds);
              setSelectedGuestIds([]);
            }}
            okText="ย้ายออก"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true, type: 'primary' }}
          >
            <Button key="bulk-unassign" type="primary" danger icon={<DeleteOutlined />}>
              ย้ายออก {selectedGuestIds.length} คน
            </Button>
          </Popconfirm>
        ) : null,
        <Button key="close" onClick={onClose}>ปิด</Button>
      ]}
      width={700}
      styles={{
        body: {
          padding: '20px 24px',
        },
      }}
    >
      {guests.length > 0 && onUnassignGuests && (
        <Card
          size="small"
          style={{
            marginBottom: 16,
            backgroundColor: '#fff7e6',
            border: '1px solid #ffd591',
          }}
          styles={{ body: { padding: '12px 16px' } }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Text type="secondary" style={{ fontSize: 14 }}>
                แขกทั้งหมด <Text strong>{guests.length}</Text> คน
              </Text>
            </Space>
            <Popconfirm
              title="ย้ายแขกออกทั้งหมด?"
              description={
                <div>
                  <Text>ย้ายแขกทั้งหมด <Text strong>{guests.length} คน</Text> ออกจากโต๊ะนี้?</Text>
                </div>
              }
              onConfirm={() => {
                const allGuestIds = guests.map(g => g.id);
                onUnassignGuests(allGuestIds);
                setSelectedGuestIds([]);
              }}
              okText="ย้ายออกทั้งหมด"
              cancelText="ยกเลิก"
              okButtonProps={{ danger: true, type: 'primary' }}
            >
              <Button 
                type="primary" 
                danger 
                icon={<DeleteOutlined />}
                size="middle"
              >
                ย้ายออกทั้งหมด
              </Button>
            </Popconfirm>
          </div>
        </Card>
      )}
      <List
        itemLayout="horizontal"
        locale={{ emptyText: 'ยังไม่มีแขกในโต๊ะนี้' }}
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
        }}
      >
        {/* แสดงกลุ่ม */}
        {Array.from(guestsByGroup.groups.entries()).map(([groupId, groupGuests], groupIndex) => {
          const groupName = groupGuests[0]?.groupName || 'กลุ่ม';
          const groupSize = groupGuests.length;
          
          return (
            <React.Fragment key={groupId}>
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{groupName}</Text>
                      <Tag color="purple">{groupSize} คน</Tag>
                    </Space>
                  }
                />
              </List.Item>
              {groupGuests.map((guest) => {
                itemIndex++;
                return (
                  <List.Item
                    key={guest.id}
                    style={{ 
                      paddingLeft: '2rem',
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                    actions={[
                      <Checkbox
                        key="checkbox"
                        checked={selectedGuestIds.includes(guest.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGuestIds([...selectedGuestIds, guest.id]);
                          } else {
                            setSelectedGuestIds(selectedGuestIds.filter(id => id !== guest.id));
                          }
                        }}
                      />,
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
                          size="small"
                          icon={<CloseOutlined />}
                          style={{ 
                            padding: '4px 8px',
                            height: 'auto',
                          }}
                        >
                          ย้ายออก
                        </Button>
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Badge count={itemIndex} style={{ backgroundColor: '#bfbfbf' }}>
                          <Avatar
                            style={{
                              backgroundColor: guest.side === 'groom' ? '#1890ff' : '#eb2f96',
                            }}
                          >
                            {guest.nickname ? guest.nickname[0] : guest.firstName[0]}
                          </Avatar>
                        </Badge>
                      }
                      title={getGuestLabel(guest)}
                      description={(() => {
                        // Try to get relationToMain from member, fallback to relationToCouple
                        for (const group of guestGroups) {
                          const member = group.members.find(m => m.id === guest.id);
                          if (member) {
                            return member.relationToMain || guest.relationToCouple || 'ไม่มีข้อมูล';
                          }
                        }
                        return guest.relationToCouple || 'ไม่มีข้อมูล';
                      })()}
                    />
                  </List.Item>
                );
              })}
              {groupIndex < Array.from(guestsByGroup.groups.entries()).length - 1 && (
                <Divider style={{ margin: '8px 0' }} />
              )}
            </React.Fragment>
          );
        })}

        {/* แสดงรายบุคคล */}
        {guestsByGroup.ungrouped.length > 0 && guestsByGroup.groups.size > 0 && (
          <Divider style={{ margin: '8px 0' }} />
        )}
        {guestsByGroup.ungrouped.map((guest) => {
          itemIndex++;
          return (
            <List.Item
              key={guest.id}
              style={{ 
                paddingTop: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid #f0f0f0',
              }}
              actions={[
                <Checkbox
                  key="checkbox"
                  checked={selectedGuestIds.includes(guest.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedGuestIds([...selectedGuestIds, guest.id]);
                    } else {
                      setSelectedGuestIds(selectedGuestIds.filter(id => id !== guest.id));
                    }
                  }}
                />,
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
                    size="small"
                    icon={<CloseOutlined />}
                    style={{ 
                      padding: '4px 8px',
                      height: 'auto',
                    }}
                  >
                    ย้ายออก
                  </Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Badge count={itemIndex} style={{ backgroundColor: '#bfbfbf' }}>
                    <Avatar
                      style={{
                        backgroundColor: guest.side === 'groom' ? '#1890ff' : '#eb2f96',
                      }}
                    >
                      {guest.nickname ? guest.nickname[0] : guest.firstName[0]}
                    </Avatar>
                  </Badge>
                }
                title={`${formatGuestName(guest)}${guest.nickname ? ` (${guest.nickname})` : ''}`}
                description={guest.relationToCouple || 'ไม่มีข้อมูล'}
              />
            </List.Item>
          );
        })}
      </List>
    </Modal>
  );
};

export default TableDetailModal;

