/**
 * Guest Selection Sidebar Component
 * Sidebar สำหรับเลือกแขกเพื่อจัดที่นั่ง (รายคน)
 */

import React, { useMemo, useState } from 'react';
import { Card, List, Button, Tag, Collapse, Avatar, Input, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { Guest, GuestGroup, GroupMember } from '@/types';
import { formatGuestName, renderMemberLabel } from '@/utils/guestHelpers';

const { Panel } = Collapse;
const { Search } = Input;

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSide, setSelectedSide] = useState<'all' | 'groom' | 'bride'>('all');

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

  // Filter groups and members based on search and side filter
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
        const unassignedMembers = group.members.filter(m => !m.seat);
        
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
        const unassignedMembers = group.members.filter(m => !m.seat);
        
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
  }, [guestGroups, searchTerm, selectedSide]);

  const filteredIndividualGuests = useMemo(() => {
    const unassigned = guests.filter(g => !g.tableId && !g.groupId);
    
    if (!searchTerm.trim() && selectedSide === 'all') {
      return unassigned;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    
    return unassigned.filter(guest => {
      // Filter by side
      if (selectedSide !== 'all') {
        if (selectedSide === 'groom' && guest.side !== 'groom') return false;
        if (selectedSide === 'bride' && guest.side !== 'bride') return false;
      }
      
      // Filter by search
      if (searchLower) {
        const guestName = formatGuestName(guest).toLowerCase();
        const relation = (guest.relationToCouple || '').toLowerCase();
        return guestName.includes(searchLower) || relation.includes(searchLower);
      }
      
      return true;
    });
  }, [guests, searchTerm, selectedSide]);

  return (
    <Card 
      className="w-64 flex-shrink-0" 
      title="แขกที่ยังไม่ได้จัดที่นั่ง"
      styles={{ body: { padding: '12px' } }}
    >
      <div className="mb-3">
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
        
        {/* Search Input */}
        <Search
          placeholder="ค้นหาชื่อ/ความสัมพันธ์"
          allowClear
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: '8px' }}
          prefix={<SearchOutlined />}
        />
        
        {/* Side Filter Buttons */}
        <Space.Compact size="small" className="w-full">
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
      </div>

      {/* กลุ่มแขก (แสดงสมาชิกรายคน) */}
      {filteredGroups.length > 0 && (
        <Collapse
          accordion={false}
          size="small"
          className="mb-2"
        >
          {filteredGroups.map((group) => (
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
            </Panel>
          ))}
        </Collapse>
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

