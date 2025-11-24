import React from 'react';
import { Modal, List, Avatar, Tag, Button, Space, Badge, Popconfirm, Typography } from 'antd';
import { TableData, Guest } from '@/types';

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
    >
      <List
        itemLayout="horizontal"
        dataSource={guests}
        locale={{ emptyText: 'ยังไม่มีแขกในโต๊ะนี้' }}
        renderItem={(guest, index) => (
          <List.Item
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
                <Badge count={index + 1} style={{ backgroundColor: '#bfbfbf' }}>
                  <Avatar
                    style={{
                      backgroundColor: guest.side === 'groom' ? '#1890ff' : '#eb2f96',
                    }}
                  >
                    {guest.nickname ? guest.nickname[0] : guest.firstName[0]}
                  </Avatar>
                </Badge>
              }
              title={`${guest.firstName} ${guest.lastName}${guest.nickname ? ` (${guest.nickname})` : ''}`}
              description={guest.relationToCouple || 'ไม่มีข้อมูล'}
            />
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default TableDetailModal;
