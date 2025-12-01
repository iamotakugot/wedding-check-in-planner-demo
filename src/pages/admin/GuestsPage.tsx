import React, { useState, useEffect, useMemo } from 'react';
import { App, Typography, Grid, Space, Input, Button, Tag, Avatar, Tooltip, Card, Modal, Table } from 'antd';
import { SearchOutlined, PhoneOutlined, ManOutlined, WomanOutlined, CheckCircleOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useGuests } from '@/hooks/useGuests';
import { useZones } from '@/hooks/useZones';
import { useTables } from '@/hooks/useTables';
import { useRSVPs } from '@/hooks/useRSVPs';
import { useGuestGroups } from '@/hooks/useGuestGroups';
import { Guest, Side, RSVPData } from '@/types';
import { GuestService } from '@/services/firebase/GuestService';

import GuestFormDrawer from '@/components/admin/GuestFormDrawer';
import RSVPStatusTag from '@/components/admin/RSVPStatusTag';
import GroupMemberTooltip from '@/components/admin/GroupMemberTooltip';
import { formatGuestName, getGuestRSVPStatus, renderMemberLabel } from '@/utils/guestHelpers';
import { logger } from '@/utils/logger';

const { Text } = Typography;
const { useBreakpoint } = Grid;

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
  const screens = useBreakpoint();

  const [searchText, setSearchText] = useState('');
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);



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
      return;
    }

    // ตรวจสอบจำนวนสมาชิกจาก members array โดยตรง
    const memberCount = group.members ? group.members.length : 0;
    const totalCount = group.totalCount || 0;
    // ใช้ค่าที่มากกว่าเพื่อความปลอดภัย
    const actualCount = Math.max(memberCount, totalCount);


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
        // ตรวจสอบว่า guest อยู่ใน group หรือไม่ (หลายวิธี)
        let group = null;

        // วิธีที่ 1: หาจาก groupId
        if (guest.groupId) {
          group = guestGroups.find(g => g.groupId === guest.groupId);
        }

        // วิธีที่ 2: หาจาก rsvpUid (เพราะ groupId อาจเป็น rsvp.uid)
        if (!group && guest.rsvpUid) {
          group = guestGroups.find(g => g.groupId === guest.rsvpUid);
        }

        // วิธีที่ 3: หาจาก rsvpId
        if (!group && guest.rsvpId) {
          group = guestGroups.find(g => g.groupId === guest.rsvpId);
        }

        // วิธีที่ 4: หาจาก guest id ที่อยู่ใน members
        if (!group) {
          group = guestGroups.find(g => g.members.some(m => m.id === guest.id));
        }

        // ถ้ามี group → ตรวจสอบว่า guest อยู่ใน members หรือไม่
        if (group) {
          const isInGroupMembers = group.members.some(m => m.id === guest.id);
          // ถ้า guest มี groupId/rsvpUid แต่ไม่อยู่ใน members → เป็น guest ที่ซ้ำ ไม่ควรแสดง
          if (!isInGroupMembers) {
            processedGuestIds.add(guest.id); // Mark as processed แต่ไม่เพิ่มเข้า data
            return; // ข้าม guest นี้
          }
        }

        // ตรวจสอบว่า guest มีชื่อซ้ำกับ main guest ใน group อื่นหรือไม่
        const guestFullName = `${guest.firstName} ${guest.lastName}`.trim().toLowerCase();
        const isDuplicateMainGuest = guestGroups.some(g => {
          if (g.members.length === 0) return false;
          const mainGuest = g.members[0]; // Main guest is always first
          const mainGuestFullName = `${mainGuest.firstName} ${mainGuest.lastName}`.trim().toLowerCase();
          // ถ้าชื่อซ้ำกับ main guest ใน group อื่น และ guest นี้ไม่อยู่ใน group นั้น
          if (guestFullName === mainGuestFullName && mainGuestFullName !== '') {
            const isInThisGroup = g.members.some(m => m.id === guest.id);
            return !isInThisGroup; // ถ้าไม่อยู่ใน group นี้ → เป็น duplicate
          }
          return false;
        });

        // ถ้าเป็น duplicate main guest → ไม่ควรแสดง
        if (isDuplicateMainGuest) {
          processedGuestIds.add(guest.id);
          return; // ข้าม guest นี้
        }

        // เพิ่มเฉพาะ guest ที่ไม่มี group หรือ group มี 1 member หรือ guest อยู่ใน members
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
        formatGuestName(item).toLowerCase().includes(searchText.toLowerCase()) ||
        (item.phoneNumber && item.phoneNumber.includes(searchText));

      // Check children
      const childrenMatchSearch = item.children?.some(child =>
        formatGuestName(child).toLowerCase().includes(searchText.toLowerCase()) ||
        (child.phoneNumber && child.phoneNumber.includes(searchText))
      );

      return (parentMatchesSearch || childrenMatchSearch);
    }).map(item => {
      // Filter children if needed
      if (item.children && searchText) {
        const filteredChildren = item.children.filter(child => {
          const matchesSearch = !searchText ||
            formatGuestName(child).toLowerCase().includes(searchText.toLowerCase()) ||
            (child.phoneNumber && child.phoneNumber.includes(searchText));
          return matchesSearch;
        });

        // If no children match, return parent without children (or exclude if parent doesn't match)
        if (filteredChildren.length === 0) {
          // Only show parent if it matches
          const parentMatches = (!searchText ||
            formatGuestName(item).toLowerCase().includes(searchText.toLowerCase()) ||
            (item.phoneNumber && item.phoneNumber.includes(searchText)));

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
  }, [treeData, searchText]);

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
      width: 200,
      fixed: 'left' as const,
      render: (_, guest) => {
        const group = guestGroups.find(g => g.groupId === guest.groupId);
        const member = group?.members.find(m => m.id === guest.id);

        if (group && member) {
          const memberLabel = renderMemberLabel(group, member);
          const isFullyCheckedIn = group.checkedInCount === group.totalCount;

          return (
            <div className="min-w-0">
              <div className="truncate font-medium" title={memberLabel}>
                {memberLabel}
              </div>
              {group.totalCount > 1 && (
                <GroupMemberTooltip group={group}>
                  <Text
                    type={isFullyCheckedIn ? "success" : "secondary"}
                    className="text-xs truncate block cursor-help"
                  >
                    {group.groupName} ({group.checkedInCount}/{group.totalCount} คน)
                  </Text>
                </GroupMemberTooltip>
              )}
            </div>
          );
        }

        const guestName = formatGuestName(guest);
        return (
          <div className="min-w-0 truncate font-medium" title={guestName}>
            {guestName}
          </div>
        );
      },
    },
    {
      title: 'เบอร์โทรศัพท์',
      key: 'phoneNumber',
      width: 150,
      render: (_, guest) => {
        // Try to get phone number from guest first, then fallback to RSVP
        let phoneNumber = guest.phoneNumber;
        if (!phoneNumber && (guest.rsvpUid || guest.rsvpId)) {
          const rsvp = rsvpMap.get(guest.rsvpUid || guest.rsvpId || '');
          phoneNumber = rsvp?.phoneNumber;
        }

        if (!phoneNumber) return <Text type="secondary">-</Text>;

        return (
          <Space>
            <PhoneOutlined className="text-gray-400" />
            <Text copyable>{phoneNumber}</Text>
            <Tooltip title="โทรออก">
              <Button
                type="link"
                size="small"
                icon={<PhoneOutlined />}
                href={`tel:${phoneNumber}`}
                className="text-green-600 hover:text-green-700"
              />
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: 'ฝ่าย',
      dataIndex: 'side',
      width: 100,
      render: (side: Side) => {
        switch (side) {
          case 'groom': return <Tag icon={<ManOutlined />} color="blue">เจ้าบ่าว</Tag>;
          case 'bride': return <Tag icon={<WomanOutlined />} color="magenta">เจ้าสาว</Tag>;
          case 'both': return <Tag color="purple">ทั้งคู่</Tag>;
          default: return <Tag>ไม่ระบุ</Tag>;
        }
      },
    },
    {
      title: 'สถานะตอบรับ',
      key: 'rsvpStatus',
      width: 120,
      render: (_, guest) => {
        return <RSVPStatusTag guest={guest} rsvpMap={rsvpMap} />;
      },
    },
    {
      title: 'โต๊ะ',
      key: 'table',
      width: 150,
      render: (_, guest) => {
        const table = tables.find(t => t.id === guest.tableId);
        const zone = zones.find(z => z.id === guest.zoneId);
        if (table && zone) {
          const tableInfo = `${zone.zoneName} - ${table.tableName}`;
          return (
            <span className="truncate block" title={tableInfo}>
              {tableInfo}
            </span>
          );
        }
        return '-';
      },
    },
    {
      title: 'เช็คอิน',
      key: 'checkedIn',
      width: 180,
      render: (_, guest) => {
        const checkedInAt = guest.checkedInAt;
        if (!checkedInAt) {
          return <Tag>ยังไม่เช็คอิน</Tag>;
        }

        try {
          const date = new Date(checkedInAt);
          const formattedTime = date.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
          });
          const formattedDate = date.toLocaleDateString('th-TH', {
            day: '2-digit',
            month: '2-digit',
          });
          return (
            <div>
              <Tag color="green" icon={<CheckCircleOutlined />} className="mb-1">
                เช็คอินแล้ว
              </Tag>
              <div className="text-xs text-gray-600" title={date.toLocaleString('th-TH')}>
                {formattedDate} {formattedTime}
              </div>
            </div>
          );
        } catch (error) {
          return (
            <Tag color="green" icon={<CheckCircleOutlined />}>
              เช็คอินแล้ว
            </Tag>
          );
        }
      },
    },
    {
      title: 'จัดการ',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
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
              <Tooltip title={allCheckedIn ? 'ยกเลิกเช็คอินยกกลุ่ม' : 'เช็คอินยกกลุ่ม'}>
                <Button
                  type={allCheckedIn ? "default" : "primary"}
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleGroupCheckIn(record)}
                  size="small"
                  danger={allCheckedIn}
                />
              </Tooltip>
            )}
            <Tooltip title={guest.checkedInAt ? 'ยกเลิกเช็คอิน' : 'เช็คอิน'}>
              <Button
                type="link"
                icon={<CheckCircleOutlined />}
                onClick={() => handleCheckIn(guest)}
                disabled={!canCheckIn && !guest.checkedInAt}
                className={guest.checkedInAt ? 'text-red-500' : 'text-green-500'}
              />
            </Tooltip>
            <Tooltip title="แก้ไข">
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingGuest(guest);
                  setIsDrawerVisible(true);
                }}
              />
            </Tooltip>
            <Tooltip title="ลบ">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(guest.id)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  const renderMobileCard = (guest: Guest) => {
    const rsvpStatus = getGuestRSVPStatus(guest, rsvpMap);
    const canCheckIn = rsvpStatus !== 'no';
    const table = tables.find(t => t.id === guest.tableId);
    const zone = zones.find(z => z.id === guest.zoneId);

    return (
      <Card key={guest.id} className="mb-3 shadow-sm" size="small">
        <div className="flex justify-between items-start mb-2">
          <div className="flex gap-3">
            <Avatar
              icon={<UserOutlined />}
              className={guest.side === 'groom' ? 'bg-blue-500' : guest.side === 'bride' ? 'bg-pink-500' : 'bg-purple-500'}
            />
            <div>
              <Text strong className="text-base block">{formatGuestName(guest)}</Text>
              <Space size="small" className="mt-1">
                {guest.nickname && <Tag>{guest.nickname}</Tag>}
                <RSVPStatusTag guest={guest} rsvpMap={rsvpMap} />
              </Space>
            </div>
          </div>
          {guest.checkedInAt && <Tag color="green">เช็คอินแล้ว</Tag>}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3 text-sm text-gray-600">
          <div>
            <PhoneOutlined className="mr-2" />
            {(() => {
              // Try to get phone number from guest first, then fallback to RSVP
              let phoneNumber = guest.phoneNumber;
              if (!phoneNumber && (guest.rsvpUid || guest.rsvpId)) {
                const rsvp = rsvpMap.get(guest.rsvpUid || guest.rsvpId || '');
                phoneNumber = rsvp?.phoneNumber;
              }
              return phoneNumber ? (
                <a href={`tel:${phoneNumber}`} className="text-blue-600">{phoneNumber}</a>
              ) : '-';
            })()}
          </div>
          <div>
            <span className="mr-2">โต๊ะ:</span>
            {table && zone ? `${zone.zoneName} - ${table.tableName}` : '-'}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-2">
          <Button
            icon={<PhoneOutlined />}
            href={guest.phoneNumber ? `tel:${guest.phoneNumber}` : undefined}
            disabled={!guest.phoneNumber}
          >
            โทร
          </Button>
          <Button
            type={guest.checkedInAt ? "default" : "primary"}
            danger={!!guest.checkedInAt}
            icon={<CheckCircleOutlined />}
            onClick={() => handleCheckIn(guest)}
            disabled={!canCheckIn && !guest.checkedInAt}
          >
            {guest.checkedInAt ? 'ยกเลิก' : 'เช็คอิน'}
          </Button>
          <Button icon={<EditOutlined />} onClick={() => {
            setEditingGuest(guest);
            setIsDrawerVisible(true);
          }} />
        </div>
      </Card>
    );
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen w-full">
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 m-0">รายชื่อแขก</h1>
            <Text type="secondary">จัดการรายชื่อแขกและเช็คอิน</Text>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <CustomSearch
              placeholder="ค้นหาชื่อ, เบอร์โทร"
              allowClear
              style={{ width: '100%', maxWidth: '300px' }}
              onSearch={setSearchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button type="primary" onClick={() => {
              setEditingGuest(null);
              setIsDrawerVisible(true);
            }}>
              เพิ่มแขก
            </Button>
          </div>
        </div>

        {screens.md ? (
          <Table
            columns={columns}
            dataSource={filteredTreeData}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 20 }}
            scroll={{ x: 1200 }}
            className="border border-gray-100 rounded-lg overflow-hidden"
          />
        ) : (
          <div className="pb-20">
            {filteredTreeData.map(item => {
              if (item.children) {
                return (
                  <div key={item.id} className="mb-4 border rounded-lg p-2 bg-gray-50">
                    <div className="mb-2 font-bold text-gray-700 px-2">{item.groupName || formatGuestName(item)} (กลุ่ม)</div>
                    {renderMobileCard(item)}
                    {item.children.map(child => renderMobileCard(child))}
                  </div>
                );
              }
              return renderMobileCard(item);
            })}
          </div>
        )}
      </div>

      <GuestFormDrawer
        visible={isDrawerVisible}
        onClose={() => {
          setIsDrawerVisible(false);
          setEditingGuest(null);
        }}
        onSubmit={handleFormSubmit}
        guestToEdit={editingGuest}
      />
    </div>
  );
};

export default GuestsPage;
