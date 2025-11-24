/**
 * Zone Service Class
 * Singleton pattern สำหรับจัดการ Zone operations
 */

import { ref, get, set, update, remove, onValue, DataSnapshot } from 'firebase/database';
import { database } from '@/firebase/config';
import { Zone } from '@/types';
import { AuthService } from './AuthService';

export class ZoneService {
  private static instance: ZoneService;
  private subscriptions: Map<string, () => void> = new Map();

  private constructor() {}

  static getInstance(): ZoneService {
    if (!ZoneService.instance) {
      ZoneService.instance = new ZoneService();
    }
    return ZoneService.instance;
  }

  private zonesRef() {
    return ref(database, 'zones');
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

  async getAll(): Promise<Zone[]> {
    const snapshot = await get(this.zonesRef());
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.keys(data).map(key => ({ id: key, ...data[key] }));
  }

  async create(zone: Zone): Promise<void> {
    await this.requireAdmin();
    await set(ref(database, `zones/${zone.id}`), zone);
  }

  async update(id: string, updates: Partial<Zone>): Promise<void> {
    await this.requireAdmin();
    await update(ref(database, `zones/${id}`), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  async delete(id: string): Promise<void> {
    await this.requireAdmin();
    await remove(ref(database, `zones/${id}`));
  }

  subscribe(callback: (zones: Zone[]) => void): () => void {
    const subscriptionId = `zone_${Date.now()}_${Math.random()}`;
    
    const unsubscribe = onValue(this.zonesRef(), (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      const data = snapshot.val();
      const zones = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      callback(zones);
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

