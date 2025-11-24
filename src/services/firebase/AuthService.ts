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
    const sessionStorageAvailable = isSessionStorageAvailable();
    const platform = typeof window !== 'undefined' ? window.navigator.platform : 'unknown';
    const isMobile = /iPhone|iPad|iPod|Android/i.test(platform);
    
    return {
      isInWebView,
      isFacebookWebView: isFacebook,
      sessionStorageAvailable,
      platform,
      isMobile,
      localStorageAvailable: typeof Storage !== 'undefined',
    };
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
    const webViewInfo = this.getWebViewInfo();
    const { isInWebView, isFacebookWebView, sessionStorageAvailable } = webViewInfo;
    const shouldUseRedirect = isFacebookWebView || (isInWebView && !sessionStorageAvailable);

    try {
      if (shouldUseRedirect) {
        await signInWithRedirect(auth, this.googleProvider);
        return;
      }
      await signInWithPopup(auth, this.googleProvider);
    } catch (error: unknown) {
      if (isFirebaseError(error) && (
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request' ||
        error.code === 'auth/operation-not-supported-in-this-environment'
      )) {
        await signInWithRedirect(auth, this.googleProvider);
        return;
      }
      throw error;
    }
  }

  async signInWithFacebook(): Promise<void> {
    const webViewInfo = this.getWebViewInfo();
    const { isInWebView, isFacebookWebView, sessionStorageAvailable } = webViewInfo;
    const shouldUseRedirect = isFacebookWebView || (isInWebView && !sessionStorageAvailable);

    try {
      if (shouldUseRedirect) {
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
      return null;
    } catch (error: unknown) {
      if (isFirebaseError(error) && error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('บัญชีนี้ถูกใช้ด้วย provider อื่นแล้ว');
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
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  cleanup(): void {
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    this.subscriptions.clear();
  }
}

