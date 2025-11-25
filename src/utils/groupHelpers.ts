/**
 * Helper functions สำหรับจัดการ GuestGroup
 * Map ข้อมูลจาก RSVP และ Guest เป็น GuestGroup structure
 */

import { RSVPData, Guest, GuestGroup, GroupMember } from '@/types';
import { getGuestsFromRSVP } from './rsvpHelpers';
import { formatGuestName } from './guestHelpers';

/**
 * Map RSVP และ Guests เป็น GuestGroup
 * @param rsvp - RSVPData object
 * @param guests - Array of Guest objects
 * @returns GuestGroup หรือ null ถ้าไม่มีข้อมูล
 */
export function mapRSVPToGuestGroup(rsvp: RSVPData, guests: Guest[]): GuestGroup | null {
  // ตรวจสอบ input
  if (!rsvp || !rsvp.uid) {
    return null;
  }

  if (!guests || guests.length === 0) {
    return null;
  }

  // Filter เฉพาะ RSVP ที่ตอบรับเข้างาน
  if (rsvp.isComing !== 'yes') {
    return null;
  }

  // หา Guests ที่ link กับ RSVP นี้
  const relatedGuests = getGuestsFromRSVP(rsvp, guests);

  // ถ้าไม่มี Guest ที่ link กับ RSVP นี้
  if (relatedGuests.length === 0) {
    return null;
  }

  // หาหัวหน้า (main guest) - guest ที่มี rsvpUid ตรงกับ rsvp.uid และเป็นคนแรก
  const mainGuest = relatedGuests.find(g => g.rsvpUid === rsvp.uid) || relatedGuests[0];

  // ใช้ชื่อหัวหน้าเป็น groupName
  const groupName = formatGuestName(mainGuest) || `${rsvp.firstName} ${rsvp.lastName}`.trim();

  // Map Guests เป็น GroupMembers
  const members: GroupMember[] = relatedGuests.map(guest => {
    // หา relationToMain จาก accompanyingGuests หรือใช้ relationToCouple
    let relationToMain = guest.relationToCouple || '';

    // ถ้าไม่ใช่หัวหน้า ให้หา relationToMain จาก accompanyingGuests
    if (guest.id !== mainGuest.id && rsvp.accompanyingGuests) {
      const accompanyingGuest = rsvp.accompanyingGuests.find(
        ag => {
          // พยายาม match ชื่อ
          const agName = ag.name.trim().toLowerCase();
          const guestName = formatGuestName(guest).toLowerCase();
          return guestName.includes(agName) || agName.includes(guestName);
        }
      );
      if (accompanyingGuest) {
        relationToMain = accompanyingGuest.relationToMain || guest.relationToCouple || '';
      }
    } else {
      // ถ้าเป็นหัวหน้า ให้ใช้ relation จาก RSVP
      relationToMain = rsvp.relation || guest.relationToCouple || '';
    }

    return {
      id: guest.id,
      firstName: guest.firstName,
      lastName: guest.lastName,
      nickname: guest.nickname || '',
      relationToMain,
      checkedInAt: guest.checkedInAt || null,
      tableId: guest.tableId || null,
      zoneId: guest.zoneId || null,
    };
  });

  // คำนวณ checkedInCount
  const checkedInCount = members.filter(m => m.checkedInAt !== null).length;

  // ดึงข้อมูล tableId และ zoneId
  // ถ้าทุกคนอยู่ในโต๊ะเดียวกัน → ใช้ tableId นั้น
  // ถ้าไม่ → null
  const uniqueTableIds = new Set(members.map(m => m.tableId).filter(Boolean));
  const tableId = uniqueTableIds.size === 1 ? Array.from(uniqueTableIds)[0] as string : null;

  const uniqueZoneIds = new Set(members.map(m => m.zoneId).filter(Boolean));
  const zoneId = uniqueZoneIds.size === 1 ? Array.from(uniqueZoneIds)[0] as string : null;

  // ใช้ rsvp.uid หรือ rsvp.id เป็น groupId
  const groupId = rsvp.uid || rsvp.id || '';

  return {
    groupId,
    groupName,
    members,
    checkedInCount,
    totalCount: members.length,
    tableId,
    zoneId,
    relation: rsvp.relation || mainGuest.relationToCouple || '',
    side: mainGuest.side || rsvp.side || 'groom',
  };
}

/**
 * Map RSVPs และ Guests เป็น GuestGroups
 * @param rsvps - Array of RSVPData
 * @param guests - Array of Guest objects
 * @returns Array of GuestGroup
 */
export function mapRSVPsToGuestGroups(rsvps: RSVPData[], guests: Guest[]): GuestGroup[] {
  // ตรวจสอบ input
  if (!rsvps || rsvps.length === 0) {
    return [];
  }

  if (!guests || guests.length === 0) {
    return [];
  }

  const guestGroups: GuestGroup[] = [];

  // Loop ผ่าน RSVPs ทั้งหมด
  for (const rsvp of rsvps) {
    // Filter เฉพาะ RSVP ที่ตอบรับเข้างาน
    if (!rsvp || rsvp.isComing !== 'yes') {
      continue;
    }

    // Map RSVP → GuestGroup
    const group = mapRSVPToGuestGroup(rsvp, guests);
    if (group) {
      guestGroups.push(group);
    }
  }

  return guestGroups;
}

