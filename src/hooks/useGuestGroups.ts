/**
 * Custom hook สำหรับ GuestGroup data
 * Map ข้อมูลจาก RSVP และ Guest เป็น GuestGroup structure
 */

import { useState, useEffect, useMemo } from 'react';
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

    // Update guestGroups
    setGuestGroups(mappedGroups);

    // Debug: console.log ข้อมูลกลุ่ม
    console.log('[useGuestGroups] จำนวนกลุ่มทั้งหมด:', mappedGroups.length);
    console.log('[useGuestGroups] รายละเอียดกลุ่ม:', mappedGroups.map(g => ({
      groupId: g.groupId,
      groupName: g.groupName,
      totalCount: g.totalCount,
      checkedInCount: g.checkedInCount,
      members: g.members.map(m => ({
        name: `${m.firstName} ${m.lastName}`,
        checkedIn: m.checkedInAt !== null,
        hasSeat: m.seat !== null && m.seat !== undefined,
      })),
    })));
  }, [mappedGroups, rsvpsLoading, guestsLoading, tablesLoading, zonesLoading, isEnabled]);

  return {
    guestGroups,
    isLoading: rsvpsLoading || guestsLoading || tablesLoading || zonesLoading,
  };
};

