/**
 * Check-In Manager
 * Business logic สำหรับจัดการ check-in และ group management
 */

import { Guest } from '@/types';
import { GuestService } from '@/services/firebase/GuestService';

export class CheckInManager {
  private guestService: GuestService;

  constructor() {
    this.guestService = GuestService.getInstance();
  }

  /**
   * Check-in guest
   */
  async checkInGuest(guestId: string, method: 'manual' | 'qr' = 'manual'): Promise<void> {
    const now = new Date().toISOString();
    await this.guestService.update(guestId, {
      checkedInAt: now,
      checkInMethod: method,
    });
  }

  /**
   * Check-out guest
   */
  async checkOutGuest(guestId: string): Promise<void> {
    await this.guestService.update(guestId, {
      checkedInAt: null,
      checkInMethod: null,
    });
  }

  /**
   * Check-in group
   */
  async checkInGroup(groupId: string, method: 'manual' | 'qr' = 'manual'): Promise<void> {
    const guests = await this.guestService.getAll();
    const groupGuests = guests.filter(g => g.groupId === groupId);
    
    const now = new Date().toISOString();
    for (const guest of groupGuests) {
      await this.guestService.update(guest.id, {
        checkedInAt: now,
        checkInMethod: method,
      });
    }
  }

  /**
   * Check-in group members (เฉพาะ guests ที่เลือกจาก checkbox)
   * @param groupId - ID ของกลุ่ม
   * @param guestIds - Array ของ guest IDs ที่เลือกเช็คอิน
   * @param method - วิธีการเช็คอิน ('manual' หรือ 'qr')
   */
  async checkInGroupMembers(groupId: string, guestIds: string[], method: 'manual' | 'qr' = 'manual'): Promise<void> {
    const guests = await this.guestService.getAll();
    const groupGuests = guests.filter(g => g.groupId === groupId && guestIds.includes(g.id));
    
    const now = new Date().toISOString();
    for (const guest of groupGuests) {
      await this.guestService.update(guest.id, {
        checkedInAt: now,
        checkInMethod: method,
      });
    }
  }

  /**
   * Check-out group
   */
  async checkOutGroup(groupId: string): Promise<void> {
    const guests = await this.guestService.getAll();
    const groupGuests = guests.filter(g => g.groupId === groupId);
    
    for (const guest of groupGuests) {
      await this.guestService.update(guest.id, {
        checkedInAt: null,
        checkInMethod: null,
      });
    }
  }

  /**
   * Get checked-in count
   */
  async getCheckedInCount(): Promise<number> {
    const guests = await this.guestService.getAll();
    return guests.filter(g => g.checkedInAt !== null).length;
  }

  /**
   * Get guests by group
   */
  async getGuestsByGroup(groupId: string): Promise<Guest[]> {
    const guests = await this.guestService.getAll();
    return guests.filter(g => g.groupId === groupId);
  }
}

