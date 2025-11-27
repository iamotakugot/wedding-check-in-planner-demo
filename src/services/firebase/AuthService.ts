/**
 * Auth Service Class
 * Singleton pattern สำหรับจัดการ Authentication operations
 */

import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User,
  signInWithPhoneNumber,
  ConfirmationResult,
  RecaptchaVerifier
} from 'firebase/auth';
import { auth } from '@/firebase/config';
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

/**
 * Format phone number to E.164 format (+66XXXXXXXXX)
 * Supports: 0812345678, +66812345678, 66812345678
 * @param phoneNumber - Phone number in any format
 * @returns Formatted phone number in E.164 format
 */
const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Remove + if exists
  cleaned = cleaned.replace(/\+/g, '');
  
  // Must have 9-10 digits for Thai numbers
  if (cleaned.length < 9 || cleaned.length > 10) {
    throw new Error('เบอร์โทรศัพท์ต้องมี 9-10 หลัก');
  }
  
  // Handle different formats
  if (cleaned.length === 10) {
    // 10 digits: 0812345678 -> 66812345678
    if (cleaned.startsWith('0')) {
      cleaned = '66' + cleaned.substring(1);
    } else if (!cleaned.startsWith('66')) {
      throw new Error('เบอร์โทรศัพท์ 10 หลักต้องขึ้นต้นด้วย 0');
    }
  } else if (cleaned.length === 9) {
    // 9 digits: 812345678 -> 66812345678
    if (cleaned.startsWith('66')) {
      // Already has country code, but only 9 digits total - invalid
      throw new Error('เบอร์โทรศัพท์ไม่ถูกต้อง');
    }
    // Add country code
    cleaned = '66' + cleaned;
  }
  
  // Final validation: should be 11 digits (66 + 9 digits)
  if (cleaned.length !== 11 || !cleaned.startsWith('66')) {
    throw new Error('เบอร์โทรศัพท์ไม่ถูกต้อง');
  }
  
  // Add + prefix for E.164 format
  return '+' + cleaned;
};

