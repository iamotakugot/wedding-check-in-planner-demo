/**
 * Utility functions สำหรับจัดการ Guest data
 */

import { Guest, RSVPData } from '@/types';

/**
 * จัดรูปแบบชื่อแขก (firstName + lastName)
 * @param guest - Guest object
 * @returns ชื่อเต็มของแขก
 */
export const formatGuestName = (guest: Guest | null | undefined): string => {
  if (!guest) return '';
  return `${guest.firstName || ''} ${guest.lastName || ''}`.trim() || 'ไม่ระบุชื่อ';
};

/**
 * ดึงสถานะ RSVP ของแขก
 * @param guest - Guest object
 * @param rsvpMap - Map ของ RSVP data (key: uid หรือ id)
 * @returns 'yes' | 'no' | null
 */
export const getGuestRSVPStatus = (
  guest: Guest,
  rsvpMap: Map<string, RSVPData>
): 'yes' | 'no' | null => {
  if (!guest) return null;
  
  const rsvp = guest.rsvpUid ? rsvpMap.get(guest.rsvpUid) : 
               guest.rsvpId ? rsvpMap.get(guest.rsvpId) : null;
  
  return rsvp?.isComing || null;
};

/**
 * แปลงสถานะ RSVP เป็นข้อความภาษาไทย
 * @param status - 'yes' | 'no' | null
 * @returns ข้อความสถานะ
 */
export const getRSVPStatusText = (status: 'yes' | 'no' | null): string => {
  switch (status) {
    case 'yes':
      return 'ยินดีร่วมงาน';
    case 'no':
      return 'ไม่สะดวก';
    default:
      return 'ยังไม่ตอบรับ';
  }
};

