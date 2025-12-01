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

  // หาหัวหน้า (main guest) - ลำดับความสำคัญ:
  // 1. หา guest ที่ชื่อตรงกับ RSVP (rsvp.firstName + rsvp.lastName) - นี่คือ main guest จริง
  // 2. guest ที่มี rsvpUid ตรงกับ rsvp.uid และเป็น guestId ใน RSVP
  // 3. guest ที่มี rsvpUid ตรงกับ rsvp.uid และมี groupId (เป็น owner)
  // 4. guest ที่มี rsvpUid ตรงกับ rsvp.uid
  // 5. guest แรกใน relatedGuests
  let mainGuest: Guest | undefined;
  
  // วิธีที่ 1: หา guest ที่ชื่อตรงกับ RSVP (นี่คือ main guest จริง)
  const rsvpFullName = `${rsvp.firstName} ${rsvp.lastName}`.trim().toLowerCase();
  mainGuest = relatedGuests.find(g => {
    const guestFullName = formatGuestName(g).toLowerCase();
    // Match ทั้งชื่อเต็ม หรือ firstName + lastName
    return guestFullName === rsvpFullName ||
           (g.firstName.toLowerCase() === rsvp.firstName.toLowerCase() && 
            g.lastName.toLowerCase() === rsvp.lastName.toLowerCase());
  });
  
  // วิธีที่ 2: หาผ่าน rsvp.guestId (ถ้ายังหาไม่เจอ)
  if (!mainGuest && rsvp.guestId) {
    mainGuest = relatedGuests.find(g => g.id === rsvp.guestId);
  }
  
  // วิธีที่ 3: หา guest ที่มี rsvpUid ตรงกันและมี groupId (น่าจะเป็น owner)
  if (!mainGuest) {
    mainGuest = relatedGuests.find(g => 
      g.rsvpUid === rsvp.uid && g.groupId
    );
  }
  
  // วิธีที่ 4: หา guest ที่มี rsvpUid ตรงกัน
  if (!mainGuest) {
    mainGuest = relatedGuests.find(g => g.rsvpUid === rsvp.uid);
  }
  
  // วิธีที่ 5: ใช้ guest แรก
  if (!mainGuest) {
    mainGuest = relatedGuests[0];
  }

  // ใช้ชื่อจาก RSVP เป็น groupName (ไม่ใช่ชื่อ mainGuest)
  // ใช้ fullName ถ้ามี หรือสร้างจาก firstName + lastName (กรอง "-" ออก)
  const groupName = rsvp.fullName || 
    `${rsvp.firstName} ${rsvp.lastName && rsvp.lastName !== '-' ? rsvp.lastName : ''}`.trim() || 
    formatGuestName(mainGuest);

  // แยก main guest และ accompanying guests
  // กรอง guest ที่ซ้ำกับ main guest ออก (ชื่อเดียวกันแต่ไม่ใช่ main guest เอง)
  const mainGuestFirstName = mainGuest.firstName.trim().toLowerCase();
  const mainGuestLastName = mainGuest.lastName.trim().toLowerCase();
  const mainGuestFullName = `${mainGuestFirstName} ${mainGuestLastName}`.trim();
  
  const otherGuests = relatedGuests.filter(g => {
    // ไม่ใช่ main guest เอง
    if (g.id === mainGuest.id) return false;
    
    // เปรียบเทียบ firstName + lastName โดยตรง (เข้มงวด)
    const guestFirstName = g.firstName.trim().toLowerCase();
    const guestLastName = g.lastName.trim().toLowerCase();
    const guestFullName = `${guestFirstName} ${guestLastName}`.trim();
    
    // กรอง guest ที่ชื่อซ้ำกับ main guest (firstName + lastName ตรงกัน)
    if (guestFullName === mainGuestFullName && mainGuestFullName !== '') {
      return false; // กรองออก
    }
    
    // กรอง guest ที่ชื่อตรงกับ RSVP (เพราะ main guest ควรเป็นคนเดียว)
    if (guestFullName === rsvpFullName && rsvpFullName !== '') {
      return false; // กรองออก
    }
    
    // กรอง guest ที่ firstName ตรงกับ main guest และ lastName ตรงกัน (กรณี lastName ว่าง)
    if (guestFirstName === mainGuestFirstName && 
        guestLastName === mainGuestLastName &&
        mainGuestFirstName !== '') {
      return false; // กรองออก
    }
    
    return true;
  });

  let sortedGuests = [mainGuest, ...otherGuests];

  // ตรวจสอบว่า main guest อยู่ในตำแหน่งแรกจริงๆ
  // ถ้าไม่ใช่ ให้สลับตำแหน่ง
  if (sortedGuests[0]?.id !== mainGuest.id) {
    const mainIndex = sortedGuests.findIndex(g => g.id === mainGuest.id);
    if (mainIndex > 0) {
      [sortedGuests[0], sortedGuests[mainIndex]] = [sortedGuests[mainIndex], sortedGuests[0]];
    }
  }

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

