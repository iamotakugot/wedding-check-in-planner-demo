/**
 * Seating Cascader Component
 * Cascader แบบ Multiple สำหรับเลือกแขกหลายคนในการจัดที่นั่ง
 */

import React, { useMemo } from 'react';
import { Cascader } from 'antd';
import { Guest, GuestGroup } from '@/types';
import { formatGuestName, renderMemberLabel } from '@/utils/guestHelpers';

interface SeatingCascaderProps {
  guests: Guest[];
  guestGroups: GuestGroup[];
  value?: string[][];
  onChange?: (value: string[][], selectedOptions?: any[]) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  maxTagCount?: number;
}

interface CascaderOption {
  value: string;
  label: string;
  children?: CascaderOption[];
  disabled?: boolean;
  isLeaf?: boolean;
}

const SeatingCascader: React.FC<SeatingCascaderProps> = ({
  guests,
  guestGroups,
  value = [],
  onChange,
  placeholder = 'เลือกแขกหลายคน',
  style,
  maxTagCount = 3,
}) => {
  // สร้าง Cascader options จาก guestGroups และ guests
  const cascaderOptions = useMemo(() => {
    const options: CascaderOption[] = [];
    const addedMemberIds = new Set<string>();

    // เพิ่มกลุ่มแขก
    guestGroups.forEach(group => {
      const groupMembers: CascaderOption[] = [];
      
      group.members.forEach(member => {
        if (addedMemberIds.has(member.id)) {
          return;
        }

        const memberLabel = renderMemberLabel(group, member);
        groupMembers.push({
          value: `member:${member.id}`,
          label: memberLabel,
          isLeaf: true,
        });
        addedMemberIds.add(member.id);
      });

      if (groupMembers.length > 0) {
        options.push({
          value: `group:${group.groupId}`,
          label: `${group.groupName} (${groupMembers.length} คน)`,
          children: groupMembers,
        });
      }
    });

    // เพิ่มแขกรายบุคคล (ไม่มีกลุ่ม)
    const individualGuests: CascaderOption[] = [];
    guests.forEach(guest => {
      // Skip if already added as a member
      if (addedMemberIds.has(guest.id)) {
        return;
      }

      // Skip if in a group
      const isInGroup = guest.groupId && guestGroups.some(g => g.groupId === guest.groupId);
      if (isInGroup) {
        return;
      }

      const guestName = formatGuestName(guest);
      individualGuests.push({
        value: `guest:${guest.id}`,
        label: `${guestName}${guest.relationToCouple ? ` - ${guest.relationToCouple}` : ''}`,
        isLeaf: true,
      });
    });

    if (individualGuests.length > 0) {
      options.push({
        value: 'individual',
        label: `รายบุคคล (${individualGuests.length} คน)`,
        children: individualGuests,
      });
    }

    return options;
  }, [guests, guestGroups]);

  // Handle change
  const handleChange = (value: string[][], selectedOptions?: any[]) => {
    if (onChange) {
      onChange(value, selectedOptions);
    }
  };

  return (
    <Cascader
      multiple
      value={value}
      options={cascaderOptions}
      onChange={handleChange}
      placeholder={placeholder}
      style={{ width: '100%', ...style }}
      maxTagCount={maxTagCount}
      showSearch={{
        filter: (inputValue, path) => {
          return path.some(option => 
            option.label.toLowerCase().includes(inputValue.toLowerCase())
          );
        },
      }}
      displayRender={(labels, selectedOptions) => {
        if (!selectedOptions || selectedOptions.length === 0) {
          return placeholder;
        }
        return labels.join(', ');
      }}
    />
  );
};

export default SeatingCascader;

