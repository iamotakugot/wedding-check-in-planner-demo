/**
 * RSVP Service Class
 * Singleton pattern สำหรับจัดการ RSVP operations
 */

import { ref, get, set, push, update, onValue, DataSnapshot } from 'firebase/database';
import { database } from '@/firebase/config';
import { RSVPData } from '@/types';
import { AuthService } from './AuthService';
import { logger } from '@/utils/logger';

interface FirebaseError {
  code?: string;
  message?: string;
}

function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('code' in error || 'message' in error)
  );
}

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export class RSVPService {
  private static instance: RSVPService;
  private subscriptions: Map<string, () => void> = new Map();

  private constructor() {}

  static getInstance(): RSVPService {
    if (!RSVPService.instance) {
      RSVPService.instance = new RSVPService();
    }
    return RSVPService.instance;
  }

  private rsvpsRef() {
    return ref(database, 'rsvps');
  }

  async create(rsvp: Omit<RSVPData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const user = AuthService.getInstance().getCurrentUser();
      if (!user) {
        throw new Error('ต้องเข้าสู่ระบบก่อนบันทึกข้อมูล RSVP');
      }

      // Validation
      if (!rsvp.firstName || !rsvp.firstName.trim()) {
        throw new Error('กรุณากรอกชื่อ');
      }
      if (!rsvp.lastName || !rsvp.lastName.trim()) {
        throw new Error('กรุณากรอกนามสกุล');
      }
      if (!rsvp.isComing || (rsvp.isComing !== 'yes' && rsvp.isComing !== 'no')) {
        throw new Error('กรุณาเลือกสถานะการร่วมงาน');
      }
      if (rsvp.isComing === 'yes' && !rsvp.side) {
        throw new Error('กรุณาเลือกฝ่าย');
      }

      const now = new Date().toISOString();
      const fullName = `${rsvp.firstName.trim()} ${rsvp.lastName.trim()}`.trim();

      const rsvpData: Omit<RSVPData, 'id'> = {
        ...rsvp,
        uid: user.uid,
        fullName,
        createdAt: now,
        updatedAt: now,
      };

      const newRef = push(this.rsvpsRef());
      if (!newRef.key) {
        throw new Error('ไม่สามารถสร้าง RSVP ได้');
      }

      await set(newRef, rsvpData);
      return newRef.key;
    } catch (error) {
      if (isFirebaseError(error) && error.code === 'PERMISSION_DENIED') {
        throw new Error('ไม่มีสิทธิ์บันทึกข้อมูล RSVP');
      }
      if (isError(error)) {
        throw error;
      }
      throw new Error('เกิดข้อผิดพลาดในการบันทึกข้อมูล RSVP');
    }
  }

  async update(id: string, updates: Partial<RSVPData>): Promise<void> {
    const user = AuthService.getInstance().getCurrentUser();
    if (!user) {
      throw new Error('ต้องเข้าสู่ระบบก่อน');
    }

    // ตรวจสอบว่าเป็น admin หรือเป็นเจ้าของ RSVP
    const isAdmin = await AuthService.getInstance().checkIsAdmin(user.uid);
    
    if (!isAdmin) {
      // ถ้าไม่ใช่ admin ต้องตรวจสอบว่าเป็นเจ้าของ RSVP
      const existingRSVP = await this.getByUid(user.uid);
      if (!existingRSVP || existingRSVP.id !== id) {
        throw new Error('ไม่มีสิทธิ์แก้ไข RSVP นี้');
      }
    }

    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Update fullName ถ้ามีการแก้ไข firstName หรือ lastName
    if (updates.firstName || updates.lastName) {
      const currentRSVPs = await this.getAll();
      const rsvp = currentRSVPs.find(r => r.id === id);
      if (rsvp) {
        const firstName = updates.firstName || rsvp.firstName;
        const lastName = updates.lastName || rsvp.lastName;
        updatesWithTimestamp.fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      }
    }

    await update(ref(database, `rsvps/${id}`), updatesWithTimestamp);
  }

  async getById(id: string): Promise<RSVPData | null> {
    try {
      const snapshot = await get(ref(database, `rsvps/${id}`));
      if (!snapshot.exists()) return null;
      return { id, ...snapshot.val() };
    } catch (error) {
      logger.error('Error getting RSVP by ID:', error);
      return null;
    }
  }

  async getByUid(uid?: string): Promise<RSVPData | null> {
    if (!uid) {
      const user = AuthService.getInstance().getCurrentUser();
      if (!user) return null;
      uid = user.uid;
    }

    const snapshot = await get(this.rsvpsRef());
    if (!snapshot.exists()) return null;
    
    const data = snapshot.val();
    const rsvps = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    
    // หา RSVP ที่มี uid ตรงกัน (เรียงตาม createdAt ล่าสุด)
    const matchingRSVPs = rsvps.filter((r: RSVPData) => r.uid === uid);
    if (matchingRSVPs.length === 0) return null;
    
    // เรียงตาม createdAt และคืนค่าล่าสุด
    matchingRSVPs.sort((a: RSVPData, b: RSVPData) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    
    return matchingRSVPs[0];
  }

  async getAll(): Promise<RSVPData[]> {
    try {
      const snapshot = await get(this.rsvpsRef());
      if (!snapshot.exists()) return [];
      const data = snapshot.val();
      return Object.keys(data).map(key => ({ id: key, ...data[key] }));
    } catch (error) {
      logger.error('Error getting all RSVPs:', error);
      return [];
    }
  }

  subscribe(callback: (rsvps: RSVPData[]) => void): () => void {
    const subscriptionId = `rsvp_${Date.now()}_${Math.random()}`;
    
    const unsubscribe = onValue(this.rsvpsRef(), (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      const data = snapshot.val();
      const rsvps = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      callback(rsvps);
    });
    
    this.subscriptions.set(subscriptionId, unsubscribe);
    
    // Return cleanup function
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

