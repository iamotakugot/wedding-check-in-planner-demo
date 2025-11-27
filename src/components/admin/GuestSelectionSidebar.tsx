/**
 * Guest Selection Sidebar Component
 * Sidebar สำหรับเลือกแขกเพื่อจัดที่นั่ง (รายคน)
 */

import React, { useMemo, useState } from 'react';
import { Card, List, Button, Tag, Collapse, Avatar, Cascader, Space, Checkbox } from 'antd';
import { Guest, GuestGroup, GroupMember } from '@/types';
import { formatGuestName, renderMemberLabel } from '@/utils/guestHelpers';
import { RSVP_RELATION_OPTIONS, RSVP_GUEST_RELATION_OPTIONS } from '@/data/formOptions';

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
  const [selectedRelations, setSelectedRelations] = useState<string[][]>([]);
  const [selectedSide, setSelectedSide] = useState<'all' | 'groom' | 'bride'>('all');

  // สร้าง Cascader options จาก formOptions
  const relationCascaderOptions = useMemo(() => {
    const options: any[] = [];
    
    // หมวดหมู่: เพื่อน
    const friendOptions = RSVP_RELATION_OPTIONS
      .filter(opt => opt.value.includes('เพื่อน'))
      .map(opt => ({
        value: opt.value,
        label: opt.value,
        isLeaf: true,
      }));
    
    if (friendOptions.length > 0) {
      options.push({
        value: 'เพื่อน',
        label: 'เพื่อน',
        children: friendOptions,
      });
    }
    
    // หมวดหมู่: ญาติ
    const familyOptions = RSVP_RELATION_OPTIONS
      .filter(opt => opt.value.includes('ญาติ'))
      .map(opt => ({
        value: opt.value,
        label: opt.value,
        isLeaf: true,
      }));
    
    if (familyOptions.length > 0) {
      options.push({
        value: 'ญาติ',
        label: 'ญาติ',
        children: familyOptions,
      });
    }
    
    // หมวดหมู่: ผู้ใหญ่ (พ่อ/แม่, ครู/อาจารย์, ผู้บังคับบัญชา)
    const elderOptions = [
      ...RSVP_RELATION_OPTIONS.filter(opt => 
        opt.value.includes('พ่อ') || 
        opt.value.includes('แม่') || 
        opt.value.includes('ครู') || 
        opt.value.includes('อาจารย์') ||
        opt.value.includes('ผู้บังคับบัญชา')
      ).map(opt => ({
        value: opt.value,
        label: opt.value,
        isLeaf: true,
      })),
      ...RSVP_GUEST_RELATION_OPTIONS.filter(opt => 
        opt.value === 'พ่อ/แม่'
      ).map(opt => ({
        value: opt.value,
        label: opt.label,
        isLeaf: true,
      })),
    ];
    
    if (elderOptions.length > 0) {
      options.push({
        value: 'ผู้ใหญ่',
        label: 'ผู้ใหญ่',
        children: elderOptions,
      });
    }
    
    // หมวดหมู่: ครอบครัว (พี่/น้อง, ลูก/หลาน)
    const familyMemberOptions = RSVP_GUEST_RELATION_OPTIONS
      .filter(opt => opt.value === 'พี่/น้อง' || opt.value === 'ลูก/หลาน')
      .map(opt => ({
        value: opt.value,
        label: opt.label,
        isLeaf: true,
      }));
    
    if (familyMemberOptions.length > 0) {
      options.push({
        value: 'ครอบครัว',
        label: 'ครอบครัว',
        children: familyMemberOptions,
      });
    }
    
    // ความสัมพันธ์อื่นๆ (ไม่จัดหมวดหมู่)
    const otherOptions = RSVP_RELATION_OPTIONS
      .filter(opt => 
        !opt.value.includes('เพื่อน') && 
        !opt.value.includes('ญาติ') &&
        !opt.value.includes('พ่อ') &&
        !opt.value.includes('แม่') &&
        !opt.value.includes('ครู') &&
        !opt.value.includes('อาจารย์') &&
        !opt.value.includes('ผู้บังคับบัญชา')
      )
      .map(opt => ({
        value: opt.value,
        label: opt.value,
        isLeaf: true,
      }));
    
    if (otherOptions.length > 0) {
      options.push({
        value: 'อื่นๆ',
        label: 'อื่นๆ',
        children: otherOptions,
      });
    }
    
    return options;
  }, []);

  // แปลง selectedRelations เป็น array ของ relation strings
  const selectedRelationStrings = useMemo(() => {
    const relations: string[] = [];
    selectedRelations.forEach(path => {
      // path จะเป็น array เช่น ['เพื่อน', 'เพื่อนมหาลัย'] หรือ ['ผู้ใหญ่', 'พ่อ/แม่']
      if (path.length > 1) {
        // ใช้ค่าสุดท้าย (ความสัมพันธ์จริง)
        relations.push(path[path.length - 1]);
      } else if (path.length === 1) {
        // ถ้าเลือกแค่หมวดหมู่ ให้ใช้ค่าหมวดหมู่
        relations.push(path[0]);
      }
    });
    return relations;
  }, [selectedRelations]);

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


  // Filter groups and members based on selected relations and side filter
  const filteredGroups = useMemo(() => {
    return guestGroups
      .filter(group => {
        // Filter by side
        if (selectedSide !== 'all') {
          if (selectedSide === 'groom' && group.side !== 'groom') return false;
          if (selectedSide === 'bride' && group.side !== 'bride') return false;
        }

        // Filter unassigned members
        let unassignedMembers = group.members.filter(m => !m.seat);
        
        // Filter by selected relations
        if (selectedRelationStrings.length > 0) {
          unassignedMembers = unassignedMembers.filter(member => {
            const memberRelation = (member.relationToMain || '').toLowerCase();
            return selectedRelationStrings.some(selectedRelation => {
              const selectedLower = selectedRelation.toLowerCase();
              // Match exact หรือ partial
              return memberRelation === selectedLower || 
                     memberRelation.includes(selectedLower) || 
                     selectedLower.includes(memberRelation);
            });
          });
        }
        
        return unassignedMembers.length > 0;
      })
      .map(group => {
        let unassignedMembers = group.members.filter(m => !m.seat);
        
        // Apply relation filter
        if (selectedRelationStrings.length > 0) {
          unassignedMembers = unassignedMembers.filter(member => {
            const memberRelation = (member.relationToMain || '').toLowerCase();
            return selectedRelationStrings.some(selectedRelation => {
              const selectedLower = selectedRelation.toLowerCase();
              return memberRelation === selectedLower || 
                     memberRelation.includes(selectedLower) || 
                     selectedLower.includes(memberRelation);
            });
          });
        }
        
        return {
          ...group,
          unassignedMembers,
        };
      })
      .filter(group => group.unassignedMembers.length > 0);
  }, [guestGroups, selectedSide, selectedRelationStrings]);

  const filteredIndividualGuests = useMemo(() => {
    let unassigned = guests.filter(g => !g.tableId && !g.groupId);
    
    // Filter by side
    if (selectedSide !== 'all') {
      unassigned = unassigned.filter(guest => guest.side === selectedSide);
    }
    
    // Filter by selected relations
    if (selectedRelationStrings.length > 0) {
      unassigned = unassigned.filter(guest => {
        const guestRelation = (guest.relationToCouple || '').toLowerCase();
        return selectedRelationStrings.some(selectedRelation => {
          const selectedLower = selectedRelation.toLowerCase();
          return guestRelation === selectedLower || 
                 guestRelation.includes(selectedLower) || 
                 selectedLower.includes(guestRelation);
        });
      });
    }
    
    return unassigned;
  }, [guests, selectedSide, selectedRelationStrings]);

  return (
    <Card 
      className="w-full md:w-64 flex-shrink-0" 
      title={<span className="text-sm md:text-base">แขกที่ยังไม่ได้จัดที่นั่ง</span>}
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
        
        {/* Cascader for filtering by relation */}
        <Cascader
          multiple
          value={selectedRelations}
          options={relationCascaderOptions}
          onChange={(value) => setSelectedRelations(value as string[][])}
          placeholder="กรองตามความสัมพันธ์"
          style={{ width: '100%', marginBottom: '8px' }}
          maxTagCount={3}
          showSearch={{
            filter: (inputValue, path) => {
              return path.some(option => 
                option.label.toLowerCase().includes(inputValue.toLowerCase())
              );
            },
          }}
          displayRender={(labels) => {
            if (labels.length === 0) {
              return 'กรองตามความสัมพันธ์';
            }
            return labels.join(', ');
          }}
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
      </div>

      {/* กลุ่มแขก (แสดงสมาชิกรายคน) */}
      {filteredGroups.length > 0 && (
        <Collapse
          accordion={false}
          size="small"
          ghost={false}
          className="mb-2"
          style={{ 
            backgroundColor: '#fff',
            border: '1px solid #f0f0f0',
            borderRadius: '6px'
          }}
          items={filteredGroups.map((group) => ({
            key: group.groupId,
            label: (
              <div className="flex items-center justify-between w-full pr-2">
                <span className="font-medium text-sm md:text-base">{group.groupName}</span>
                  <Tag color="blue" className="ml-2">
                    {group.unassignedMembers.length} คน
                  </Tag>
                </div>
            ),
            style: {
              borderBottom: '1px solid #f0f0f0',
            },
            children: (
              <div style={{ padding: '8px 0' }}>
              <List
                size="small"
                dataSource={group.unassignedMembers}
                renderItem={(member: GroupMember) => {
                  const isSelected = selectedGuestId === member.id;
                    const isChecked = selectedGuestIds.includes(member.id);
                  
                  return (
                    <List.Item
                        className={`cursor-pointer hover:bg-blue-50 transition-colors ${isSelected ? 'bg-blue-100 border-blue-300' : ''}`}
                        style={{
                          padding: '8px 12px',
                          marginBottom: '4px',
                          borderRadius: '4px',
                          border: isSelected ? '1px solid #91caff' : '1px solid transparent',
                        }}
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
                                whiteSpace: 'nowrap',
                                fontSize: '13px',
                                fontWeight: 500
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
                                whiteSpace: 'nowrap',
                                fontSize: '12px',
                                color: '#666'
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
              </div>
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
          {selectedRelationStrings.length > 0 || selectedSide !== 'all' 
            ? 'ไม่พบผลการค้นหา' 
            : 'ไม่มีแขกที่ยังไม่ได้จัดที่นั่ง'}
        </div>
      )}
    </Card>
  );
};

export default GuestSelectionSidebar;

