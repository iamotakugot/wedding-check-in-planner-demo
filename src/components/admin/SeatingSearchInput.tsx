/**
 * Seating Search Input Component
 * Autocomplete search สำหรับค้นหาแขก/กลุ่มในการจัดที่นั่ง
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AutoComplete, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { Guest, GuestGroup, GroupMember } from '@/types';
import { formatGuestName, renderMemberLabel } from '@/utils/guestHelpers';

interface SeatingSearchInputProps {
  guests: Guest[];
  guestGroups: GuestGroup[];
  onSearch: (value: string) => void;
  onSelect?: (value: string, option: SearchOption) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

interface SearchOption {
  value: string;
  label: string;
  type: 'member' | 'guest' | 'relation';
  data: GroupMember | Guest | string;
}

const SeatingSearchInput: React.FC<SeatingSearchInputProps> = ({
  guests,
  guestGroups,
  onSearch,
  onSelect,
  placeholder = 'ค้นหาชื่อกลุ่ม / สมาชิก / ความสัมพันธ์',
  style,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<any>(null);

  // สร้าง search options จาก guests และ guestGroups (ค้นหาสมาชิกรายคน)
  const searchOptions = useMemo(() => {
    if (!searchValue || searchValue.trim().length < 1) {
      return [];
    }

    const searchTerm = searchValue.trim().toLowerCase();
    const options: SearchOption[] = [];
    const addedMemberIds = new Set<string>();

    // ค้นหาในสมาชิกของกลุ่ม (รายคน)
    guestGroups.forEach(group => {
      group.members.forEach(member => {
        // Skip if already added
        if (addedMemberIds.has(member.id)) {
          return;
        }

        const memberName = `${member.firstName} ${member.lastName}`.toLowerCase();
        const fullMemberName = (member.fullName || `${member.firstName} ${member.lastName}`).toLowerCase();
        const relationToMain = member.relationToMain?.toLowerCase() || '';
        const groupName = group.groupName.toLowerCase();
        
        // ค้นหาตามชื่อสมาชิก, ชื่อกลุ่ม, หรือความสัมพันธ์
        if (
          memberName.includes(searchTerm) ||
          fullMemberName.includes(searchTerm) ||
          relationToMain.includes(searchTerm) ||
          groupName.includes(searchTerm)
        ) {
          const memberLabel = renderMemberLabel(group, member);
          options.push({
            value: `member:${member.id}`,
            label: memberLabel,
            type: 'member',
            data: member,
          });
          addedMemberIds.add(member.id);
        }
      });
    });

    // ค้นหาใน guests (รายบุคคล - ไม่มีกลุ่ม)
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

      const guestName = formatGuestName(guest).toLowerCase();
      const relation = guest.relationToCouple?.toLowerCase() || '';
      
      if (guestName.includes(searchTerm) || relation.includes(searchTerm)) {
        options.push({
          value: `guest:${guest.id}`,
          label: `${formatGuestName(guest)}${guest.relationToCouple ? ` - ${guest.relationToCouple}` : ''}`,
          type: 'guest',
          data: guest,
        });
      }
    });

    // ค้นหาตามความสัมพันธ์ (optional - สามารถลบได้ถ้าไม่ต้องการ)
    const uniqueRelations = new Set<string>();
    guests.forEach(guest => {
      if (guest.relationToCouple) {
        const relation = guest.relationToCouple.toLowerCase();
        if (relation.includes(searchTerm) && !uniqueRelations.has(relation)) {
          uniqueRelations.add(relation);
          options.push({
            value: `relation:${relation}`,
            label: `ความสัมพันธ์: ${guest.relationToCouple}`,
            type: 'relation',
            data: relation,
          });
        }
      }
    });

    return options.slice(0, 10); // จำกัด 10 รายการ
  }, [searchValue, guests, guestGroups]);

  // Handle input change
  const handleChange = (value: string) => {
    setSearchValue(value);
    setIsOpen(value.length >= 1);
    onSearch(value);
  };

  // Handle select
  const handleSelect = (value: string, option: SearchOption) => {
    setSearchValue('');
    setIsOpen(false);
    if (onSelect) {
      onSelect(value, option);
    }
  };

  // Handle clear
  const handleClear = () => {
    setSearchValue('');
    setIsOpen(false);
    onSearch('');
  };

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div style={{ position: 'relative', ...style }}>
      <AutoComplete
        ref={inputRef}
        value={searchValue}
        options={searchOptions}
        onSelect={handleSelect}
        onSearch={handleChange}
        open={isOpen && searchOptions.length > 0}
        onBlur={() => {
          // Delay closing เพื่อให้ onSelect ทำงานได้
          setTimeout(() => setIsOpen(false), 200);
        }}
        onFocus={() => {
          if (searchValue.length >= 1) {
            setIsOpen(true);
          }
        }}
        style={{ width: '100%' }}
        placeholder={placeholder}
        allowClear
        suffixIcon={
          searchValue ? (
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={handleClear}
              style={{ border: 'none', padding: 0 }}
            />
          ) : undefined
        }
      />
    </div>
  );
};

export default SeatingSearchInput;

