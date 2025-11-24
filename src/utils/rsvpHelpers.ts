/**
 * 🔧 DevOps: Helper functions สำหรับจัดการ RSVP และ Guests
 * 
 * IMPORTANT: Functions เหล่านี้ต้องทำงานได้ถูกต้องกับ data structure ที่มีอยู่จริง
 * - RSVP มี guestId (ID ของ main guest) เมื่อถูก import แล้ว
 * - Guest มี rsvpUid (UID ของ RSVP) และ groupId (ID ของกลุ่ม)
 * - Main guest และ accompanying guests ใช้ groupId เดียวกัน
 */

import type { RSVPData } from '@/services/firebaseService';
import type { Guest } from '@/types';

/**
 * หา Guests ทั้งหมดที่ link กับ RSVP นี้ (ทั้ง main และ accompanying)
 * 
 * Logic:
 * 1. หา main guest ผ่าน rsvp.guestId (ถ้ามี) หรือ rsvpUid === rsvp.uid
 * 2. หา accompanying guests ผ่าน groupId (ถ้ามี) หรือ rsvpUid === rsvp.uid
 */
export const getGuestsFromRSVP = (rsvp: RSVPData, allGuests: Guest[]): Guest[] => {
  if (!rsvp || !rsvp.uid) {
    return [];
  }

  if (!allGuests || allGuests.length === 0) {
    return [];
  }

  // หา main guest (ผ่าน guestId หรือ rsvpUid)
  let mainGuest: Guest | undefined;
  
  // วิธีที่ 1: หาผ่าน rsvp.guestId (ถ้ามี - แสดงว่า import แล้ว)
  if (rsvp.guestId) {
    mainGuest = allGuests.find(g => g.id === rsvp.guestId);
  }
  
  // วิธีที่ 2: หาผ่าน rsvpUid (ถ้ายังไม่มี guestId หรือหาไม่เจอ)
  if (!mainGuest) {
    mainGuest = allGuests.find(g => g.rsvpUid === rsvp.uid);
  }

  if (!mainGuest) {
    return [];
  }

  // หา accompanying guests (ผ่าน groupId หรือ rsvpUid)
  const groupId = mainGuest.groupId;
  const relatedGuests: Guest[] = [mainGuest]; // เริ่มจาก main guest

  if (groupId) {
    // ถ้ามี groupId → หา guests ที่มี groupId เดียวกันและ rsvpUid ตรงกัน
    const accompanyingGuests = allGuests.filter(g => 
      g.id !== mainGuest!.id && 
      g.groupId === groupId && 
      g.rsvpUid === rsvp.uid
    );
    relatedGuests.push(...accompanyingGuests);
  } else {
    // ถ้าไม่มี groupId → หาผ่าน rsvpUid เท่านั้น (fallback)
    const accompanyingGuests = allGuests.filter(g => 
      g.id !== mainGuest!.id && 
      g.rsvpUid === rsvp.uid
    );
    relatedGuests.push(...accompanyingGuests);
  }

  return relatedGuests;
};

/**
 * ตรวจสอบว่า RSVP นี้ถูกนำเข้าแล้วหรือไม่ (มี Guest ที่ link อยู่)
 */
export const isRSVPImported = (rsvp: RSVPData, allGuests: Guest[]): boolean => {
  if (!rsvp || !rsvp.uid) return false;
  return getGuestsFromRSVP(rsvp, allGuests).length > 0;
};

/**
 * คำนวณจำนวนคนทั้งหมดจาก RSVP (ตัวเอง + ผู้ติดตาม)
 */
export const getTotalPeopleFromRSVP = (rsvp: RSVPData): number => {
  if (!rsvp) return 0;
  return 1 + (rsvp.accompanyingGuests?.length || 0);
};

/**
 * คำนวณจำนวนคนที่เช็คอินแล้วจาก Guests ที่ link กับ RSVP
 */
export const getCheckedInCountFromRSVP = (rsvp: RSVPData, allGuests: Guest[]): number => {
  const guests = getGuestsFromRSVP(rsvp, allGuests);
  return guests.filter(g => g.checkedInAt !== null && g.checkedInAt !== undefined).length;
};

/**
 * จัดกลุ่ม RSVPs และเชื่อมกับ Guests
 */
export type RSVPGroup = {
  key: string;
  rsvp: RSVPData;
  guests: Guest[];
  groupName: string;
  side: 'groom' | 'bride' | 'both';
  totalPeople: number; // จาก RSVP
  actualGuests: number; // จำนวน Guests ที่ link กับ RSVP
  checkedIn: number; // จำนวนคนที่เช็คอินแล้ว
};

export const groupRSVPsWithGuests = (
  rsvps: RSVPData[],
  allGuests: Guest[],
  filter?: {
    side?: 'groom' | 'bride' | 'both' | 'all';
    zoneId?: string | 'all';
    tableId?: string | 'all';
    search?: string;
  }
): RSVPGroup[] => {
  if (!rsvps || rsvps.length === 0) {
    return [];
  }

  if (!allGuests) {
    allGuests = [];
  }

  const groups: RSVPGroup[] = [];

  for (const rsvp of rsvps) {
    // กรองตาม isComing
    if (!rsvp || rsvp.isComing !== 'yes') continue;

    // กรองตาม side
    if (filter?.side && filter.side !== 'all' && rsvp.side !== filter.side) continue;

    // หา Guests ที่ link กับ RSVP นี้
    const relatedGuests = getGuestsFromRSVP(rsvp, allGuests);

    // กรองตาม zone (ถ้ามี filter)
    if (filter?.zoneId && filter.zoneId !== 'all') {
      const filtered = relatedGuests.filter(g => g.zoneId === filter.zoneId);
      if (filtered.length === 0) continue;
    }

    // กรองตาม table (ถ้ามี filter)
    if (filter?.tableId && filter.tableId !== 'all') {
      const filtered = relatedGuests.filter(g => g.tableId === filter.tableId);
      if (filtered.length === 0) continue;
    }

    // กรองตาม search (ถ้ามี filter)
    if (filter?.search && filter.search.trim()) {
      const lower = filter.search.trim().toLowerCase();
      const matchesSearch = 
        (rsvp.fullName || `${rsvp.firstName} ${rsvp.lastName}`).toLowerCase().includes(lower) ||
        relatedGuests.some(g => 
          (g.firstName || '').toLowerCase().includes(lower) ||
          (g.lastName || '').toLowerCase().includes(lower) ||
          (g.nickname || '').toLowerCase().includes(lower)
        );
      if (!matchesSearch) continue;
    }

    const groupName = rsvp.fullName || `${rsvp.firstName} ${rsvp.lastName}`;
    const totalPeople = getTotalPeopleFromRSVP(rsvp);
    const checkedIn = getCheckedInCountFromRSVP(rsvp, allGuests);
    const groupKey = rsvp.id || rsvp.uid || `RSVP_${rsvp.uid}`;

    groups.push({
      key: groupKey,
      rsvp,
      guests: relatedGuests,
      groupName,
      side: rsvp.side,
      totalPeople,
      actualGuests: relatedGuests.length,
      checkedIn,
    });
  }

  return groups;
};
