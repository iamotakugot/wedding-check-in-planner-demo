/**
 * Group Member Tooltip Component
 * แสดงรายชื่อสมาชิกทั้งหมดในกลุ่มเมื่อ hover
 */

import React from 'react';
import { Tooltip, List, Tag, Space } from 'antd';
import { GuestGroup } from '@/types';
import { formatGuestName } from '@/utils/guestHelpers';

interface GroupMemberTooltipProps {
  group: GuestGroup;
  children: React.ReactNode;
}

const GroupMemberTooltip: React.FC<GroupMemberTooltipProps> = ({ group, children }) => {
  const tooltipContent = (
    <div style={{ maxWidth: 300 }}>
      <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
        {group.groupName} ({group.totalCount} คน)
      </div>
      <List
        size="small"
        dataSource={group.members}
        renderItem={(member) => {
          const isCheckedIn = member.checkedInAt !== null;
          return (
            <List.Item style={{ padding: '4px 0' }}>
              <Space>
                <span>{formatGuestName({ firstName: member.firstName, lastName: member.lastName } as any)}</span>
                {member.nickname && (
                  <span style={{ color: '#999', fontSize: 12 }}>({member.nickname})</span>
                )}
                {isCheckedIn && (
                  <Tag color="green">เช็คอินแล้ว</Tag>
                )}
                {member.seat && (
                  <Tag color="blue">โต๊ะ</Tag>
                )}
              </Space>
            </List.Item>
          );
        }}
      />
      <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
        เช็คอินแล้ว {group.checkedInCount} / {group.totalCount} คน
      </div>
    </div>
  );

  return (
    <Tooltip title={tooltipContent} placement="top">
      {children}
    </Tooltip>
  );
};

export default GroupMemberTooltip;

