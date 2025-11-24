/**
 * RSVP Manager
 * Business logic สำหรับจัดการ RSVP และ Guest synchronization
 */

import { RSVPData, Guest } from '@/types';
import { RSVPService } from '@/services/firebase/RSVPService';
import { GuestService } from '@/services/firebase/GuestService';
import { generateId } from '@/utils/id';

export class RSVPManager {
  private rsvpService: RSVPService;
  private guestService: GuestService;

  constructor() {
    this.rsvpService = RSVPService.getInstance();
    this.guestService = GuestService.getInstance();
  }

  /**
   * สร้าง RSVP พร้อม Guest entries
   */
  async createRSVPWithGuests(rsvpData: Omit<RSVPData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const rsvpId = await this.rsvpService.create(rsvpData);
    
    // ถ้า isComing === 'yes' ให้สร้าง Guest entries
    if (rsvpData.isComing === 'yes' && rsvpData.uid) {
      await this.syncRSVPToGuest(rsvpId);
    }
    
    return rsvpId;
  }

  /**
   * Sync RSVP เป็น Guest entries (idempotent)
   */
  async syncRSVPToGuest(rsvpId: string): Promise<void> {
    const rsvp = await this.rsvpService.getById(rsvpId);
    if (!rsvp || !rsvp.uid) {
      return;
    }

    // ตรวจสอบว่า sync แล้วหรือยัง
    if (rsvp.guestId) {
      const existingGuest = await this.guestService.getById(rsvp.guestId);
      if (existingGuest) {
        return; // Sync แล้ว
      }
    }

    // ตรวจสอบว่ามี Guest จาก RSVP นี้อยู่แล้วหรือไม่
    const existingGuest = await this.guestService.getByRsvpUid(rsvp.uid);
    if (existingGuest) {
      // Link RSVP กับ Guest ที่มีอยู่
      await this.rsvpService.update(rsvpId, { guestId: existingGuest.id });
      return;
    }

    // สร้าง Guest entries ใหม่
    const groupId = `GROUP_${generateId()}`;
    const groupName = `${rsvp.firstName} ${rsvp.lastName}`;

    // สร้าง Guest หลัก
    const mainGuestId = generateId();
    const mainGuest: Guest = {
      id: mainGuestId,
      firstName: rsvp.firstName,
      lastName: rsvp.lastName,
      nickname: rsvp.nickname || '',
      age: null,
      gender: 'other',
      relationToCouple: rsvp.relation || '',
      side: rsvp.side as 'groom' | 'bride' | 'both',
      zoneId: null,
      tableId: null,
      note: rsvp.note || '',
      isComing: true,
      accompanyingGuestsCount: rsvp.accompanyingGuestsCount || 0,
      groupId: groupId,
      groupName: groupName,
      checkedInAt: null,
      checkInMethod: null,
      rsvpUid: rsvp.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.guestService.createFromRSVP(mainGuest, rsvp.uid);

    // สร้าง Guest สำหรับผู้ติดตาม
    if (rsvp.accompanyingGuests && rsvp.accompanyingGuests.length > 0) {
      for (let i = 0; i < rsvp.accompanyingGuests.length; i++) {
        const accGuest = rsvp.accompanyingGuests[i];
        const accGuestId = generateId();
        const accGuestData: Guest = {
          id: accGuestId,
          firstName: accGuest.name || `คนที่ ${i + 1}`,
          lastName: '',
          nickname: '',
          age: null,
          gender: 'other',
          relationToCouple: accGuest.relationToMain || '',
          side: rsvp.side as 'groom' | 'bride' | 'both',
          zoneId: null,
          tableId: null,
          note: '',
          isComing: true,
          accompanyingGuestsCount: 0,
          groupId: groupId,
          groupName: groupName,
          checkedInAt: null,
          checkInMethod: null,
          rsvpUid: rsvp.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await this.guestService.createFromRSVP(accGuestData, rsvp.uid);
      }
    }

    // Link RSVP กับ Guest หลัก
    await this.rsvpService.update(rsvpId, { guestId: mainGuestId });
  }
}

