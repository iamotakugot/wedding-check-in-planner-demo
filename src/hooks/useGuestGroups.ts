/**
 * Custom hook สำหรับ GuestGroup data
 * Map ข้อมูลจาก RSVP และ Guest เป็น GuestGroup structure
 */

import { useState, useEffect, useMemo } from 'react';
import { GuestGroup } from '@/types';
import { useRSVPs } from './useRSVPs';
import { useGuests } from './useGuests';
import { mapRSVPsToGuestGroups } from '@/utils/groupHelpers';

export const useGuestGroups = (isEnabled: boolean = true) => {
  const { rsvps, isLoading: rsvpsLoading } = useRSVPs(isEnabled);
  const { guests, isLoading: guestsLoading } = useGuests(isEnabled);
  const [guestGroups, setGuestGroups] = useState<GuestGroup[]>([]);

  // Map RSVPs และ Guests เป็น GuestGroups
  const mappedGroups = useMemo(() => {
    if (!isEnabled || rsvps.length === 0 || guests.length === 0) {
      return [];
    }
    return mapRSVPsToGuestGroups(rsvps, guests);
  }, [rsvps, guests, isEnabled]);

  useEffect(() => {
    if (!isEnabled) {
      setGuestGroups([]);
      return;
    }

    if (rsvpsLoading || guestsLoading) {
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
  }, [mappedGroups, rsvpsLoading, guestsLoading, isEnabled]);

  return {
    guestGroups,
    isLoading: rsvpsLoading || guestsLoading,
  };
};

