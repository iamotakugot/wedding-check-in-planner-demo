/**
 * Guest Selection Sidebar Component
 * Sidebar สำหรับเลือกแขกเพื่อจัดที่นั่ง (รายคน)
 */

import React, { useMemo, useState, useEffect } from 'react';
import { Card, List, Button, Tag, Collapse, Avatar, Input, Space, Checkbox } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { Guest, GuestGroup, GroupMember } from '@/types';
import { formatGuestName, renderMemberLabel } from '@/utils/guestHelpers';

// Custom Search component to avoid Input.Search addonAfter warning
const CustomSearch: React.FC<{
  placeholder?: string;
  allowClear?: boolean;
  size?: 'small' | 'middle' | 'large';
  style?: React.CSSProperties;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  prefix?: React.ReactNode;
}> = ({ placeholder, allowClear, size, style, onChange, value, prefix }) => {
  const [searchValue, setSearchValue] = useState(value || '');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    if (onChange) {
      onChange(e);
    }
  };

  const handleClear = () => {
    setSearchValue('');
    if (onChange) {
      onChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  useEffect(() => {
    if (value !== undefined) {
      setSearchValue(value);
    }
  }, [value]);

  return (
    <Space.Compact style={style} size={size}>
      <Input
        placeholder={placeholder}
        value={searchValue}
        onChange={handleChange}
        prefix={prefix}
        allowClear={allowClear}
        onClear={handleClear}
        size={size}
        style={{ flex: 1 }}
      />
    </Space.Compact>
  );
};

interface GuestSelectionSidebarProps {
  guests: Guest[];
  selectedGuestId: string | null;
  selectedGuestIds: string[];
  isAssignMode: boolean;
  onGuestClick: (guestId: string) => void;
  onMemberClick: (memberId: string) => void;
  onCancelAssign: () => void;
  onGuestIdsChange: (guestIds: string[]) => void;
  guestGroups: GuestGroup[];
}

const GuestSelectionSidebar: React.FC<GuestSelectionSidebarProps> = ({
  guests,
  selectedGuestId,
  selectedGuestIds,
  isAssignMode,
  onGuestClick,
  onMemberClick,
  onCancelAssign,
  onGuestIdsChange,
  guestGroups,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSide, setSelectedSide] = useState<'all' | 'groom' | 'bride'>('all');
  const [selectedRelation, setSelectedRelation] = useState<'all' | 'friend' | 'family' | 'elder'>('all');

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

  // Helper function to categorize relation
  const categorizeRelation = (relation: string): 'friend' | 'family' | 'elder' | 'other' => {
    const relationLower = (relation || '').toLowerCase();
    
    // เพื่อน
    if (
      relationLower.includes('เพื่อน') ||
      relationLower.includes('friend') ||
      relationLower.includes('เพื่อนมัธยม') ||
      relationLower.includes('เพื่อนมหาวิทยาลัย') ||
      relationLower.includes('เพื่อนทำงาน')
    ) {
      return 'friend';
    }
    
    // ญาติ
    if (
      relationLower.includes('ญาติ') ||
      relationLower.includes('พี่') ||
      relationLower.includes('น้อง') ||
      relationLower.includes('ลุง') ||
      relationLower.includes('ป้า') ||
      relationLower.includes('น้า') ||
      relationLower.includes('อา') ||
      relationLower.includes('ปู่') ||
      relationLower.includes('ย่า') ||
      relationLower.includes('ตา') ||
      relationLower.includes('ยาย') ||
      relationLower.includes('cousin') ||
      relationLower.includes('uncle') ||
      relationLower.includes('aunt')
    ) {
      return 'family';
    }
    
    // ผู้ใหญ่
    if (
      relationLower.includes('พ่อ') ||
      relationLower.includes('แม่') ||
      relationLower.includes('คุณพ่อ') ||
      relationLower.includes('คุณแม่') ||
      relationLower.includes('พ่อแม่') ||
      relationLower.includes('ปู่') ||
      relationLower.includes('ย่า') ||
      relationLower.includes('ตา') ||
      relationLower.includes('ยาย') ||
      relationLower.includes('ลุง') ||
      relationLower.includes('ป้า') ||
      relationLower.includes('น้า') ||
      relationLower.includes('อา') ||
      relationLower.includes('parent') ||
      relationLower.includes('grandparent')
    ) {
      return 'elder';
    }
    
    return 'other';
  };

  // Filter groups and members based on search, side, and relation filter
  const filteredGroups = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    
    return guestGroups
      .filter(group => {
        // Filter by side
        if (selectedSide !== 'all') {
          if (selectedSide === 'groom' && group.side !== 'groom') return false;
          if (selectedSide === 'bride' && group.side !== 'bride') return false;
        }

        // Filter unassigned members
        let unassignedMembers = group.members.filter(m => !m.seat);
        
        // Filter by relation category
        if (selectedRelation !== 'all') {
          unassignedMembers = unassignedMembers.filter(member => {
            const relation = member.relationToMain || '';
            const category = categorizeRelation(relation);
            return category === selectedRelation;
          });
        }
        
        // Filter by search term
        if (searchLower) {
          const matchingMembers = unassignedMembers.filter(member => {
            const memberName = (member.fullName || `${member.firstName} ${member.lastName}`).toLowerCase();
            const relationToMain = (member.relationToMain || '').toLowerCase();
            const groupName = group.groupName.toLowerCase();
            
            return (
              memberName.includes(searchLower) ||
              relationToMain.includes(searchLower) ||
              groupName.includes(searchLower)
            );
          });
          
          return matchingMembers.length > 0;
        }
        
        return unassignedMembers.length > 0;
      })
      .map(group => {
        let unassignedMembers = group.members.filter(m => !m.seat);
        
        // Apply relation filter
        if (selectedRelation !== 'all') {
          unassignedMembers = unassignedMembers.filter(member => {
            const relation = member.relationToMain || '';
            const category = categorizeRelation(relation);
            return category === selectedRelation;
          });
        }
        
        // Apply search filter to members
        if (searchTerm.trim()) {
          const searchLower = searchTerm.toLowerCase().trim();
          const filteredMembers = unassignedMembers.filter(member => {
            const memberName = (member.fullName || `${member.firstName} ${member.lastName}`).toLowerCase();
            const relationToMain = (member.relationToMain || '').toLowerCase();
            const groupName = group.groupName.toLowerCase();
            
            return (
              memberName.includes(searchLower) ||
              relationToMain.includes(searchLower) ||
              groupName.includes(searchLower)
            );
          });
          
          return {
            ...group,
            unassignedMembers: filteredMembers,
          };
        }
        
        return {
          ...group,
          unassignedMembers,
        };
      })
      .filter(group => group.unassignedMembers.length > 0);
  }, [guestGroups, searchTerm, selectedSide, selectedRelation]);

  const filteredIndividualGuests = useMemo(() => {
    let unassigned = guests.filter(g => !g.tableId && !g.groupId);
    
    // Filter by side
    if (selectedSide !== 'all') {
      unassigned = unassigned.filter(guest => {
        if (selectedSide === 'groom' && guest.side !== 'groom') return false;
        if (selectedSide === 'bride' && guest.side !== 'bride') return false;
        return true;
      });
    }
    
    // Filter by relation category
    if (selectedRelation !== 'all') {
      unassigned = unassigned.filter(guest => {
        const relation = guest.relationToCouple || '';
        const category = categorizeRelation(relation);
        return category === selectedRelation;
      });
    }
    
    // Filter by search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      unassigned = unassigned.filter(guest => {
        const guestName = formatGuestName(guest).toLowerCase();
        const relation = (guest.relationToCouple || '').toLowerCase();
        return guestName.includes(searchLower) || relation.includes(searchLower);
      });
    }
    
    return unassigned;
  }, [guests, searchTerm, selectedSide, selectedRelation]);

  return (
    <Card 
      className="w-64 flex-shrink-0" 
      title="แขกที่ยังไม่ได้จัดที่นั่ง"
      styles={{ body: { padding: '12px' } }}
    >
      <div className="mb-3">
        <div className="flex gap-2 mb-2">
          {isAssignMode && (
            <Button
              type="default"
              danger
              size="small"
              onClick={onCancelAssign}
              style={{ flex: 1 }}
            >
              ยกเลิก
            </Button>
          )}
          {selectedGuestIds.length > 0 && (
            <Button
              type="default"
              size="small"
              onClick={() => onGuestIdsChange([])}
              style={{ flex: 1 }}
            >
              ล้างการเลือก ({selectedGuestIds.length})
            </Button>
          )}
        </div>
        <div className="text-sm text-gray-500 mb-2">
          {isAssignMode 
            ? 'เลือกโต๊ะที่ต้องการจัดที่นั่ง' 
            : selectedGuestIds.length > 0
            ? `เลือกแล้ว ${selectedGuestIds.length} คน - คลิกโต๊ะเพื่อจัดที่นั่ง`
            : 'ติ๊กเลือกหลายคน หรือคลิกสมาชิกเพื่อจัดที่นั่ง'}
        </div>
        
        {/* Search Input */}
        <CustomSearch
          placeholder="ค้นหาชื่อ/ความสัมพันธ์"
          allowClear
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: '8px', width: '100%' }}
          prefix={<SearchOutlined />}
        />
        
        {/* Side Filter Buttons */}
        <Space.Compact size="small" className="w-full mb-2">
          <Button
            type={selectedSide === 'all' ? 'primary' : 'default'}
            size="small"
            onClick={() => setSelectedSide('all')}
            style={{ flex: 1 }}
          >
            ทั้งหมด
          </Button>
          <Button
            type={selectedSide === 'groom' ? 'primary' : 'default'}
            size="small"
            onClick={() => setSelectedSide('groom')}
            style={{ flex: 1 }}
          >
            เจ้าบ่าว
          </Button>
          <Button
            type={selectedSide === 'bride' ? 'primary' : 'default'}
            size="small"
            onClick={() => setSelectedSide('bride')}
            style={{ flex: 1 }}
          >
            เจ้าสาว
          </Button>
        </Space.Compact>
        
        {/* Relation Category Filter Buttons */}
        <div className="text-xs text-gray-600 mb-1">หมวดหมู่:</div>
        <Space.Compact size="small" className="w-full">
          <Button
            type={selectedRelation === 'all' ? 'primary' : 'default'}
            size="small"
            onClick={() => setSelectedRelation('all')}
            style={{ flex: 1 }}
          >
            ทั้งหมด
          </Button>
          <Button
            type={selectedRelation === 'friend' ? 'primary' : 'default'}
            size="small"
            onClick={() => setSelectedRelation('friend')}
            style={{ flex: 1 }}
          >
            เพื่อน
          </Button>
          <Button
            type={selectedRelation === 'family' ? 'primary' : 'default'}
            size="small"
            onClick={() => setSelectedRelation('family')}
            style={{ flex: 1 }}
          >
            ญาติ
          </Button>
          <Button
            type={selectedRelation === 'elder' ? 'primary' : 'default'}
            size="small"
            onClick={() => setSelectedRelation('elder')}
            style={{ flex: 1 }}
          >
            ผู้ใหญ่
          </Button>
        </Space.Compact>
      </div>

      {/* กลุ่มแขก (แสดงสมาชิกรายคน) */}
      {filteredGroups.length > 0 && (
        <Collapse
          accordion={false}
          size="small"
          className="mb-2"
          items={filteredGroups.map((group) => ({
            key: group.groupId,
            label: (
              <div className="flex items-center justify-between">
                <span className="font-medium">{group.groupName}</span>
                <Tag color="blue" className="ml-2">
                  {group.unassignedMembers.length} คน
                </Tag>
              </div>
            ),
            children: (
              <List
                size="small"
                dataSource={group.unassignedMembers}
                renderItem={(member: GroupMember) => {
                  const isSelected = selectedGuestId === member.id;
                  const isChecked = selectedGuestIds.includes(member.id);
                  
                  return (
                    <List.Item
                      className={`cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100 border-blue-300' : ''}`}
                      onClick={(e) => {
                        // Don't trigger if clicking checkbox
                        if ((e.target as HTMLElement).closest('.ant-checkbox')) {
                          return;
                        }
                        onMemberClick(member.id);
                      }}
                      actions={[
                        <Checkbox
                          key="checkbox"
                          checked={isChecked}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              onGuestIdsChange([...selectedGuestIds, member.id]);
                            } else {
                              onGuestIdsChange(selectedGuestIds.filter(id => id !== member.id));
                            }
                          }}
                        />
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                            {(member.fullName || member.firstName || '?').charAt(0).toUpperCase()}
                          </Avatar>
                        }
                        title={
                          <span 
                            style={{ 
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={renderMemberLabel(group, member)}
                          >
                            {renderMemberLabel(group, member)}
                          </span>
                        }
                        description={
                          <span 
                            style={{ 
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {`${getSideLabel(group.side)} • ${member.relationToMain || 'ไม่ระบุ'}`}
                          </span>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            ),
          }))}
        />
      )}

      {/* รายบุคคล */}
      {filteredIndividualGuests.length > 0 && (
        <>
          <div className="text-xs font-semibold text-gray-600 mb-2">รายบุคคล</div>
          <List
            size="small"
            dataSource={filteredIndividualGuests}
            renderItem={(guest) => {
              const isSelected = selectedGuestId === guest.id;
              const isChecked = selectedGuestIds.includes(guest.id);
              
              return (
                <List.Item
                  className={`cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100 border-blue-300' : ''}`}
                  onClick={(e) => {
                    // Don't trigger if clicking checkbox
                    if ((e.target as HTMLElement).closest('.ant-checkbox')) {
                      return;
                    }
                    onGuestClick(guest.id);
                  }}
                  actions={[
                    <Checkbox
                      key="checkbox"
                      checked={isChecked}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) {
                          onGuestIdsChange([...selectedGuestIds, guest.id]);
                        } else {
                          onGuestIdsChange(selectedGuestIds.filter(id => id !== guest.id));
                        }
                      }}
                    />
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                        {formatGuestName(guest).charAt(0).toUpperCase() || '?'}
                      </Avatar>
                    }
                    title={
                      <span 
                        style={{ 
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={formatGuestName(guest)}
                      >
                        {formatGuestName(guest)}
                      </span>
                    }
                    description={
                      <span 
                        style={{ 
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {guest.relationToCouple || 'ไม่ระบุ'}
                      </span>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </>
      )}

      {filteredGroups.length === 0 && filteredIndividualGuests.length === 0 && (
        <div className="text-sm text-gray-400 text-center py-4">
          {searchTerm.trim() || selectedSide !== 'all' 
            ? 'ไม่พบผลการค้นหา' 
            : 'ไม่มีแขกที่ยังไม่ได้จัดที่นั่ง'}
        </div>
      )}
    </Card>
  );
};

export default GuestSelectionSidebar;

