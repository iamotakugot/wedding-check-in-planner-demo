/**
 * 🔧 DevOps: Helper functions สำหรับจัดการ RSVP และ Guests
 * 
 * IMPORTANT: Functions เหล่านี้ต้องทำงานได้ถูกต้องกับ data structure ที่มีอยู่จริง
 * - RSVP มี guestId (ID ของ main guest) เมื่อถูก import แล้ว
 * - Guest มี rsvpUid (UID ของ RSVP) และ groupId (ID ของกลุ่ม)
 * - Main guest และ accompanying guests ใช้ groupId เดียวกัน
 */

import type { RSVPData } from '@/types';
import type { Guest } from '@/types';

/**
 * คำนวณจำนวนคนเข้างานทั้งหมดจาก RSVP (รวมผู้ติดตาม)
 * นับเฉพาะ RSVP ที่ isComing === 'yes'
 * 
 * @param rsvps - Array of RSVPData
 * @returns จำนวนคนทั้งหมด (ตัวเอง + ผู้ติดตาม)
 */
export const calculateTotalAttendees = (rsvps: RSVPData[]): number => {
  if (!rsvps || rsvps.length === 0) return 0;
  
  return rsvps.reduce((total, rsvp) => {
    if (!rsvp || rsvp.isComing !== 'yes') return total;
    
    // นับตัวเอง (1) + ผู้ติดตาม
    const mainPerson = 1;
    const accompanyingCount = rsvp.accompanyingGuests?.length || 0;
    
    return total + mainPerson + accompanyingCount;
  }, 0);
};

/**
 * คำนวณจำนวนคนที่เช็คอินแล้วจาก Guests
 * 
 * @param guests - Array of Guest
 * @returns จำนวน guests ที่มี checkedInAt ไม่เป็น null
 */
export const calculateCheckedInCount = (guests: Guest[]): number => {
  if (!guests || guests.length === 0) return 0;
  
  return guests.filter(guest => 
    guest && 
    guest.checkedInAt !== null && 
    guest.checkedInAt !== undefined
  ).length;
};

/**
 * คำนวณสถิติ RSVP
 * 
 * @param rsvps - Array of RSVPData
 * @returns Object ที่มี totalForms, totalComingForms, totalNotComingForms
 */
export const calculateRsvpStats = (rsvps: RSVPData[]): {
  totalForms: number;
  totalComingForms: number;
  totalNotComingForms: number;
} => {
  if (!rsvps || rsvps.length === 0) {
    return {
      totalForms: 0,
      totalComingForms: 0,
      totalNotComingForms: 0,
    };
  }
  
  const totalForms = rsvps.length;
  const totalComingForms = rsvps.filter(r => r && r.isComing === 'yes').length;
  const totalNotComingForms = rsvps.filter(r => r && r.isComing === 'no').length;
  
  return {
    totalForms,
    totalComingForms,
    totalNotComingForms,
  };
};

/**
 * ตรวจสอบว่า Guest ถูกจัดโต๊ะแล้วหรือไม่
 * ต้องมีทั้ง zoneId และ tableId ที่ไม่เป็น null
 * 
 * @param guest - Guest object
 * @returns true ถ้า Guest ถูกจัดโต๊ะแล้ว (มีทั้ง zoneId และ tableId)
 */
export const isGuestSeated = (guest: Guest): boolean => {
  return guest.zoneId !== null && 
         guest.zoneId !== undefined && 
         guest.tableId !== null && 
         guest.tableId !== undefined;
};

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

    // กรองตาม search (ถ้ามี filter) - รองรับภาษาไทย
    if (filter?.search && filter.search.trim()) {
      const searchTerm = filter.search.trim();
      // สร้าง search pattern ที่รองรับทั้งตัวพิมพ์เล็ก-ใหญ่และภาษาไทย
      const normalizeText = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normalizedSearch = normalizeText(searchTerm);
      
      const matchesSearch = 
        normalizeText(rsvp.fullName || `${rsvp.firstName} ${rsvp.lastName}`).includes(normalizedSearch) ||
        (rsvp.firstName && normalizeText(rsvp.firstName).includes(normalizedSearch)) ||
        (rsvp.lastName && normalizeText(rsvp.lastName).includes(normalizedSearch)) ||
        relatedGuests.some(g => 
          (g.firstName && normalizeText(g.firstName).includes(normalizedSearch)) ||
          (g.lastName && normalizeText(g.lastName).includes(normalizedSearch)) ||
          (g.nickname && normalizeText(g.nickname).includes(normalizedSearch))
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
