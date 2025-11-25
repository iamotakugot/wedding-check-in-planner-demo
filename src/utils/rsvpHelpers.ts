/**
 * 🔧 DevOps: Helper functions สำหรับจัดการ RSVP และ Guests
 * 
 * IMPORTANT: Functions เหล่านี้ต้องทำงานได้ถูกต้องกับ data structure ที่มีอยู่จริง
 * - RSVP มี guestId (ID ของ main guest) เมื่อถูก import แล้ว
 * - Guest มี rsvpUid (UID ของ RSVP) และ groupId (ID ของกลุ่ม)
 * - Main guest และ accompanying guests ใช้ groupId เดียวกัน
 */

// นำเข้า TypeScript types
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
// ฟังก์ชันสำหรับหา Guests ทั้งหมดที่ link กับ RSVP นี้ (ทั้ง main และ accompanying)
export const getGuestsFromRSVP = (rsvp: RSVPData, allGuests: Guest[]): Guest[] => {
  // ตรวจสอบ input
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

  // ถ้าหา main guest ไม่เจอ ให้ return array ว่าง
  if (!mainGuest) {
    return [];
  }

  // หา accompanying guests (ผ่าน groupId หรือ rsvpUid)
  const groupId = mainGuest.groupId;
  const relatedGuests: Guest[] = [mainGuest]; // เริ่มจาก main guest

  if (groupId) {
    // ถ้ามี groupId → หา guests ที่มี groupId เดียวกันและ rsvpUid ตรงกัน
    const accompanyingGuests = allGuests.filter(g => 
      g.id !== mainGuest!.id && // ไม่ใช่ main guest เอง
      g.groupId === groupId && // มี groupId เดียวกัน
      g.rsvpUid === rsvp.uid // มี rsvpUid ตรงกัน
    );
    relatedGuests.push(...accompanyingGuests);
  } else {
    // ถ้าไม่มี groupId → หาผ่าน rsvpUid เท่านั้น (fallback)
    const accompanyingGuests = allGuests.filter(g => 
      g.id !== mainGuest!.id && // ไม่ใช่ main guest เอง
      g.rsvpUid === rsvp.uid // มี rsvpUid ตรงกัน
    );
    relatedGuests.push(...accompanyingGuests);
  }
  return relatedGuests;
};

/**
 * ตรวจสอบว่า RSVP นี้ถูกนำเข้าแล้วหรือไม่ (มี Guest ที่ link อยู่)
 * 
 * @param rsvp - RSVPData object
 * @param allGuests - Array of Guest
 * @returns true ถ้ามี Guest ที่ link กับ RSVP นี้
 */
export const isRSVPImported = (rsvp: RSVPData, allGuests: Guest[]): boolean => {
  if (!rsvp || !rsvp.uid) return false;
  return getGuestsFromRSVP(rsvp, allGuests).length > 0;
};

/**
 * คำนวณจำนวนคนทั้งหมดจาก RSVP (ตัวเอง + ผู้ติดตาม)
 * 
 * @param rsvp - RSVPData object
 * @returns จำนวนคนทั้งหมด (ตัวเอง 1 + ผู้ติดตาม)
 */
export const getTotalPeopleFromRSVP = (rsvp: RSVPData): number => {
  if (!rsvp) return 0;
  return 1 + (rsvp.accompanyingGuests?.length || 0);
};

/**
 * คำนวณจำนวนคนที่เช็คอินแล้วจาก Guests ที่ link กับ RSVP
 * 
 * @param rsvp - RSVPData object
 * @param allGuests - Array of Guest
 * @returns จำนวน Guests ที่เช็คอินแล้ว
 */
export const getCheckedInCountFromRSVP = (rsvp: RSVPData, allGuests: Guest[]): number => {
  const guests = getGuestsFromRSVP(rsvp, allGuests);
  // กรองเฉพาะ Guests ที่มี checkedInAt ไม่เป็น null
  return guests.filter(g => g.checkedInAt !== null && g.checkedInAt !== undefined).length;
};

/**
 * จัดกลุ่ม RSVPs และเชื่อมกับ Guests
 * Type สำหรับกลุ่ม RSVP ที่เชื่อมกับ Guests
 */
export type RSVPGroup = {
  key: string; // Key สำหรับใช้ใน table/list
  rsvp: RSVPData; // ข้อมูล RSVP
  guests: Guest[]; // รายชื่อ Guests ที่ link กับ RSVP นี้
  groupName: string; // ชื่อกลุ่ม (จาก RSVP)
  side: 'groom' | 'bride' | 'both'; // ฝ่าย
  totalPeople: number; // จำนวนคนทั้งหมดจาก RSVP (ตัวเอง + ผู้ติดตาม)
  actualGuests: number; // จำนวน Guests ที่ link กับ RSVP (อาจน้อยกว่า totalPeople ถ้ายังไม่ได้ import)
  checkedIn: number; // จำนวนคนที่เช็คอินแล้ว
};

