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

/**
 * ลบ undefined properties ออกจาก object (Firebase ไม่รองรับ undefined)
 */
function removeUndefinedProperties<T extends Record<string, any>>(obj: T): T {
  const cleaned = { ...obj };
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
}

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
   * @param phoneNumber - Phone number (จะใช้จาก user.phoneNumber ถ้าไม่ระบุ - แนะนำให้ใช้ user.phoneNumber)
   */
  async createOrUpdateProfile(user: User, phoneNumber?: string): Promise<GuestProfile> {
    try {
      const uid = user.uid;
      // ให้ความสำคัญกับ user.phoneNumber ก่อน (เป็น E.164 format จาก Firebase Auth)
      // ใช้ phoneNumber parameter เป็น fallback เท่านั้น
      const userPhoneNumber = user.phoneNumber || phoneNumber || '';
      
      // Validate phone number
      if (!userPhoneNumber || userPhoneNumber.trim().length === 0) {
        throw new Error('ไม่พบเบอร์โทรศัพท์');
      }
      
      // แปลง phone number เป็น E.164 format ถ้าจำเป็น
      let finalPhoneNumber = userPhoneNumber;
      if (!userPhoneNumber.startsWith('+')) {
        logger.warn('[GuestProfileService] Phone number is not in E.164 format:', userPhoneNumber);
        // พยายามแปลงเป็น E.164 format ถ้าเป็นเบอร์ไทย
        const cleaned = userPhoneNumber.replace(/\D/g, '');
        if (cleaned.length >= 9 && cleaned.length <= 10) {
          // ถ้าเป็นเบอร์ไทย (เริ่มด้วย 0 หรือ 66)
          if (cleaned.startsWith('0')) {
            finalPhoneNumber = '+66' + cleaned.substring(1);
          } else if (cleaned.startsWith('66')) {
            finalPhoneNumber = '+' + cleaned;
          } else {
            finalPhoneNumber = '+66' + cleaned;
          }
          logger.log('[GuestProfileService] Converted phone number to E.164:', finalPhoneNumber);
        }
      }

      // ตรวจสอบว่ามี profile อยู่แล้วหรือไม่
      const existingProfile = await this.getByUid(uid);
      const now = new Date().toISOString();

      if (existingProfile) {
        // อัปเดต profile ที่มีอยู่
        const updates: Partial<GuestProfile> = {
          phoneNumber: finalPhoneNumber,
          updatedAt: now,
        };

        // อัปเดต displayName ถ้าผู้ใช้ยังไม่ได้ตั้งไว้
        if (!existingProfile.displayName && user.displayName) {
          updates.displayName = user.displayName;
        }

        // ลบ undefined properties ก่อนบันทึก (Firebase ไม่รองรับ undefined)
        const cleanedUpdates = removeUndefinedProperties(updates);

        await update(ref(database, `guestProfiles/${uid}`), cleanedUpdates);
        
        logger.log('[GuestProfileService] Profile updated:', uid);
        return { ...existingProfile, ...cleanedUpdates } as GuestProfile;
      } else {
        // สร้าง profile ใหม่
        const newProfile: Partial<GuestProfile> = {
          uid,
          phoneNumber: finalPhoneNumber,
          role: 'guest',
          createdAt: now,
          updatedAt: now,
        };

        // เพิ่ม displayName เฉพาะเมื่อมีค่า (ไม่ใช่ null หรือ undefined)
        if (user.displayName) {
          newProfile.displayName = user.displayName;
        }

        // ลบ undefined properties ก่อนบันทึก (Firebase ไม่รองรับ undefined)
        const cleanedProfile = removeUndefinedProperties(newProfile);

        await set(ref(database, `guestProfiles/${uid}`), cleanedProfile);
        
        logger.log('[GuestProfileService] Profile created:', uid);
        return cleanedProfile as GuestProfile;
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
