/**
 * Helper functions สำหรับจัดการ GuestGroup
 * Map ข้อมูลจาก RSVP และ Guest เป็น GuestGroup structure
 */

import { RSVPData, Guest, GuestGroup, GroupMember, SeatAssignment, TableData, Zone } from '@/types';
import { getGuestsFromRSVP } from './rsvpHelpers';
import { formatGuestName } from './guestHelpers';

/**
 * Map RSVP และ Guests เป็น GuestGroup
 * @param rsvp - RSVPData object
 * @param guests - Array of Guest objects
 * @param tables - Array of TableData objects (for seat lookup)
 * @param zones - Array of Zone objects (for seat lookup)
 * @returns GuestGroup หรือ null ถ้าไม่มีข้อมูล
 */
export function mapRSVPToGuestGroup(
  rsvp: RSVPData,
  guests: Guest[],
  tables: TableData[] = [],
  zones: Zone[] = []
): GuestGroup | null {
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

  // แยก main guest และ accompanying guests
  const mainGuestIndex = relatedGuests.findIndex(g => g.id === mainGuest.id);
  const sortedGuests = [
    mainGuest,
    ...relatedGuests.filter((_, idx) => idx !== mainGuestIndex)
  ];

  // Map Guests เป็น GroupMembers
  const members: GroupMember[] = sortedGuests.map((guest, index) => {
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

    const fullName = formatGuestName(guest);
    const isOwner = index === 0; // คนแรกคือ owner
    const orderIndex = index; // 0 = ตัวเอง, 1,2,3,... = แขกคนที่ 1,2,3,...

    // Populate seat assignment from Guest.tableId/zoneId
    let seat: SeatAssignment | null = null;
    if (guest.tableId && guest.zoneId) {
      const table = tables.find(t => t.tableId === guest.tableId);
      const zone = zones.find(z => z.zoneId === guest.zoneId);
      
      if (table && zone) {
        seat = {
          tableId: guest.tableId,
          tableLabel: table.tableName,
          zoneId: guest.zoneId,
          zoneLabel: zone.zoneName,
        };
      }
    }

    return {
      id: guest.id,
      firstName: guest.firstName,
      lastName: guest.lastName,
      nickname: guest.nickname || '',
      fullName,
      relationToMain,
      checkedInAt: guest.checkedInAt || null,
      isOwner,
      orderIndex,
      seat,
    };
  });

  // คำนวณ checkedInCount
  const checkedInCount = members.filter(m => m.checkedInAt !== null).length;

  // ใช้ rsvp.uid หรือ rsvp.id เป็น groupId
  const groupId = rsvp.uid || rsvp.id || '';

  return {
    groupId,
    groupName,
    members,
    checkedInCount,
    totalCount: members.length,
    relation: rsvp.relation || mainGuest.relationToCouple || '',
    side: mainGuest.side || rsvp.side || 'groom',
  };
}

/**
 * Map RSVPs และ Guests เป็น GuestGroups
 * @param rsvps - Array of RSVPData
 * @param guests - Array of Guest objects
 * @param tables - Array of TableData objects (for seat lookup)
 * @param zones - Array of Zone objects (for seat lookup)
 * @returns Array of GuestGroup
 */
export function mapRSVPsToGuestGroups(
  rsvps: RSVPData[],
  guests: Guest[],
  tables: TableData[] = [],
  zones: Zone[] = []
): GuestGroup[] {
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
    const group = mapRSVPToGuestGroup(rsvp, guests, tables, zones);
    if (group) {
      guestGroups.push(group);
    }
  }

  return guestGroups;
}