export class AuthService {
  private static instance: AuthService;
  private subscriptions: Map<string, () => void> = new Map();
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Setup reCAPTCHA verifier for phone authentication
   * @param containerId - DOM element ID for reCAPTCHA widget (optional, uses invisible reCAPTCHA if not provided)
   * @returns RecaptchaVerifier instance
   */
  setupRecaptchaVerifier(containerId?: string): RecaptchaVerifier {
    // Clean up existing verifier if any
    if (this.recaptchaVerifier) {
      try {
        this.recaptchaVerifier.clear();
      } catch (error) {
        logger.warn('[AuthService] Error clearing existing recaptcha verifier:', error);
      }
    }

    // Create new verifier
    // Use invisible reCAPTCHA if containerId is not provided
    const recaptchaContainerId = containerId || 'recaptcha-container';
    this.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
      size: 'invisible',
      callback: () => {
        logger.log('[AuthService] reCAPTCHA verified successfully');
      },
      'expired-callback': () => {
        logger.warn('[AuthService] reCAPTCHA expired');
      },
    });

    return this.recaptchaVerifier;
  }

  /**
   * Send OTP to phone number
   * @param phoneNumber - Phone number in any format (will be formatted to E.164)
   * @returns ConfirmationResult
   */
  async signInWithPhoneNumber(phoneNumber: string): Promise<ConfirmationResult> {
    try {
      // Format phone number to E.164 format
      const formattedPhone = formatPhoneNumber(phoneNumber);
      logger.log('[AuthService] Requesting OTP for phone:', formattedPhone);

      // Setup reCAPTCHA verifier if not already set
      if (!this.recaptchaVerifier) {
        this.setupRecaptchaVerifier();
      }

      // Send OTP
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, this.recaptchaVerifier!);
      this.confirmationResult = confirmationResult;
      
      logger.log('[AuthService] OTP sent successfully');
      return confirmationResult;
    } catch (error: unknown) {
      logger.error('[AuthService] Error sending OTP:', error);
      
      // Re-throw validation errors from formatPhoneNumber
      if (error instanceof Error && error.message.includes('เบอร์โทรศัพท์')) {
        throw error;
      }
      
      if (isFirebaseError(error)) {
        // Handle specific Firebase errors
        if (error.code === 'auth/invalid-phone-number') {
          throw new Error('เบอร์โทรศัพท์ไม่ถูกต้อง กรุณาตรวจสอบรูปแบบเบอร์โทรศัพท์');
        } else if (error.code === 'auth/too-many-requests') {
          throw new Error('มีการขอรหัส OTP มากเกินไป กรุณารอสักครู่ (1-2 นาที) แล้วลองใหม่');
        } else if (error.code === 'auth/quota-exceeded') {
          throw new Error('เกินโควต้าสำหรับวันนี้ กรุณาลองใหม่ในวันถัดไป');
        } else if (error.code === 'auth/captcha-check-failed') {
          throw new Error('ไม่สามารถตรวจสอบ reCAPTCHA ได้ กรุณารีเฟรชหน้าแล้วลองใหม่');
        } else if (error.code === 'auth/network-request-failed') {
          throw new Error('เกิดข้อผิดพลาดเกี่ยวกับเครือข่าย กรุณาตรวจสอบการเชื่อมต่อและลองใหม่');
        }
      }
      
      // Log unexpected errors with metadata
      logger.error('[AuthService] Unexpected error sending OTP:', {
        error,
        phoneNumber: phoneNumber.substring(0, 3) + '****', // Mask phone number in logs
      });
      
      throw error;
    }
  }

  /**
   * Verify OTP code
   * @param otp - 6-digit OTP code
   * @returns User object
   */
  async verifyOTP(otp: string): Promise<User> {
    try {
      if (!this.confirmationResult) {
        throw new Error('ไม่มีข้อมูลการยืนยัน OTP กรุณาขอรหัส OTP ใหม่');
      }

      logger.log('[AuthService] Verifying OTP...');
      const userCredential = await this.confirmationResult.confirm(otp);
      
      // Clear confirmation result after successful verification
      this.confirmationResult = null;
      
      logger.log('[AuthService] OTP verified successfully, user:', userCredential.user.uid);
      return userCredential.user;
    } catch (error: unknown) {
      logger.error('[AuthService] Error verifying OTP:', error);
      
      if (isFirebaseError(error)) {
        if (error.code === 'auth/invalid-verification-code') {
          throw new Error('รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
        } else if (error.code === 'auth/code-expired') {
          throw new Error('รหัส OTP หมดอายุแล้ว (ใช้เวลาได้ 10 นาที) กรุณาขอรหัสใหม่');
        } else if (error.code === 'auth/session-expired') {
          throw new Error('เซสชันหมดอายุ กรุณาขอรหัส OTP ใหม่');
        } else if (error.code === 'auth/network-request-failed') {
          throw new Error('เกิดข้อผิดพลาดเกี่ยวกับเครือข่าย กรุณาตรวจสอบการเชื่อมต่อและลองใหม่');
        }
      }
      
      // Log unexpected errors
      logger.error('[AuthService] Unexpected error verifying OTP:', error);
      
      throw error;
    }
  }

  /**
   * Reset OTP flow (clear confirmation result and verifier)
   */
  resetOTPFlow(): void {
    if (this.confirmationResult) {
      this.confirmationResult = null;
    }
    if (this.recaptchaVerifier) {
      try {
        this.recaptchaVerifier.clear();
      } catch (error) {
        logger.warn('[AuthService] Error clearing recaptcha verifier:', error);
      }
      this.recaptchaVerifier = null;
    }
    logger.log('[AuthService] OTP flow reset');
  }

  async loginWithEmail(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }


  async checkIsAdmin(uid: string): Promise<boolean> {
    try {
      const { ref, get } = await import('firebase/database');
      const { database } = await import('@/firebase/config');
      const snapshot = await get(ref(database, `admins/${uid}`));
      return snapshot.exists() && snapshot.val() === true;
    } catch (error) {
      logger.error('Error checking admin status:', error);
      return false;
    }
  }

  cleanup(): void {
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    this.subscriptions.clear();
    
    // Clean up reCAPTCHA verifier
    this.resetOTPFlow();
  }
}

