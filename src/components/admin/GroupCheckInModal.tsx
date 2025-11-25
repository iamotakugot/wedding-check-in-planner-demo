/**
 * Group Check-in Modal Component
 * Modal สำหรับเช็คอินแขกเป็นกลุ่ม
 */

import React from 'react';
import { Modal, Checkbox, Space, Tag } from 'antd';
import { Guest, RSVPData } from '@/types';
import { getGuestRSVPStatus } from '@/utils/guestHelpers';
import { formatGuestName } from '@/utils/guestHelpers';

interface GroupCheckInModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  group: { groupId: string; guests: Guest[]; groupName: string } | null;
  selectedGuestIds: string[];
  onSelectionChange: (ids: string[]) => void;
  rsvpMap: Map<string, RSVPData>;
}

const GroupCheckInModal: React.FC<GroupCheckInModalProps> = ({
  visible,
  onClose,
  onSubmit,
  group,
  selectedGuestIds,
  onSelectionChange,
  rsvpMap,
}) => {
  if (!group) return null;

  // คำนวณจำนวนคนที่เช็คอินแล้ว
  const checkedInCount = group.guests.filter(g => g.checkedInAt).length;
  const totalCount = group.guests.length;

  return (
    <Modal
      title={
        <div>
          <div>เช็คอินกลุ่ม: {group.groupName || ''}</div>
          <div className="text-sm font-normal text-gray-500 mt-1">
            เช็คอินแล้ว {checkedInCount} / {totalCount} คน
          </div>
        </div>
      }
      open={visible}
      onOk={onSubmit}
      onCancel={onClose}
      okText="เช็คอินที่เลือก"
      cancelText="ยกเลิก"
      width={600}
    >
      <div className="max-h-96 overflow-y-auto">
        <Checkbox.Group
          value={selectedGuestIds}
          onChange={(values) => onSelectionChange(values as string[])}
          className="w-full"
        >
          <Space direction="vertical" className="w-full">
            {group.guests.map(guest => {
              const rsvpStatus = getGuestRSVPStatus(guest, rsvpMap);
              const canCheckIn = rsvpStatus !== 'no';
              const isCheckedIn = !!guest.checkedInAt;
              
              return (
                <div key={guest.id} className="flex items-center justify-between p-2 border-b">
                  <Checkbox
                    value={guest.id}
                    disabled={!canCheckIn || isCheckedIn}
                  >
                    <div>
                      <div className="font-medium">{formatGuestName(guest)}</div>
                      {isCheckedIn && (
                        <Tag color="green">เช็คอินแล้ว</Tag>
                      )}
                      {!canCheckIn && !isCheckedIn && (
                        <Tag color="red">ไม่ตอบรับเข้าร่วมงาน</Tag>
                      )}
                    </div>
                  </Checkbox>
                </div>
              );
            })}
          </Space>
        </Checkbox.Group>
      </div>
      <div className="mt-4 text-sm text-gray-500">
        เลือก {selectedGuestIds.length} คน จาก {totalCount} คน
      </div>
    </Modal>
  );
};

export default GroupCheckInModal;

