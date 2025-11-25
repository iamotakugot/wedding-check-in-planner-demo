/**
 * Guest Selection Sidebar Component
 * Sidebar สำหรับเลือกแขกเพื่อจัดที่นั่ง
 */

import React from 'react';
import { Card, List, Button, Tag } from 'antd';
import { Guest } from '@/types';
import { formatGuestName } from '@/utils/guestHelpers';

interface GuestSelectionSidebarProps {
  guests: Guest[];
  selectedGuestId: string | null;
  isAssignMode: boolean;
  onGuestClick: (guestId: string) => void;
  onCancelAssign: () => void;
  groupedGuests: Map<string, Guest[]>;
}

const GuestSelectionSidebar: React.FC<GuestSelectionSidebarProps> = ({
  guests,
  selectedGuestId,
  isAssignMode,
  onGuestClick,
  onCancelAssign,
  groupedGuests,
}) => {
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
          {isAssignMode ? 'เลือกโต๊ะที่ต้องการจัดที่นั่ง' : 'คลิกแขกเพื่อจัดที่นั่ง'}
        </div>
      </div>
      <List
        size="small"
        dataSource={guests}
        renderItem={(guest) => {
          const isSelected = selectedGuestId === guest.id;
          const groupName = guest.groupName || '';
          const groupSize = guest.groupId ? groupedGuests.get(guest.groupId)?.length || 0 : 0;
          
          return (
            <List.Item
              className={`cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100 border-blue-300' : ''}`}
              onClick={() => onGuestClick(guest.id)}
            >
              <div className="w-full">
                <div className="font-medium">{formatGuestName(guest)}</div>
                {groupName && groupSize > 1 && (
                  <div className="text-xs text-gray-500">{`${groupName} (${groupSize} คน)`}</div>
                )}
                {guest.tableId && (
                  <Tag color="green">จัดที่นั่งแล้ว</Tag>
                )}
              </div>
            </List.Item>
          );
        }}
      />
    </Card>
  );
};

export default GuestSelectionSidebar;

