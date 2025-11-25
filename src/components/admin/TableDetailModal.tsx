import React, { useMemo } from 'react';
import { Modal, List, Avatar, Tag, Button, Space, Badge, Popconfirm, Typography, Divider } from 'antd';
import { TableData, Guest } from '@/types';
import { formatGuestName } from '@/utils/guestHelpers';

const { Text } = Typography;

interface TableDetailModalProps {
  visible: boolean;
  onClose: () => void;
  table: TableData | null;
  guests: Guest[];
  onUnassignGuest: (guestId: string) => void;
}

const TableDetailModal: React.FC<TableDetailModalProps> = ({
  visible,
  onClose,
  table,
  guests,
  onUnassignGuest,
}) => {
  if (!table) return null;

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

  let itemIndex = 0;

  return (
    <Modal
      title={
        <Space>
          <Text strong style={{ fontSize: 18 }}>
            {table.tableName}
          </Text>
          <Tag color="blue">
            {guests.length} / {table.capacity} คน
          </Tag>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[<Button key="close" onClick={onClose}>ปิด</Button>]}
      width={600}
    >
      <List
        itemLayout="horizontal"
        locale={{ emptyText: 'ยังไม่มีแขกในโต๊ะนี้' }}
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
                    style={{ paddingLeft: '2rem' }}
                    actions={[
                      <Popconfirm
                        key="unassign"
                        title="ย้ายแขกออก?"
                        description={`นำคุณ ${guest.nickname || guest.firstName} ออกจากโต๊ะนี้?`}
                        onConfirm={() => onUnassignGuest(guest.id)}
                        okText="ย้ายออก"
                        cancelText="ยกเลิก"
                      >
                        <Button type="text" danger size="small">
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
              actions={[
                <Popconfirm
                  key="unassign"
                  title="ย้ายแขกออก?"
                  description={`นำคุณ ${guest.nickname || guest.firstName} ออกจากโต๊ะนี้?`}
                  onConfirm={() => onUnassignGuest(guest.id)}
                  okText="ย้ายออก"
                  cancelText="ยกเลิก"
                >
                  <Button type="text" danger size="small">
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

