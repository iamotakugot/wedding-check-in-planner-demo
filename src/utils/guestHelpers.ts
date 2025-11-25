/**
 * Utility functions สำหรับจัดการ Guest data
 */

import { Guest, RSVPData, GuestGroup, GroupMember } from '@/types';

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

/**
 * สร้าง label สำหรับแสดงสมาชิกในกลุ่ม
 * @param group - GuestGroup object
 * @param member - GroupMember object
 * @returns ข้อความ label เช่น "ภัทรพงษ์ พิศเพ็ง – แขกตัวเอง" หรือ "ภัทรพงษ์ พิศเพ็ง – แขกคนที่ 1: แนท (พี่/น้อง)"
 */
export const renderMemberLabel = (group: GuestGroup, member: GroupMember): string => {
  if (member.isOwner || member.orderIndex === 0) {
    return `${group.groupName} – แขกตัวเอง`;
  }
  
  const memberName = member.fullName || `${member.firstName} ${member.lastName}`.trim();
  const relationText = member.relationToMain ? ` (${member.relationToMain})` : '';
  return `${group.groupName} – แขกคนที่ ${member.orderIndex}${memberName ? `: ${memberName}${relationText}` : relationText}`;
};

