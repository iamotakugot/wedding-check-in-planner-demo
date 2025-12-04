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

    // หา guests ทั้งหมดที่มี rsvpUid ตรงกัน (เพื่อใช้ groupId เดียวกัน)
    const allGuests = await this.guestService.getAll();
    const existingGuestsWithRsvpUid = allGuests.filter(g =>
      g.rsvpUid === rsvp.uid || g.rsvpId === rsvp.uid
    );

    // หา main guest ที่มีอยู่แล้ว
    let mainGuest: Guest | null = null;
    if (rsvp.guestId) {
      mainGuest = existingGuestsWithRsvpUid.find(g => g.id === rsvp.guestId) || null;
    }
    if (!mainGuest) {
      // หา main guest จาก guest ที่มี rsvpUid ตรงกัน (เลือก guest ที่มี groupId หรือ guest แรก)
      mainGuest = existingGuestsWithRsvpUid.find(g => g.groupId) || existingGuestsWithRsvpUid[0] || null;
    }

    // ถ้ามี guests ที่มี rsvpUid ตรงกันอยู่แล้ว → ใช้ groupId เดียวกัน
    if (existingGuestsWithRsvpUid.length > 0) {
      // หา groupId ที่มีอยู่แล้ว (จาก guest ที่มี groupId)
      const existingGroupId = existingGuestsWithRsvpUid.find(g => g.groupId)?.groupId;

      // ถ้ามี groupId อยู่แล้ว → อัปเดต guests ทั้งหมดให้ใช้ groupId เดียวกัน
      if (existingGroupId) {
        const groupName = existingGuestsWithRsvpUid.find(g => g.groupName)?.groupName || `${rsvp.firstName} ${rsvp.lastName}`;

        // อัปเดต guests ที่ยังไม่มี groupId หรือ groupId ต่างกัน
        for (const guest of existingGuestsWithRsvpUid) {
          if (!guest.groupId || guest.groupId !== existingGroupId) {
            await this.guestService.update(guest.id, {
              groupId: existingGroupId,
              groupName: groupName,
            });
          }
        }

        // ใช้ mainGuest ที่อัปเดตแล้ว
        if (mainGuest) {
          mainGuest = await this.guestService.getById(mainGuest.id);
        }
      }
    }

    // ถ้ามี main guest แล้ว → ตรวจสอบว่า accompanying guests ถูกสร้างครบหรือไม่
    if (mainGuest) {
      const expectedAccompanyingCount = rsvp.accompanyingGuests?.length || 0;
      if (expectedAccompanyingCount > 0) {
        // หา accompanying guests ที่มีอยู่ (ใช้ groupId จาก mainGuest)
        const groupId = mainGuest.groupId;
        const existingAccompanyingGuests = allGuests.filter(g =>
          g.id !== mainGuest!.id &&
          g.groupId === groupId &&
          (g.rsvpUid === rsvp.uid || g.rsvpId === rsvp.uid)
        );

        // ถ้ายังไม่ครบ → สร้างเพิ่ม
        if (existingAccompanyingGuests.length < expectedAccompanyingCount) {
          // ใช้ groupId จาก mainGuest (ไม่สร้างใหม่)
          const groupId = mainGuest.groupId || `GROUP_${generateId()}`;
          const groupName = mainGuest.groupName || `${rsvp.firstName} ${rsvp.lastName}`;

          // ถ้า mainGuest ยังไม่มี groupId → สร้างและอัปเดต
          if (!mainGuest.groupId) {
            await this.guestService.update(mainGuest.id, {
              groupId: groupId,
              groupName: groupName,
            });
          }

          // สร้าง accompanying guests ที่ยังไม่มี
          const existingNames = new Set(existingAccompanyingGuests.map(g => g.firstName));
          for (let i = 0; i < rsvp.accompanyingGuests.length; i++) {
            const accGuest = rsvp.accompanyingGuests[i];
            // ตรวจสอบว่าถูกสร้างแล้วหรือยัง (เช็คชื่อ)
            if (!existingNames.has(accGuest.name)) {
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
              // ใช้ create แทน createFromRSVP เพราะ createFromRSVP จะ return ถ้ามี guest ที่มี rsvpUid ตรงกันแล้ว
              await this.guestService.create(accGuestData);
            }
          }
        }
      }

      // Link RSVP กับ Guest หลัก (ถ้ายังไม่ได้ link)
      if (!rsvp.guestId) {
        await this.rsvpService.update(rsvpId, { guestId: mainGuest.id });
      }
      return;
    }

    // สร้าง Guest entries ใหม่ (ถ้ายังไม่มี main guest)
    const groupId = `GROUP_${generateId()}`;
    const groupName = `${rsvp.firstName} ${rsvp.lastName}`;

    // สร้าง Guest หลัก
    const mainGuestId = generateId();
    const newMainGuest: Guest = {
      id: mainGuestId,
      firstName: rsvp.firstName,
      lastName: rsvp.lastName,
      phoneNumber: rsvp.phoneNumber,
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

    // FIX: Use create() instead of createFromRSVP() because we're in admin context
    // createFromRSVP() checks if current user.uid === rsvpUid, which fails when admin is syncing
    await this.guestService.create(newMainGuest);

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
        // ใช้ create แทน createFromRSVP เพราะ createFromRSVP จะ return ถ้ามี guest ที่มี rsvpUid ตรงกันแล้ว
        await this.guestService.create(accGuestData);
      }
    }

    // Link RSVP กับ Guest หลัก
    await this.rsvpService.update(rsvpId, { guestId: mainGuestId });
  }
}

