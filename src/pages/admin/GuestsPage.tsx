/**
 * Admin Guests Page
 * รวม Guest List และ Check-in (เรียบง่าย)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Tabs, Input, Table, Tag, Button, Space, App, Modal, Card, Avatar, Checkbox, Row, Col, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined, EditOutlined, DeleteOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons';
import { useGuests } from '@/hooks/useGuests';
import { useZones } from '@/hooks/useZones';
import { useTables } from '@/hooks/useTables';
import { useRSVPs } from '@/hooks/useRSVPs';
import { useGuestGroups } from '@/hooks/useGuestGroups';
import { Guest, Side, RSVPData } from '@/types';
import { GuestService } from '@/services/firebase/GuestService';
import { calculateCheckedInCount } from '@/utils/rsvpHelpers';
import GuestFormDrawer from '@/components/admin/GuestFormDrawer';
import RSVPStatusTag from '@/components/admin/RSVPStatusTag';
import { formatGuestName, getGuestRSVPStatus, renderMemberLabel } from '@/utils/guestHelpers';
import { logger } from '@/utils/logger';

const { Text } = Typography;

// Custom Search component to avoid Input.Search addonAfter warning
const CustomSearch: React.FC<{
  placeholder?: string;
  allowClear?: boolean;
  style?: React.CSSProperties;
  onSearch?: (value: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  prefix?: React.ReactNode;
}> = ({ placeholder, allowClear, style, onSearch, onChange, value, prefix }) => {
  const [searchValue, setSearchValue] = useState(value || '');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    if (onChange) {
      onChange(e);
    }
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchValue);
    }
  };

  const handleClear = () => {
    setSearchValue('');
    if (onSearch) {
      onSearch('');
    }
  };

  useEffect(() => {
    if (value !== undefined) {
      setSearchValue(value);
    }
  }, [value]);

  return (
    <Space.Compact style={style}>
      <Input
        placeholder={placeholder}
        value={searchValue}
        onChange={handleChange}
        onPressEnter={handleSearch}
        prefix={prefix}
        allowClear={allowClear}
        onClear={handleClear}
        style={{ flex: 1 }}
      />
      <Button icon={<SearchOutlined />} onClick={handleSearch} />
    </Space.Compact>
  );
};

const GuestsPage: React.FC = () => {
  const { message } = App.useApp();
  const { guests, isLoading } = useGuests();
  const { zones } = useZones();
  const { tables } = useTables();
  const { rsvps } = useRSVPs(); // Get RSVP data for status integration
  const { guestGroups } = useGuestGroups(); // Get GuestGroup data
  const guestService = GuestService.getInstance();
  
  const [activeTab, setActiveTab] = useState('list');
  const [searchText, setSearchText] = useState('');
  const [checkInSearchText, setCheckInSearchText] = useState('');
  const [selectedSide, setSelectedSide] = useState<Side | 'all'>('all');
  const [checkInSelectedSide, setCheckInSelectedSide] = useState<Side | 'all'>('all');
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [selectedCheckInIds, setSelectedCheckInIds] = useState<string[]>([]);


  // Get all members from groups for check-in
  const allMembersForCheckIn = useMemo(() => {
    const members: Array<{ guest: Guest; group: typeof guestGroups[0] | null; member: typeof guestGroups[0]['members'][0] | null }> = [];
    
    // Add members from groups
    guestGroups.forEach(group => {
      group.members.forEach(member => {
        const guest = guests.find(g => g.id === member.id);
        if (guest && !guest.checkedInAt) {
          members.push({ guest, group, member });
        }
      });
    });
    
    // Add individual guests (not in groups)
    guests.forEach(guest => {
      if (!guest.checkedInAt && !guest.groupId) {
        members.push({ guest, group: null, member: null });
      }
    });
    
    return members;
  }, [guests, guestGroups]);

  // Filter members for check-in tab
  const filteredCheckInMembers = useMemo(() => {
    return allMembersForCheckIn.filter(({ guest, group }) => {
      const matchesSearch = !checkInSearchText || 
        formatGuestName(guest).toLowerCase().includes(checkInSearchText.toLowerCase()) ||
        (group && group.groupName.toLowerCase().includes(checkInSearchText.toLowerCase()));
      const matchesSide = checkInSelectedSide === 'all' || guest.side === checkInSelectedSide;
      return matchesSearch && matchesSide;
    });
  }, [allMembersForCheckIn, checkInSearchText, checkInSelectedSide]);

  // Check-in stats
  const totalCheckedIn = useMemo(() => calculateCheckedInCount(guests), [guests]);

  // RSVP Map for status lookup
  const rsvpMap = useMemo(() => {
    const map = new Map<string, RSVPData>();
    rsvps.forEach(r => {
      if (r.uid) map.set(r.uid, r);
      if (r.id) map.set(r.id, r);
    });
    return map;
  }, [rsvps]);

  // Handle group check-in
  const handleGroupCheckIn = async (parentGuest: Guest & { children?: Guest[] }) => {
    // ค้นหากลุ่มจากหลายวิธี:
    // 1. จาก groupId (ถ้ามี)
    // 2. จาก rsvpUid หรือ rsvpId
    // 3. จาก guest id ที่ตรงกับ member ในกลุ่ม
    let group = null;
    
    if (parentGuest.groupId) {
      group = guestGroups.find(g => g.groupId === parentGuest.groupId);
    }
    
    // ถ้ายังไม่เจอ ให้ค้นหาจาก rsvpUid หรือ rsvpId
    if (!group && (parentGuest.rsvpUid || parentGuest.rsvpId)) {
      const rsvpId = parentGuest.rsvpUid || parentGuest.rsvpId;
      group = guestGroups.find(g => g.groupId === rsvpId);
    }
    
    // ถ้ายังไม่เจอ ให้ค้นหาจาก guest id ที่ตรงกับ member ในกลุ่ม
    if (!group) {
      group = guestGroups.find(g => g.members.some(m => m.id === parentGuest.id));
    }
    
    if (!group) {
      message.warning('ไม่พบข้อมูลกลุ่ม');
      logger.warn('Group not found:', { 
        guestId: parentGuest.id,
        groupId: parentGuest.groupId,
        rsvpUid: parentGuest.rsvpUid,
        rsvpId: parentGuest.rsvpId,
        availableGroups: guestGroups.map(g => ({ groupId: g.groupId, groupName: g.groupName }))
      });
      return;
    }

    // ตรวจสอบจำนวนสมาชิกจาก members array โดยตรง
    const memberCount = group.members ? group.members.length : 0;
    const totalCount = group.totalCount || 0;
    // ใช้ค่าที่มากกว่าเพื่อความปลอดภัย
    const actualCount = Math.max(memberCount, totalCount);
    
    // Debug log
    logger.info('Group check-in:', {
      groupId: group.groupId,
      groupName: group.groupName,
      memberCount,
      totalCount,
      actualCount,
      members: group.members?.map(m => ({ id: m.id, name: m.fullName }))
    });

    if (actualCount <= 1) {
      message.warning(`กลุ่มนี้มีสมาชิกเพียงคนเดียว (พบ ${actualCount} คน)`);
      return;
    }

    // ตรวจสอบว่าสมาชิกทั้งหมดเช็คอินแล้วหรือยัง
    const checkedInMembers = group.members.filter(m => {
      const memberGuest = guests.find(g => g.id === m.id);
      return memberGuest && memberGuest.checkedInAt;
    });
    const allCheckedIn = checkedInMembers.length === group.members.length;
    const isUncheckIn = allCheckedIn; // ถ้าทุกคนเช็คอินแล้ว = ต้องการยกเลิกเช็คอิน

    try {
      let successCount = 0;
      let failCount = 0;

      if (isUncheckIn) {
        // ยกเลิกเช็คอินทั้งกลุ่ม
        for (const member of group.members) {
          const memberGuest = guests.find(g => g.id === member.id);
          if (!memberGuest) continue;

          // ยกเลิกเช็คอินเฉพาะคนที่เช็คอินแล้ว
          if (memberGuest.checkedInAt) {
            await guestService.update(memberGuest.id, {
              checkedInAt: null,
              checkInMethod: null,
            });
            successCount++;
          }
        }

        if (successCount > 0) {
          message.success(`ยกเลิกเช็คอินทั้งกลุ่มสำเร็จ (${successCount} คน)`);
        } else {
          message.info('ไม่มีสมาชิกที่เช็คอินอยู่');
        }
      } else {
        // เช็คอินทั้งกลุ่ม
        const now = new Date().toISOString();
        for (const member of group.members) {
          const memberGuest = guests.find(g => g.id === member.id);
          if (!memberGuest) continue;

          const rsvpStatus = getGuestRSVPStatus(memberGuest, rsvpMap);
          if (rsvpStatus === 'no') {
            failCount++;
            continue;
          }

          // เช็คอินเฉพาะคนที่ยังไม่เช็คอิน
          if (!memberGuest.checkedInAt) {
            await guestService.update(memberGuest.id, {
              checkedInAt: now,
              checkInMethod: 'manual',
            });
            successCount++;
          }
        }

        if (successCount > 0) {
          message.success(`เช็คอินทั้งกลุ่มสำเร็จ (${successCount} คน${failCount > 0 ? `, ${failCount} คนไม่สามารถเช็คอินได้` : ''})`);
        } else if (failCount > 0) {
          message.warning(`ไม่มีสมาชิกที่สามารถเช็คอินได้ (${failCount} คนไม่ตอบรับเข้าร่วมงาน)`);
        } else {
          message.info('สมาชิกทุกคนในกลุ่มเช็คอินแล้ว');
        }
      }
    } catch (error) {
      logger.error(`Error ${isUncheckIn ? 'unchecking in' : 'checking in'} group:`, error);
      message.error(`เกิดข้อผิดพลาดในการ${isUncheckIn ? 'ยกเลิกเช็คอิน' : 'เช็คอิน'}ทั้งกลุ่ม`);
    }
  };

  // Handle check-in
  const handleCheckIn = async (guest: Guest) => {
    // Check RSVP status - disable check-in if isComing === 'no'
    const rsvpStatus = getGuestRSVPStatus(guest, rsvpMap);
    if (rsvpStatus === 'no') {
      message.warning('แขกคนนี้ไม่ได้ตอบรับเข้าร่วมงาน ไม่สามารถเช็คอินได้');
      return;
    }

    try {
      const now = new Date().toISOString();
      const isCheckingIn = !guest.checkedInAt;
      
      // เช็คอิน/ยกเลิกเช็คอินแขกหลัก
      await guestService.update(guest.id, {
        checkedInAt: isCheckingIn ? now : null,
        checkInMethod: isCheckingIn ? 'manual' : null,
      });

      // ถ้ากำลังเช็คอิน และแขกอยู่ในกลุ่ม → เช็คอินสมาชิกอื่นในกลุ่มด้วย
      if (isCheckingIn && guest.groupId) {
        const group = guestGroups.find(g => g.groupId === guest.groupId);
        if (group && group.totalCount > 1) {
          // หาสมาชิกอื่นในกลุ่มที่ยังไม่เช็คอิน
          const otherMembers = group.members
            .filter(m => m.id !== guest.id && !m.checkedInAt)
            .map(m => guests.find(g => g.id === m.id))
            .filter((g): g is Guest => g !== undefined);

          // เช็คอินสมาชิกอื่นในกลุ่ม
          let checkedInCount = 0;
          for (const memberGuest of otherMembers) {
            const memberRsvpStatus = getGuestRSVPStatus(memberGuest, rsvpMap);
            // เช็คอินเฉพาะคนที่ตอบรับเข้างาน
            if (memberRsvpStatus !== 'no') {
              await guestService.update(memberGuest.id, {
                checkedInAt: now,
                checkInMethod: 'manual',
              });
              checkedInCount++;
            }
          }

          if (checkedInCount > 0) {
            message.success(`เช็คอินสำเร็จ (รวมผู้ติดตาม ${checkedInCount} คน)`);
          } else {
            message.success('เช็คอินสำเร็จ');
          }
        } else {
          message.success('เช็คอินสำเร็จ');
        }
      } else {
        message.success(guest.checkedInAt ? 'ยกเลิกเช็คอินแล้ว' : 'เช็คอินสำเร็จ');
      }
    } catch (error) {
      logger.error('Error checking in:', error);
      message.error('เกิดข้อผิดพลาด');
    }
  };

  // Handle bulk check-in
  const handleBulkCheckIn = async () => {
    if (selectedCheckInIds.length === 0) {
      message.warning('กรุณาเลือกแขกที่ต้องการเช็คอิน');
      return;
    }

    try {
      const now = new Date().toISOString();
      let successCount = 0;
      let failCount = 0;
      const processedGroupIds = new Set<string>();

      for (const guestId of selectedCheckInIds) {
        const guest = guests.find(g => g.id === guestId);
        if (!guest) continue;

        const rsvpStatus = getGuestRSVPStatus(guest, rsvpMap);
        if (rsvpStatus === 'no') {
          failCount++;
          continue;
        }

        // เช็คอินแขกหลัก
        await guestService.update(guestId, {
          checkedInAt: now,
          checkInMethod: 'manual',
        });
        successCount++;

        // ถ้าแขกอยู่ในกลุ่ม → เช็คอินสมาชิกอื่นในกลุ่มด้วย (เช็คอินครั้งเดียวต่อกลุ่ม)
        if (guest.groupId && !processedGroupIds.has(guest.groupId)) {
          const group = guestGroups.find(g => g.groupId === guest.groupId);
          if (group && group.totalCount > 1) {
            // หาสมาชิกอื่นในกลุ่มที่ยังไม่เช็คอิน
            const otherMembers = group.members
              .filter(m => !selectedCheckInIds.includes(m.id) && !m.checkedInAt)
              .map(m => guests.find(g => g.id === m.id))
              .filter((g): g is Guest => g !== undefined);

            // เช็คอินสมาชิกอื่นในกลุ่ม
            for (const memberGuest of otherMembers) {
              const memberRsvpStatus = getGuestRSVPStatus(memberGuest, rsvpMap);
              if (memberRsvpStatus !== 'no') {
                await guestService.update(memberGuest.id, {
                  checkedInAt: now,
                  checkInMethod: 'manual',
                });
                successCount++;
              } else {
                failCount++;
              }
            }

            processedGroupIds.add(guest.groupId);
          }
        }
      }

      if (successCount > 0) {
        message.success(`เช็คอิน ${successCount} คนสำเร็จ${failCount > 0 ? ` (${failCount} คนไม่สามารถเช็คอินได้)` : ''}`);
      } else {
        message.warning('ไม่มีแขกที่สามารถเช็คอินได้');
      }
      setSelectedCheckInIds([]);
    } catch (error) {
      logger.error('Error bulk checking in:', error);
      message.error('เกิดข้อผิดพลาดในการเช็คอิน');
    }
  };

  // Handle form submit
  const handleFormSubmit = async (guest: Guest) => {
    try {
      if (editingGuest) {
        await guestService.update(guest.id, guest);
        message.success('อัพเดทข้อมูลแขกเรียบร้อย');
      } else {
        await guestService.create(guest);
        message.success('เพิ่มแขกเรียบร้อย');
      }
      setIsDrawerVisible(false);
      setEditingGuest(null);
    } catch (error) {
      logger.error('Error saving guest:', error);
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'ยืนยันการลบ',
      content: 'คุณต้องการลบแขกคนนี้หรือไม่?',
      onOk: async () => {
        try {
          await guestService.delete(id);
          message.success('ลบแขกเรียบร้อย');
        } catch (error) {
          logger.error('Error deleting guest:', error);
          message.error('เกิดข้อผิดพลาดในการลบข้อมูล');
        }
      },
    });
  };


  // Prepare tree data structure for table
  const treeData = useMemo(() => {
    const data: Array<Guest & { children?: Guest[] }> = [];
    const processedGroupIds = new Set<string>();
    const processedGuestIds = new Set<string>();
    
    // Add groups with children (sorted by group name)
    const sortedGroups = [...guestGroups].sort((a, b) => 
      a.groupName.localeCompare(b.groupName)
    );
    
    sortedGroups.forEach(group => {
      if (group.totalCount > 1 && !processedGroupIds.has(group.groupId)) {
        const groupGuests = group.members
          .map(member => guests.find(g => g.id === member.id))
          .filter((g): g is Guest => g !== undefined);
        
        if (groupGuests.length > 0) {
          const parentGuest = groupGuests[0]; // First member as parent
          const childrenGuests = groupGuests.slice(1); // Rest as children
          
          // Only add as tree node if there are children
          if (childrenGuests.length > 0) {
            data.push({
              ...parentGuest,
              children: childrenGuests,
            });
          } else {
            // Single member group - add as regular row
            data.push(parentGuest);
          }
          
          // Mark all guests in this group as processed
          groupGuests.forEach(g => processedGuestIds.add(g.id));
          processedGroupIds.add(group.groupId);
        }
      }
    });
    
    // Add individual guests (not in groups or groups with 1 member)
    guests.forEach(guest => {
      if (!processedGuestIds.has(guest.id)) {
        const group = guestGroups.find(g => g.groupId === guest.groupId);
        if (!group || group.totalCount <= 1) {
          data.push(guest);
          processedGuestIds.add(guest.id);
        }
      }
    });
    
    return data;
  }, [guests, guestGroups]);

  // Filter tree data based on search and side
  const filteredTreeData = useMemo(() => {
    return treeData.filter(item => {
      // Check parent
      const parentMatchesSearch = !searchText || 
        formatGuestName(item).toLowerCase().includes(searchText.toLowerCase());
      const parentMatchesSide = selectedSide === 'all' || item.side === selectedSide;
      
      // Check children
      const childrenMatchSearch = item.children?.some(child => 
        formatGuestName(child).toLowerCase().includes(searchText.toLowerCase())
      );
      const childrenMatchSide = item.children?.some(child => 
        selectedSide === 'all' || child.side === selectedSide
      );
      
      return (parentMatchesSearch || childrenMatchSearch) && (parentMatchesSide || childrenMatchSide);
    }).map(item => {
      // Filter children if needed
      if (item.children && (searchText || selectedSide !== 'all')) {
        const filteredChildren = item.children.filter(child => {
          const matchesSearch = !searchText || 
            formatGuestName(child).toLowerCase().includes(searchText.toLowerCase());
          const matchesSide = selectedSide === 'all' || child.side === selectedSide;
          return matchesSearch && matchesSide;
        });
        
        // If no children match, return parent without children (or exclude if parent doesn't match)
        if (filteredChildren.length === 0) {
          // Only show parent if it matches
          const parentMatches = (!searchText || 
            formatGuestName(item).toLowerCase().includes(searchText.toLowerCase())) &&
            (selectedSide === 'all' || item.side === selectedSide);
          
          if (parentMatches) {
            // Return parent without children
            const { children, ...parentWithoutChildren } = item;
            return parentWithoutChildren;
          }
          return null; // Exclude this item
        }
        
        return {
          ...item,
          children: filteredChildren,
        };
      }
      return item;
    }).filter((item): item is Guest & { children?: Guest[] } => item !== null);
  }, [treeData, searchText, selectedSide]);

  // Table columns
  const columns: ColumnsType<Guest & { children?: Guest[] }> = [
    {
      title: 'ลำดับ',
      key: 'order',
      width: 80,
      align: 'center',
      render: (_, record) => {
        // Check if this is a parent row (has children)
        const isParent = record.children && record.children.length > 0;
        
        if (isParent) {
          // Parent row - show group number
          const parentIndex = filteredTreeData.findIndex(item => item.id === record.id);
          return <Text strong>{parentIndex + 1}</Text>;
        } else {
          // Child row or standalone row - find parent
          const parent = filteredTreeData.find(item => 
            item.children && item.children.some(child => child.id === record.id)
          );
          
          if (parent) {
            // This is a child row
            const parentIndex = filteredTreeData.findIndex(item => item.id === parent.id);
            const childIndex = parent.children!.findIndex(child => child.id === record.id);
            return <Text type="secondary">{parentIndex + 1}.{childIndex + 1}</Text>;
          } else {
            // Standalone row (not in a group)
            const standaloneIndex = filteredTreeData.findIndex(item => 
              !item.children && item.id === record.id
            );
            return <Text>{standaloneIndex + 1}</Text>;
          }
        }
      },
    },
    {
      title: 'ชื่อ-นามสกุล',
      key: 'name',
      render: (_, guest) => {
        const group = guestGroups.find(g => g.groupId === guest.groupId);
        const member = group?.members.find(m => m.id === guest.id);
        
        if (group && member) {
          return (
            <div>
              <div>{renderMemberLabel(group, member)}</div>
              {group.totalCount > 1 && (
                <Text type="secondary" className="text-xs">
                  {group.groupName} ({group.totalCount} คน)
                </Text>
              )}
            </div>
          );
        }
        
        return <div>{formatGuestName(guest)}</div>;
      },
    },
    {
      title: 'ฝ่าย',
      dataIndex: 'side',
      render: (side: Side) => {
        switch (side) {
          case 'groom': return <Tag color="blue">เจ้าบ่าว</Tag>;
          case 'bride': return <Tag color="magenta">เจ้าสาว</Tag>;
          case 'both': return <Tag color="purple">ทั้งคู่</Tag>;
          default: return <Tag>ไม่ระบุ</Tag>;
        }
      },
    },
    {
      title: 'สถานะตอบรับ',
      key: 'rsvpStatus',
      render: (_, guest) => {
        return <RSVPStatusTag guest={guest} rsvpMap={rsvpMap} />;
      },
    },
    {
      title: 'โต๊ะ',
      key: 'table',
      render: (_, guest) => {
        const table = tables.find(t => t.id === guest.tableId);
        const zone = zones.find(z => z.id === guest.zoneId);
        if (table && zone) {
          return `${zone.zoneName} - ${table.tableName}`;
        }
        return '-';
      },
    },
    {
      title: 'เช็คอิน',
      dataIndex: 'checkedInAt',
      render: (checkedInAt: string | null) => {
        return checkedInAt ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>เช็คอินแล้ว</Tag>
        ) : (
          <Tag>ยังไม่เช็คอิน</Tag>
        );
      },
    },
    {
      title: 'จัดการ',
      key: 'actions',
      render: (_, record) => {
        const guest = record as Guest;
        const rsvpStatus = getGuestRSVPStatus(guest, rsvpMap);
        const canCheckIn = rsvpStatus !== 'no';
        const isParent = record.children && record.children.length > 0;
        
        // ค้นหากลุ่มจากหลายวิธี
        let group = null;
        if (guest.groupId) {
          group = guestGroups.find(g => g.groupId === guest.groupId);
        }
        if (!group && (guest.rsvpUid || guest.rsvpId)) {
          const rsvpId = guest.rsvpUid || guest.rsvpId;
          group = guestGroups.find(g => g.groupId === rsvpId);
        }
        if (!group) {
          group = guestGroups.find(g => g.members.some(m => m.id === guest.id));
        }
        
        const hasMultipleMembers = group && group.members && group.members.length > 1;
        const isGroupOwner = group && group.members.find(m => m.id === guest.id)?.isOwner;
        
        // ตรวจสอบว่าสมาชิกทั้งหมดเช็คอินแล้วหรือยัง
        const allCheckedIn = group && group.members ? 
          group.members.every(m => {
            const memberGuest = guests.find(g => g.id === m.id);
            return memberGuest && memberGuest.checkedInAt;
          }) : false;
        
        return (
          <Space wrap>
            {/* แสดงปุ่มเช็คอิน/ยกเลิกเช็คอินยกกลุ่มสำหรับ parent row หรือ group owner */}
            {(isParent || (isGroupOwner && hasMultipleMembers)) && (
              <Button
                type={allCheckedIn ? "default" : "primary"}
                icon={<CheckCircleOutlined />}
                onClick={() => handleGroupCheckIn(record)}
                size="small"
                danger={allCheckedIn}
              >
                {allCheckedIn ? 'ยกเลิกเช็คอินยกกลุ่ม' : 'เช็คอินยกกลุ่ม'}
              </Button>
            )}
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={() => handleCheckIn(guest)}
              disabled={!canCheckIn && !guest.checkedInAt}
            >
              {guest.checkedInAt ? 'ยกเลิกเช็คอิน' : 'เช็คอิน'}
            </Button>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingGuest(guest);
                setIsDrawerVisible(true);
              }}
            >
              แก้ไข
            </Button>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(guest.id)}
            >
              ลบ
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">จัดการแขก</h1>
        <Button
          type="primary"
          onClick={() => {
            setEditingGuest(null);
            setIsDrawerVisible(true);
          }}
        >
          เพิ่มแขก
        </Button>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'list',
            label: 'รายชื่อแขก',
            children: (
              <>
                <div className="mb-4">
                  <Space>
                    <CustomSearch
                      placeholder="ค้นหาแขก"
                      allowClear
                      style={{ width: 300 }}
                      onSearch={setSearchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                    <Button
                      onClick={() => setSelectedSide('all')}
                      type={selectedSide === 'all' ? 'primary' : 'default'}
                    >
                      ทั้งหมด
                    </Button>
                    <Button
                      onClick={() => setSelectedSide('groom')}
                      type={selectedSide === 'groom' ? 'primary' : 'default'}
                    >
                      เจ้าบ่าว
                    </Button>
                    <Button
                      onClick={() => setSelectedSide('bride')}
                      type={selectedSide === 'bride' ? 'primary' : 'default'}
                    >
                      เจ้าสาว
                    </Button>
                  </Space>
                </div>
                
                <Table<Guest & { children?: Guest[] }>
                  columns={columns}
                  dataSource={filteredTreeData}
                  rowKey="id"
                  loading={isLoading}
                  pagination={{ pageSize: 20 }}
                  expandable={{
                    defaultExpandAllRows: false,
                    indentSize: 20,
                    showExpandColumn: true,
                  }}
                />
              </>
            ),
          },
          {
            key: 'checkin',
            label: (
              <Space>
                <span>เช็คอิน</span>
                <Tag color={totalCheckedIn === guests.length ? 'success' : 'processing'}>
                  {totalCheckedIn}/{guests.length}
                </Tag>
              </Space>
            ),
            children: (
              <>
          <div className="mb-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <CustomSearch
                  placeholder="ค้นหาชื่อ/กลุ่ม"
                  allowClear
                  prefix={<SearchOutlined />}
                  value={checkInSearchText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckInSearchText(e.target.value)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} sm={12} md={16}>
                <Space.Compact>
                  <Button
                    onClick={() => setCheckInSelectedSide('all')}
                    type={checkInSelectedSide === 'all' ? 'primary' : 'default'}
                  >
                    ทั้งหมด
                  </Button>
                  <Button
                    onClick={() => setCheckInSelectedSide('groom')}
                    type={checkInSelectedSide === 'groom' ? 'primary' : 'default'}
                  >
                    เจ้าบ่าว
                  </Button>
                  <Button
                    onClick={() => setCheckInSelectedSide('bride')}
                    type={checkInSelectedSide === 'bride' ? 'primary' : 'default'}
                  >
                    เจ้าสาว
                  </Button>
                </Space.Compact>
              </Col>
            </Row>
          </div>

          {selectedCheckInIds.length > 0 && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 shadow-md">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircleOutlined className="text-blue-600 text-xl" />
                  <Text strong className="text-lg text-blue-900">
                    เลือก {selectedCheckInIds.length} คน
                  </Text>
                </div>
                <Space size="middle">
                  <Button 
                    onClick={() => setSelectedCheckInIds([])}
                    size="large"
                  >
                    ยกเลิก
                  </Button>
                  <Button 
                    type="primary" 
                    onClick={handleBulkCheckIn} 
                    size="large"
                    icon={<CheckCircleOutlined />}
                    style={{
                      height: '44px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      paddingLeft: '24px',
                      paddingRight: '24px'
                    }}
                  >
                    เช็คอิน {selectedCheckInIds.length} คน
                  </Button>
                </Space>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCheckInMembers.map(({ guest, group, member }) => {
              const rsvpStatus = getGuestRSVPStatus(guest, rsvpMap);
              const canCheckIn = rsvpStatus !== 'no';
              const isSelected = selectedCheckInIds.includes(guest.id);
              
              const displayName = group && member 
                ? renderMemberLabel(group, member)
                : formatGuestName(guest);

              return (
                <Card
                  key={guest.id}
                  size="small"
                  className={`transition-all ${isSelected ? 'border-blue-500 border-2 shadow-lg' : 'hover:shadow-md'}`}
                  styles={{
                    body: { padding: '16px' }
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Checkbox
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCheckInIds([...selectedCheckInIds, guest.id]);
                        } else {
                          setSelectedCheckInIds(selectedCheckInIds.filter(id => id !== guest.id));
                        }
                      }}
                      disabled={!canCheckIn}
                    />
                    <Avatar 
                      size={48}
                      icon={<UserOutlined />}
                      style={{ 
                        backgroundColor: guest.side === 'groom' ? '#1890ff' : '#eb2f96',
                        flexShrink: 0
                      }}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base mb-1 truncate" title={displayName}>
                        {displayName}
                      </div>
                      {group && (
                        <Tag color="blue" className="mb-1">
                          {group.groupName}
                        </Tag>
                      )}
                      <div className="flex flex-wrap gap-1 mb-2">
                        <Tag color={guest.side === 'groom' ? 'blue' : 'magenta'}>
                          {guest.side === 'groom' ? 'เจ้าบ่าว' : guest.side === 'bride' ? 'เจ้าสาว' : 'ทั้งคู่'}
                        </Tag>
                        <RSVPStatusTag guest={guest} rsvpMap={rsvpMap} />
                      </div>
                      {member && member.relationToMain && (
                        <Text type="secondary" className="text-xs block">
                          {member.relationToMain}
                        </Text>
                      )}
                      {!canCheckIn && (
                        <Tag color="red" className="mt-1">
                          ไม่ตอบรับเข้าร่วมงาน
                        </Tag>
                      )}
                    </div>
                  </div>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleCheckIn(guest)}
                    disabled={!canCheckIn}
                    block
                    size="large"
                    className="mt-2"
                    style={{
                      height: '40px',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    เช็คอิน
                  </Button>
                </Card>
              );
            })}
          </div>

          {filteredCheckInMembers.length === 0 && (
            <div className="text-center py-12">
              <Text type="secondary">
                {checkInSearchText || checkInSelectedSide !== 'all' 
                  ? 'ไม่พบแขกที่ยังไม่เช็คอิน' 
                  : 'ไม่มีแขกที่ยังไม่เช็คอิน'}
              </Text>
            </div>
          )}
              </>
            ),
          },
        ]}
      />

      <GuestFormDrawer
        visible={isDrawerVisible}
        onClose={() => {
          setIsDrawerVisible(false);
          setEditingGuest(null);
        }}
        guestToEdit={editingGuest}
        onSubmit={handleFormSubmit}
      />

    </div>
  );
};

export default GuestsPage;

