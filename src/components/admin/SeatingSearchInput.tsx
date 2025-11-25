/**
 * Seating Search Input Component
 * Autocomplete search สำหรับค้นหาแขก/กลุ่มในการจัดที่นั่ง
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AutoComplete, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { Guest, GuestGroup } from '@/types';
import { formatGuestName } from '@/utils/guestHelpers';

interface SeatingSearchInputProps {
  guests: Guest[];
  guestGroups: GuestGroup[];
  onSearch: (value: string) => void;
  onSelect?: (value: string, option: any) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

interface SearchOption {
  value: string;
  label: string;
  type: 'group' | 'guest' | 'relation';
  data: GuestGroup | Guest | string;
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

  // สร้าง search options จาก guests และ guestGroups
  const searchOptions = useMemo(() => {
    if (!searchValue || searchValue.trim().length < 1) {
      return [];
    }

    const searchTerm = searchValue.trim().toLowerCase();
    const options: SearchOption[] = [];

    // ค้นหาใน guestGroups (ชื่อกลุ่ม)
    guestGroups.forEach(group => {
      const groupName = group.groupName.toLowerCase();
      if (groupName.includes(searchTerm)) {
        options.push({
          value: `group:${group.groupId}`,
          label: `${group.groupName} (กลุ่ม ${group.totalCount} คน)`,
          type: 'group',
          data: group,
        });
      }

      // ค้นหาในสมาชิกของกลุ่ม
      group.members.forEach(member => {
        const memberName = `${member.firstName} ${member.lastName}`.toLowerCase();
        if (memberName.includes(searchTerm) && !options.find(o => o.value === `group:${group.groupId}`)) {
          // ถ้ายังไม่มี group ใน options ให้เพิ่ม
          if (!options.find(o => o.value === `group:${group.groupId}`)) {
            options.push({
              value: `group:${group.groupId}`,
              label: `${group.groupName} (กลุ่ม ${group.totalCount} คน)`,
              type: 'group',
              data: group,
            });
          }
        }
      });
    });

    // ค้นหาใน guests (รายบุคคล)
    guests.forEach(guest => {
      const guestName = formatGuestName(guest).toLowerCase();
      const relation = guest.relationToCouple?.toLowerCase() || '';
      
      if (guestName.includes(searchTerm) || relation.includes(searchTerm)) {
        // ตรวจสอบว่าแขกนี้อยู่ในกลุ่มหรือไม่
        const isInGroup = guest.groupId && guestGroups.some(g => g.groupId === guest.groupId);
        
        if (!isInGroup) {
          options.push({
            value: `guest:${guest.id}`,
            label: `${formatGuestName(guest)}${guest.relationToCouple ? ` - ${guest.relationToCouple}` : ''}`,
            type: 'guest',
            data: guest,
          });
        }
      }
    });

    // ค้นหาตามความสัมพันธ์
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
  const handleSelect = (value: string, option: any) => {
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

