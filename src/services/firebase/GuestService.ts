/**
 * Guest Service Class
 * Singleton pattern สำหรับจัดการ Guest operations
 */

import { ref, get, set, update, remove, onValue, query, orderByChild, equalTo, DataSnapshot } from 'firebase/database';
import { database } from '@/firebase/config';
import { Guest } from '@/types';
import { AuthService } from './AuthService';
import { logger } from '@/utils/logger';

export class GuestService {
  private static instance: GuestService;
  private subscriptions: Map<string, () => void> = new Map();

  private constructor() {}

  static getInstance(): GuestService {
    if (!GuestService.instance) {
      GuestService.instance = new GuestService();
    }
    return GuestService.instance;
  }

  private guestsRef() {
    return ref(database, 'guests');
  }

  private async requireAdmin(): Promise<void> {
    const user = AuthService.getInstance().getCurrentUser();
    if (!user) {
      throw new Error('ต้องเข้าสู่ระบบก่อน');
    }
    const isAdmin = await AuthService.getInstance().checkIsAdmin(user.uid);
    if (!isAdmin) {
      throw new Error('ไม่มีสิทธิ์เข้าถึง - เฉพาะ Admin เท่านั้น');
    }
  }

  async getAll(): Promise<Guest[]> {
    const snapshot = await get(this.guestsRef());
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.keys(data).map(key => ({ id: key, ...data[key] }));
  }

  async getById(id: string): Promise<Guest | null> {
    const snapshot = await get(ref(database, `guests/${id}`));
    if (!snapshot.exists()) return null;
    return { id, ...snapshot.val() };
  }

  async getByRsvpUid(rsvpUid: string): Promise<Guest | null> {
    try {
      const user = AuthService.getInstance().getCurrentUser();
      if (!user) {
        throw new Error('ต้องเข้าสู่ระบบก่อน');
      }
      
      // ตรวจสอบว่าเป็น admin หรือไม่
      const isAdmin = await AuthService.getInstance().checkIsAdmin(user.uid);
      
      if (isAdmin) {
        // Admin อ่านได้ทั้งหมด
        const snapshot = await get(this.guestsRef());
        if (!snapshot.exists()) return null;
        
        const data = snapshot.val();
        const guests = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        
        const existingGuest = guests.find((g: Guest) => 
          g.rsvpUid === rsvpUid || g.rsvpId === rsvpUid
        );
        
        return existingGuest || null;
      } else {
        // User ใช้ query เฉพาะ guest ที่มี rsvpUid ตรงกับ uid
        if (user.uid !== rsvpUid) {
          // ถ้าไม่ใช่เจ้าของ RSVP ให้ return null
          return null;
        }
        
        // Query เฉพาะ guest ที่มี rsvpUid ตรงกับ uid
        const rsvpUidQuery = query(this.guestsRef(), orderByChild('rsvpUid'), equalTo(rsvpUid));
        const snapshot = await get(rsvpUidQuery);
        
        if (!snapshot.exists()) {
          // ลอง query ด้วย rsvpId
          const rsvpIdQuery = query(this.guestsRef(), orderByChild('rsvpId'), equalTo(rsvpUid));
          const snapshot2 = await get(rsvpIdQuery);
          if (!snapshot2.exists()) return null;
          
          const data = snapshot2.val();
          const guestId = Object.keys(data)[0];
          return { id: guestId, ...data[guestId] };
        }
        
        const data = snapshot.val();
        const guestId = Object.keys(data)[0];
        return { id: guestId, ...data[guestId] };
      }
    } catch (error) {
      logger.error('Error finding guest by RSVP UID:', error);
      throw error;
    }
  }

  async create(guest: Guest): Promise<void> {
    await this.requireAdmin();
    await set(ref(database, `guests/${guest.id}`), guest);
  }

  async update(id: string, updates: Partial<Guest>): Promise<void> {
    await this.requireAdmin();
    await update(ref(database, `guests/${id}`), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  async delete(id: string): Promise<void> {
    await this.requireAdmin();
    await remove(ref(database, `guests/${id}`));
  }

  async createFromRSVP(guest: Guest, rsvpUid: string): Promise<void> {
    const user = AuthService.getInstance().getCurrentUser();
    if (!user) {
      throw new Error('ต้องเข้าสู่ระบบก่อน');
    }
    
    // ตรวจสอบว่าเป็น admin หรือเป็นเจ้าของ RSVP
    const isAdmin = await AuthService.getInstance().checkIsAdmin(user.uid);
    if (!isAdmin && user.uid !== rsvpUid) {
      throw new Error('ไม่สามารถสร้าง Guest สำหรับ RSVP ของผู้อื่นได้');
    }
    
    const existingGuest = await this.getByRsvpUid(rsvpUid);
    if (existingGuest) {
      return;
    }
    
    const guestWithRsvpUid = { ...guest, rsvpUid };
    
    // ถ้าเป็น admin ให้ใช้ create (ซึ่งมี requireAdmin)
    // ถ้าเป็น user ให้ใช้ set โดยตรง (เพราะ rules อนุญาตให้ write ถ้า rsvpUid === auth.uid)
    if (isAdmin) {
      await this.create(guestWithRsvpUid);
    } else {
      await set(ref(database, `guests/${guest.id}`), guestWithRsvpUid);
    }
  }

  async updateFromRSVP(id: string, updates: Partial<Guest>, rsvpUid: string): Promise<void> {
    const user = AuthService.getInstance().getCurrentUser();
    if (!user) {
      throw new Error('ต้องเข้าสู่ระบบก่อน');
    }
    if (user.uid !== rsvpUid) {
      throw new Error('ไม่สามารถแก้ไข Guest ของผู้อื่นได้');
    }
    
    const existingGuest = await this.getById(id);
    if (!existingGuest) {
      throw new Error('ไม่พบ Guest ที่ต้องการแก้ไข');
    }
    
    if (existingGuest.rsvpUid && existingGuest.rsvpUid !== rsvpUid) {
      throw new Error('ไม่สามารถแก้ไข Guest ของผู้อื่นได้');
    }
    
    if (!existingGuest.rsvpUid) {
      throw new Error('ไม่สามารถแก้ไข Guest ที่ถูกสร้างโดย Admin ได้');
    }
    
    await update(ref(database, `guests/${id}`), { 
      ...updates, 
      updatedAt: new Date().toISOString() 
    });
  }

  subscribe(callback: (guests: Guest[]) => void): () => void {
    const subscriptionId = `guest_${Date.now()}_${Math.random()}`;
    
    const unsubscribe = onValue(this.guestsRef(), (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      const data = snapshot.val();
      const guests = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      callback(guests);
    });
    
    this.subscriptions.set(subscriptionId, unsubscribe);
    
    return () => {
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
    };
  }

  unsubscribe(id: string): void {
    const unsubscribe = this.subscriptions.get(id);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(id);
    }
  }

  cleanup(): void {
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    this.subscriptions.clear();
  }
}

