/**
 * Guest Selection Sidebar Component
 * Sidebar สำหรับเลือกแขกเพื่อจัดที่นั่ง
 */

import React, { useMemo } from 'react';
import { Card, List, Button, Tag, Divider } from 'antd';
import { Guest, GuestGroup } from '@/types';
import { formatGuestName } from '@/utils/guestHelpers';

interface GuestSelectionSidebarProps {
  guests: Guest[];
  selectedGuestId: string | null;
  selectedGroupId: string | null;
  isAssignMode: boolean;
  onGuestClick: (guestId: string) => void;
  onGroupClick: (groupId: string) => void;
  onCancelAssign: () => void;
  guestGroups: GuestGroup[];
}

const GuestSelectionSidebar: React.FC<GuestSelectionSidebarProps> = ({
  guests,
  selectedGuestId,
  selectedGroupId,
  isAssignMode,
  onGuestClick,
  onGroupClick,
  onCancelAssign,
  guestGroups,
}) => {
  // แยกกลุ่มและรายบุคคล
  const unassignedGroups = useMemo(() => {
    return guestGroups.filter(g => !g.tableId);
  }, [guestGroups]);

  const unassignedIndividualGuests = useMemo(() => {
    return guests.filter(g => !g.tableId && !g.groupId);
  }, [guests]);

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
          {isAssignMode ? 'เลือกโต๊ะที่ต้องการจัดที่นั่ง' : 'คลิกแขกหรือกลุ่มเพื่อจัดที่นั่ง'}
        </div>
      </div>

      {/* กลุ่มแขก */}
      {unassignedGroups.length > 0 && (
        <>
          <div className="text-xs font-semibold text-gray-600 mb-2">กลุ่ม</div>
          <List
            size="small"
            dataSource={unassignedGroups}
            renderItem={(group) => {
              const isSelected = selectedGroupId === group.groupId;
              
              return (
                <List.Item
                  className={`cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100 border-blue-300' : ''}`}
                  onClick={() => onGroupClick(group.groupId)}
                >
                  <div className="w-full">
                    <div className="font-medium">{group.groupName}</div>
                    <div className="text-xs text-gray-500">
                      {group.totalCount} คน
                      {group.checkedInCount > 0 && (
                        <Tag color="green" className="ml-1">
                          เช็คอิน {group.checkedInCount}/{group.totalCount}
                        </Tag>
                      )}
                    </div>
                    <Button
                      type="link"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onGroupClick(group.groupId);
                      }}
                      className="p-0 mt-1"
                    >
                      จัดทั้งกลุ่ม
                    </Button>
                  </div>
                </List.Item>
              );
            }}
          />
          {unassignedIndividualGuests.length > 0 && <Divider className="my-2" />}
        </>
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
                  <div className="w-full">
                    <div className="font-medium">{formatGuestName(guest)}</div>
                    {guest.tableId && (
                      <Tag color="green">จัดที่นั่งแล้ว</Tag>
                    )}
                  </div>
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

