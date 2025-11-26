/**
 * Auth Service Class
 * Singleton pattern สำหรับจัดการ Authentication operations
 */

import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User,
  getRedirectResult,
  signInWithRedirect,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider
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

const isFacebookWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent || '';
  const facebookWebViewPatterns = [
    /FBAN/i, /FBAV/i, /FB_IAB/i, /FB4A/i, /Messenger/i, /FBMD/i, /FBSV/i,
  ];
  return facebookWebViewPatterns.some(pattern => pattern.test(userAgent));
};

const isInFacebookMessengerWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent || '';
  const messengerPatterns = [
    /FBAN\/Messenger/i,
    /Messenger\/\d+/i,
    /FB_IAB.*Messenger/i,
  ];
  return messengerPatterns.some(pattern => pattern.test(userAgent));
};

const isInInstagramWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent || '';
  const instagramPatterns = [
    /Instagram/i,
    /FB_IAB.*Instagram/i,
    /FBAN\/Instagram/i,
  ];
  return instagramPatterns.some(pattern => pattern.test(userAgent));
};

const isInFacebookAppWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent || '';
  // Facebook App WebView (ไม่ใช่ Messenger)
  const facebookAppPatterns = [
    /FBAN\/FB/i,
    /FB_IAB.*FB/i,
    /FB4A/i,
  ];
  // ตรวจสอบว่าเป็น Facebook App แต่ไม่ใช่ Messenger
  const isFacebookApp = facebookAppPatterns.some(pattern => pattern.test(userAgent));
  const isMessenger = isInFacebookMessengerWebView();
  return isFacebookApp && !isMessenger;
};

const isInInAppBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent || '';
  const inAppPatterns = [
    /FBAN/i, /FBAV/i, /FB_IAB/i, /FB4A/i,
    /Messenger/i, /Instagram/i, /Line/i,
  ];
  return inAppPatterns.some(pattern => pattern.test(userAgent));
};

const isAndroidWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent || '';
  return /wv/i.test(userAgent) && /Android/i.test(userAgent);
};

const isIOSWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent || '';
  return /iPhone|iPad|iPod/i.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
};

const isIOSSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/CriOS|FxiOS|OPiOS|mercury/i.test(userAgent);
  const isStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  // iOS Safari (ไม่ใช่ WebView, ไม่ใช่ Chrome/Firefox/Opera, ไม่ใช่ PWA)
  return isIOS && isSafari && !isStandalone;
};

const isGeneralWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as unknown as { standalone?: boolean; ReactNativeWebView?: unknown };
  return !!(nav.standalone || nav.ReactNativeWebView);
};

