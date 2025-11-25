/**
 * Guest Selection Sidebar Component
 * Sidebar สำหรับเลือกแขกเพื่อจัดที่นั่ง (รายคน)
 */

import React, { useMemo } from 'react';
import { Card, List, Button, Tag, Collapse, Avatar } from 'antd';
import { Guest, GuestGroup, GroupMember } from '@/types';
import { formatGuestName, renderMemberLabel } from '@/utils/guestHelpers';

const { Panel } = Collapse;

interface GuestSelectionSidebarProps {
  guests: Guest[];
  selectedGuestId: string | null;
  isAssignMode: boolean;
  onGuestClick: (guestId: string) => void;
  onMemberClick: (memberId: string) => void;
  onCancelAssign: () => void;
  guestGroups: GuestGroup[];
}

const GuestSelectionSidebar: React.FC<GuestSelectionSidebarProps> = ({
  guests,
  selectedGuestId,
  isAssignMode,
  onGuestClick,
  onMemberClick,
  onCancelAssign,
  guestGroups,
}) => {
  // หาสมาชิกที่ยังไม่ได้จัดที่นั่ง (ไม่มี tableId)
  const unassignedGroups = useMemo(() => {
    return guestGroups
      .map(group => ({
        ...group,
        unassignedMembers: group.members.filter(m => !m.tableId && !m.seat),
      }))
      .filter(group => group.unassignedMembers.length > 0);
  }, [guestGroups]);

  const unassignedIndividualGuests = useMemo(() => {
    return guests.filter(g => !g.tableId && !g.groupId);
  }, [guests]);

  // Helper function to get side label in Thai
  const getSideLabel = (side: string): string => {
    switch (side) {
      case 'groom':
        return 'เจ้าบ่าว';
      case 'bride':
        return 'เจ้าสาว';
      case 'both':
        return 'อื่น ๆ';
      default:
        return 'อื่น ๆ';
    }
  };

  return (
    <Card className="w-64 flex-shrink-0" title="แขกที่ยังไม่ได้จัดที่นั่ง">
      <div className="mb-2">
        {isAssignMode && (
          <Button
            type="default"
            danger
            size="small"
            onClick={onCancelAssign}
            className="w-full mb-2"
          >
            ยกเลิก
          </Button>
        )}
        <div className="text-sm text-gray-500 mb-2">
          {isAssignMode ? 'เลือกโต๊ะที่ต้องการจัดที่นั่ง' : 'คลิกสมาชิกเพื่อจัดที่นั่ง'}
        </div>
      </div>

      {/* กลุ่มแขก (แสดงสมาชิกรายคน) */}
      {unassignedGroups.length > 0 && (
        <Collapse
          accordion={false}
          size="small"
          className="mb-2"
        >
          {unassignedGroups.map((group) => (
            <Panel
              key={group.groupId}
              header={
                <div className="flex items-center justify-between">
                  <span className="font-medium">{group.groupName}</span>
                  <Tag color="blue" className="ml-2">
                    {group.unassignedMembers.length} คน
                  </Tag>
                </div>
              }
            >
              <List
                size="small"
                dataSource={group.unassignedMembers}
                renderItem={(member: GroupMember) => {
                  const isSelected = selectedGuestId === member.id;
                  
                  return (
                    <List.Item
                      className={`cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100 border-blue-300' : ''}`}
                      onClick={() => onMemberClick(member.id)}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                            {(member.fullName || member.firstName || '?').charAt(0).toUpperCase()}
                          </Avatar>
                        }
                        title={renderMemberLabel(group, member)}
                        description={`${getSideLabel(group.side)} • ${member.relationToMain || 'ไม่ระบุ'}`}
                      />
                    </List.Item>
                  );
                }}
              />
            </Panel>
          ))}
        </Collapse>
      )}

      {/* รายบุคคล */}
      {unassignedIndividualGuests.length > 0 && (
        <>
          <div className="text-xs font-semibold text-gray-600 mb-2">รายบุคคล</div>
          <List
            size="small"
            dataSource={unassignedIndividualGuests}
            renderItem={(guest) => {
              const isSelected = selectedGuestId === guest.id;
              
              return (
                <List.Item
                  className={`cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100 border-blue-300' : ''}`}
                  onClick={() => onGuestClick(guest.id)}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                        {formatGuestName(guest).charAt(0).toUpperCase() || '?'}
                      </Avatar>
                    }
                    title={formatGuestName(guest)}
                    description={guest.relationToCouple || 'ไม่ระบุ'}
                  />
                </List.Item>
              );
            }}
          />
        </>
      )}

      {unassignedGroups.length === 0 && unassignedIndividualGuests.length === 0 && (
        <div className="text-sm text-gray-400 text-center py-4">
          ไม่มีแขกที่ยังไม่ได้จัดที่นั่ง
        </div>
      )}
    </Card>
  );
};

export default GuestSelectionSidebar;

