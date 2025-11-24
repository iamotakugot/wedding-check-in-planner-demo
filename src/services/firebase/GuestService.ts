/**
 * Guest Service Class
 * Singleton pattern สำหรับจัดการ Guest operations
 */

import { ref, get, set, update, remove, onValue, DataSnapshot } from 'firebase/database';
import { database } from '@/firebase/config';
import { Guest } from '@/types';
import { AuthService } from './AuthService';

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
      const snapshot = await get(this.guestsRef());
      if (!snapshot.exists()) return null;
      
      const data = snapshot.val();
      const guests = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      
      const existingGuest = guests.find((g: Guest) => 
        g.rsvpUid === rsvpUid || g.rsvpId === rsvpUid
      );
      
      return existingGuest || null;
    } catch (error) {
      console.error('Error finding guest by RSVP UID:', error);
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
    if (user.uid !== rsvpUid) {
      throw new Error('ไม่สามารถสร้าง Guest สำหรับ RSVP ของผู้อื่นได้');
    }
    
    const existingGuest = await this.getByRsvpUid(rsvpUid);
    if (existingGuest) {
      return;
    }
    
    const guestWithRsvpUid = { ...guest, rsvpUid };
    await set(ref(database, `guests/${guest.id}`), guestWithRsvpUid);
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