const isSessionStorageAvailable = (): boolean => {
  try {
    const test = '__sessionStorage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

export class AuthService {
  private static instance: AuthService;
  private subscriptions: Map<string, () => void> = new Map();
  private googleProvider: GoogleAuthProvider;
  private facebookProvider: FacebookAuthProvider;

  private constructor() {
    this.googleProvider = new GoogleAuthProvider();
    this.facebookProvider = new FacebookAuthProvider();
    
    this.googleProvider.addScope('profile');
    this.googleProvider.addScope('email');
    this.facebookProvider.addScope('email');
    this.facebookProvider.addScope('public_profile');
    this.facebookProvider.setCustomParameters({
      display: 'popup',
      auth_type: 'rerequest',
    });
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  getWebViewInfo() {
    const isInWebView = isFacebookWebView() || isAndroidWebView() || isIOSWebView() || isGeneralWebView();
    const isFacebook = isFacebookWebView();
    const isMessenger = isInFacebookMessengerWebView();
    const isInstagram = isInInstagramWebView();
    const isFacebookApp = isInFacebookAppWebView();
    const sessionStorageAvailable = isSessionStorageAvailable();
    const platform = typeof window !== 'undefined' ? window.navigator.platform : 'unknown';
    const isMobile = /iPhone|iPad|iPod|Android/i.test(platform);
    
    return {
      isInWebView,
      isFacebookWebView: isFacebook,
      isMessengerWebView: isMessenger,
      isInstagramWebView: isInstagram,
      isFacebookAppWebView: isFacebookApp,
      sessionStorageAvailable,
      platform,
      isMobile,
      localStorageAvailable: typeof Storage !== 'undefined',
    };
  }

  /**
   * ตรวจสอบว่าควร block Facebook login หรือไม่
   * Block ใน Messenger, Instagram, Facebook App WebView เพราะ redirect flow ไม่ทำงาน
   */
  shouldBlockFacebookLogin(): boolean {
    const webViewInfo = this.getWebViewInfo();
    // Block Facebook login ใน Messenger, Instagram, Facebook App WebView
    // เพราะ redirect flow ไม่ทำงาน (sessionStorage/cookies ไม่ persist)
    return (
      (webViewInfo.isFacebookWebView && isInFacebookMessengerWebView()) ||
      isInInstagramWebView() ||
      isInFacebookAppWebView()
    );
  }

  /**
   * ตรวจสอบว่าอยู่ใน Instagram WebView หรือไม่
   */
  isInInstagramWebView(): boolean {
    return isInInstagramWebView();
  }

  /**
   * ตรวจสอบว่าอยู่ใน Facebook App WebView หรือไม่ (ไม่ใช่ Messenger)
   */
  isInFacebookAppWebView(): boolean {
    return isInFacebookAppWebView();
  }

  /**
   * ตรวจสอบว่าอยู่ใน in-app browser หรือไม่
   */
  isInInAppBrowser(): boolean {
    return isInInAppBrowser();
  }

  /**
   * ตรวจสอบว่าอยู่ใน Messenger WebView หรือไม่
   */
  isInFacebookMessengerWebView(): boolean {
    return isInFacebookMessengerWebView();
  }

  /**
   * Get URL สำหรับเปิดใน external browser
   */
  getOpenInBrowserUrl(): string {
    if (typeof window === 'undefined') return '';
    return window.location.href;
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

  async signInWithGoogle(): Promise<void> {
    // 🔧 Fix: ใช้ redirect เสมอเพื่อหลีกเลี่ยงปัญหา COOP policy
    // Redirect flow ทำงานได้ดีกว่าบนทุก platform และไม่มีปัญหา COOP
    logger.log('[AuthService] Using redirect flow for Google login (always use redirect)');
    await signInWithRedirect(auth, this.googleProvider);
  }

  async signInWithFacebook(): Promise<void> {
    const webViewInfo = this.getWebViewInfo();
    const { isInWebView, isFacebookWebView, sessionStorageAvailable } = webViewInfo;
    const isIOS = isIOSSafari();
    
    // ไม่ block login แล้ว - ให้ banner เตือนแทน
    // ผู้ใช้สามารถลอง login ได้ แต่ banner จะเตือนว่าอาจไม่สำเร็จ
    
    // ใช้ redirect บน iOS Safari, Facebook WebView, หรือ WebView ที่ไม่มี sessionStorage
    const shouldUseRedirect = isIOS || isFacebookWebView || (isInWebView && !sessionStorageAvailable);

    try {
      if (shouldUseRedirect) {
        // ตรวจสอบ sessionStorage availability ก่อน redirect
        if (!sessionStorageAvailable) {
          logger.warn('[AuthService] SessionStorage ไม่ available - redirect อาจไม่สำเร็จ');
        }
        logger.log('[AuthService] Using redirect flow for Facebook login', { isIOS, isFacebookWebView, isInWebView });
        await signInWithRedirect(auth, this.facebookProvider);
        return;
      }
      await signInWithPopup(auth, this.facebookProvider);
    } catch (error: unknown) {
      if (isFirebaseError(error) && (
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request' ||
        error.code === 'auth/operation-not-supported-in-this-environment'
      )) {
        // Fallback: ใช้ redirect เมื่อ popup ไม่ทำงาน
        // แต่ถ้า sessionStorage ไม่ available → redirect อาจไม่สำเร็จ
        if (!sessionStorageAvailable) {
          logger.warn('[AuthService] Popup ไม่ทำงาน และ sessionStorage ไม่ available - redirect อาจไม่สำเร็จ');
        }
        logger.log('[AuthService] Popup failed, falling back to redirect', { errorCode: error.code });
        await signInWithRedirect(auth, this.facebookProvider);
        return;
      }
      throw error;
    }
  }

  async checkRedirectResult(): Promise<User | null> {
    try {
      const result = await getRedirectResult(auth);
      if (result && result.user) {
        return result.user;
      }
      
      // ตรวจสอบว่า redirect result ไม่สำเร็จใน WebView หรือไม่
      const webViewInfo = this.getWebViewInfo();
      if (webViewInfo.isInWebView && !result) {
        // Log warning เมื่อ detect WebView แต่ redirect result ไม่สำเร็จ
        logger.warn(
          '[AuthService] Redirect result ไม่สำเร็จใน WebView:',
          {
            isFacebookWebView: webViewInfo.isFacebookWebView,
            isInWebView: webViewInfo.isInWebView,
            sessionStorageAvailable: webViewInfo.sessionStorageAvailable,
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
          }
        );
      }
      
      return null;
    } catch (error: unknown) {
      // เพิ่ม error handling สำหรับ WebView scenarios
      if (isFirebaseError(error)) {
        if (error.code === 'auth/account-exists-with-different-credential') {
          throw new Error('บัญชีนี้ถูกใช้ด้วย provider อื่นแล้ว');
        }
        
        // Log error สำหรับ WebView scenarios
        const webViewInfo = this.getWebViewInfo();
        if (webViewInfo.isInWebView) {
          logger.error(
            '[AuthService] Error checking redirect result in WebView:',
            {
              code: error.code,
              message: error.message,
              isFacebookWebView: webViewInfo.isFacebookWebView,
              sessionStorageAvailable: webViewInfo.sessionStorageAvailable,
            }
          );
        }
      }
      throw error;
    }
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
  }
}

