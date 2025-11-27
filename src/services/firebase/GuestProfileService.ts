/**
 * Guest Profile Service Class
 * Singleton pattern สำหรับจัดการ Guest Profile operations
 */

import { ref, get, set, update } from 'firebase/database';
import { database } from '@/firebase/config';
import { GuestProfile } from '@/types';
import { AuthService } from './AuthService';
import { logger } from '@/utils/logger';
import { User } from 'firebase/auth';

export class GuestProfileService {
  private static instance: GuestProfileService;

  private constructor() {}

  static getInstance(): GuestProfileService {
    if (!GuestProfileService.instance) {
      GuestProfileService.instance = new GuestProfileService();
    }
    return GuestProfileService.instance;
  }

  /**
   * สร้างหรืออัปเดต Guest Profile หลังจาก OTP login สำเร็จ
   * @param user - Firebase User object
   * @param phoneNumber - Phone number (จะใช้จาก user.phoneNumber ถ้าไม่ระบุ)
   */
  async createOrUpdateProfile(user: User, phoneNumber?: string): Promise<GuestProfile> {
    try {
      const uid = user.uid;
      const userPhoneNumber = phoneNumber || user.phoneNumber || '';
      
      // Validate phone number
      if (!userPhoneNumber || userPhoneNumber.trim().length === 0) {
        throw new Error('ไม่พบเบอร์โทรศัพท์');
      }
      
      // Validate phone number format (should be in E.164 format from Firebase Auth)
      if (!userPhoneNumber.startsWith('+')) {
        logger.warn('[GuestProfileService] Phone number is not in E.164 format:', userPhoneNumber);
      }

      // ตรวจสอบว่ามี profile อยู่แล้วหรือไม่
      const existingProfile = await this.getByUid(uid);
      const now = new Date().toISOString();

      if (existingProfile) {
        // อัปเดต profile ที่มีอยู่
        const updates: Partial<GuestProfile> = {
          phoneNumber: userPhoneNumber,
          updatedAt: now,
        };

        // อัปเดต displayName ถ้าผู้ใช้ยังไม่ได้ตั้งไว้
        if (!existingProfile.displayName && user.displayName) {
          updates.displayName = user.displayName;
        }

        await update(ref(database, `guestProfiles/${uid}`), updates);
        
        logger.log('[GuestProfileService] Profile updated:', uid);
        return { ...existingProfile, ...updates };
      } else {
        // สร้าง profile ใหม่
        const newProfile: GuestProfile = {
          uid,
          phoneNumber: userPhoneNumber,
          displayName: user.displayName || undefined,
          role: 'guest',
          createdAt: now,
          updatedAt: now,
        };

        await set(ref(database, `guestProfiles/${uid}`), newProfile);
        
        logger.log('[GuestProfileService] Profile created:', uid);
        return newProfile;
      }
    } catch (error) {
      logger.error('[GuestProfileService] Error creating/updating profile:', error);
      throw error;
    }
  }

  /**
   * ดึง Guest Profile โดย UID
   * @param uid - Firebase Auth UID
   */
  async getByUid(uid: string): Promise<GuestProfile | null> {
    try {
      const snapshot = await get(ref(database, `guestProfiles/${uid}`));
      if (!snapshot.exists()) return null;
      return snapshot.val();
    } catch (error) {
      logger.error('[GuestProfileService] Error getting profile:', error);
      return null;
    }
  }

  /**
   * อัปเดต displayName
   * @param uid - Firebase Auth UID
   * @param displayName - ชื่อที่แสดง
   */
  async updateDisplayName(uid: string, displayName: string): Promise<void> {
    try {
      const user = AuthService.getInstance().getCurrentUser();
      if (!user || user.uid !== uid) {
        throw new Error('ไม่มีสิทธิ์แก้ไข profile นี้');
      }

      await update(ref(database, `guestProfiles/${uid}`), {
        displayName,
        updatedAt: new Date().toISOString(),
      });

      logger.log('[GuestProfileService] Display name updated:', uid);
    } catch (error) {
      logger.error('[GuestProfileService] Error updating display name:', error);
      throw error;
    }
  }

  /**
   * ดึง Guest Profile ของผู้ใช้ปัจจุบัน
   */
  async getCurrentProfile(): Promise<GuestProfile | null> {
    try {
      const user = AuthService.getInstance().getCurrentUser();
      if (!user) {
        return null;
      }
      return await this.getByUid(user.uid);
    } catch (error) {
      logger.error('[GuestProfileService] Error getting current profile:', error);
      return null;
    }
  }
}