/**
 * จัดกลุ่ม RSVPs และเชื่อมกับ Guests พร้อม filter
 * 
 * @param rsvps - Array of RSVPData
 * @param allGuests - Array of Guest
 * @param filter - Optional filter object (side, zoneId, tableId, search)
 * @returns Array of RSVPGroup
 */
export const groupRSVPsWithGuests = (
  rsvps: RSVPData[],
  allGuests: Guest[],
  filter?: {
    side?: 'groom' | 'bride' | 'both' | 'all'; // กรองตามฝ่าย
    zoneId?: string | 'all'; // กรองตามโซน
    tableId?: string | 'all'; // กรองตามโต๊ะ
    search?: string; // กรองตามคำค้นหา
  }
): RSVPGroup[] => {
  // ตรวจสอบ input
  if (!rsvps || rsvps.length === 0) {
    return [];
  }

  if (!allGuests) {
    allGuests = [];
  }

  const groups: RSVPGroup[] = [];

  // Loop ผ่าน RSVPs ทั้งหมด
  for (const rsvp of rsvps) {
    // กรองตาม isComing - เฉพาะ RSVP ที่ตอบรับเข้างาน
    if (!rsvp || rsvp.isComing !== 'yes') continue;

    // กรองตาม side - ถ้ามี filter และไม่ใช่ 'all'
    if (filter?.side && filter.side !== 'all' && rsvp.side !== filter.side) continue;

    // หา Guests ที่ link กับ RSVP นี้
    const relatedGuests = getGuestsFromRSVP(rsvp, allGuests);

    // กรองตาม zone (ถ้ามี filter)
    if (filter?.zoneId && filter.zoneId !== 'all') {
      const filtered = relatedGuests.filter(g => g.zoneId === filter.zoneId);
      // ถ้าไม่มี Guest ใน zone นี้ ให้ข้าม RSVP นี้
      if (filtered.length === 0) continue;
    }

    // กรองตาม table (ถ้ามี filter)
    if (filter?.tableId && filter.tableId !== 'all') {
      const filtered = relatedGuests.filter(g => g.tableId === filter.tableId);
      // ถ้าไม่มี Guest ในโต๊ะนี้ ให้ข้าม RSVP นี้
      if (filtered.length === 0) continue;
    }

    // กรองตาม search (ถ้ามี filter) - รองรับภาษาไทย
    if (filter?.search && filter.search.trim()) {
      const searchTerm = filter.search.trim();
      // สร้าง search pattern ที่รองรับทั้งตัวพิมพ์เล็ก-ใหญ่และภาษาไทย
      // normalize เพื่อลบ tone marks (วรรณยุกต์) ออก
      const normalizeText = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normalizedSearch = normalizeText(searchTerm);
      
      // ตรวจสอบว่าคำค้นหาตรงกับชื่อใน RSVP หรือชื่อใน Guests หรือไม่
      const matchesSearch = 
        normalizeText(rsvp.fullName || `${rsvp.firstName} ${rsvp.lastName}`).includes(normalizedSearch) ||
        (rsvp.firstName && normalizeText(rsvp.firstName).includes(normalizedSearch)) ||
        (rsvp.lastName && normalizeText(rsvp.lastName).includes(normalizedSearch)) ||
        relatedGuests.some(g => 
          (g.firstName && normalizeText(g.firstName).includes(normalizedSearch)) ||
          (g.lastName && normalizeText(g.lastName).includes(normalizedSearch)) ||
          (g.nickname && normalizeText(g.nickname).includes(normalizedSearch))
        );
      // ถ้าไม่ตรงกับคำค้นหา ให้ข้าม RSVP นี้
      if (!matchesSearch) continue;
    }

    // สร้างข้อมูลกลุ่ม
    const groupName = rsvp.fullName || `${rsvp.firstName} ${rsvp.lastName}`;
    const totalPeople = getTotalPeopleFromRSVP(rsvp); // จำนวนคนทั้งหมดจาก RSVP
    const checkedIn = getCheckedInCountFromRSVP(rsvp, allGuests); // จำนวนคนที่เช็คอินแล้ว
    const groupKey = rsvp.id || rsvp.uid || `RSVP_${rsvp.uid}`; // Key สำหรับใช้ใน table/list

    // เพิ่มกลุ่มเข้า array
    groups.push({
      key: groupKey,
      rsvp,
      guests: relatedGuests,
      groupName,
      side: rsvp.side,
      totalPeople,
      actualGuests: relatedGuests.length, // จำนวน Guests ที่ link กับ RSVP
      checkedIn,
    });
  }

  return groups;
};
