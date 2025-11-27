/**
 * Custom hook สำหรับ GuestGroup data
 * Map ข้อมูลจาก RSVP และ Guest เป็น GuestGroup structure
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { GuestGroup } from '@/types';
import { useRSVPs } from './useRSVPs';
import { useGuests } from './useGuests';
import { useTables } from './useTables';
import { useZones } from './useZones';
import { mapRSVPsToGuestGroups } from '@/utils/groupHelpers';

export const useGuestGroups = (isEnabled: boolean = true) => {
  const { rsvps, isLoading: rsvpsLoading } = useRSVPs(isEnabled);
  const { guests, isLoading: guestsLoading } = useGuests(isEnabled);
  const { tables, isLoading: tablesLoading } = useTables(isEnabled);
  const { zones, isLoading: zonesLoading } = useZones(isEnabled);
  const [guestGroups, setGuestGroups] = useState<GuestGroup[]>([]);
  const prevMappedGroupsRef = useRef<string>(''); // เก็บ JSON string สำหรับเปรียบเทียบ

  // Map RSVPs และ Guests เป็น GuestGroups (with seat assignments from tables/zones)
  const mappedGroups = useMemo(() => {
    if (!isEnabled || rsvps.length === 0 || guests.length === 0) {
      return [];
    }
    return mapRSVPsToGuestGroups(rsvps, guests, tables, zones);
  }, [rsvps, guests, tables, zones, isEnabled]);

  useEffect(() => {
    if (!isEnabled) {
      setGuestGroups([]);
      return;
    }

    if (rsvpsLoading || guestsLoading || tablesLoading || zonesLoading) {
      return;
    }

    // เปรียบเทียบด้วย JSON string (deep comparison)
    // รวม seat information เพื่อให้ detect การเปลี่ยนแปลงของ tableId/zoneId
    const currentGroupsString = JSON.stringify(mappedGroups.map(g => ({
      groupId: g.groupId,
      totalCount: g.totalCount,
      checkedInCount: g.checkedInCount,
      membersCount: g.members.length,
      memberIds: g.members.map(m => m.id).sort(),
      memberSeats: g.members.map(m => ({
        id: m.id,
        seat: m.seat ? {
          tableId: m.seat.tableId,
          zoneId: m.seat.zoneId,
        } : null,
      })).sort((a, b) => a.id.localeCompare(b.id)),
    })));

    // ถ้าข้อมูลไม่เปลี่ยน → ไม่ต้อง update
    if (prevMappedGroupsRef.current === currentGroupsString) {
      return;
    }

    // Update state
    setGuestGroups(mappedGroups);
    prevMappedGroupsRef.current = currentGroupsString;

    // Debug log (only when changed)
    if (process.env.NODE_ENV === 'development') {
    console.log('[useGuestGroups] จำนวนกลุ่มทั้งหมด:', mappedGroups.length);
      if (mappedGroups.length > 0) {
    console.log('[useGuestGroups] รายละเอียดกลุ่ม:', mappedGroups.map(g => ({
      groupId: g.groupId,
      groupName: g.groupName,
      totalCount: g.totalCount,
      checkedInCount: g.checkedInCount,
    })));
      }
    }
  }, [mappedGroups, rsvpsLoading, guestsLoading, tablesLoading, zonesLoading, isEnabled]);

  return {
    guestGroups,
    isLoading: rsvpsLoading || guestsLoading || tablesLoading || zonesLoading,
  };
};

