/**
 * Firebase App State Service
 * ฟังก์ชันสำหรับจัดการ App State (User และ Admin)
 */

import { ref, get, update, onValue, DataSnapshot } from 'firebase/database';
import { database } from '@/firebase/config';
import { AuthService } from './AuthService';

// Types
export interface UserAppState {
  isFlipped?: boolean;
  musicPlaying?: boolean;
  hasStarted?: boolean;
  currentTrackIndex?: number;
  updatedAt?: string;
}

export interface AdminAppState {
  currentView?: string;
  updatedAt?: string;
}

// Refs
export const userAppStateRef = (uid: string) => ref(database, `userAppState/${uid}`);
export const adminAppStateRef = (uid: string) => ref(database, `adminAppState/${uid}`);

// User App State operations
export const getUserAppState = async (uid: string): Promise<UserAppState | null> => {
  try {
    const snapshot = await get(userAppStateRef(uid));
    if (!snapshot.exists()) return null;
    return snapshot.val();
  } catch (error) {
    console.error('Error getting user app state:', error);
    return null;
  }
};

export const updateUserAppState = async (uid: string, updates: Partial<UserAppState>): Promise<void> => {
  const user = AuthService.getInstance().getCurrentUser();
  if (!user || user.uid !== uid) {
    throw new Error('ไม่มีสิทธิ์แก้ไข state ของ user อื่น');
  }
  
  const cleanUpdates: Record<string, unknown> = {};
  Object.keys(updates).forEach(key => {
    const value = (updates as Record<string, unknown>)[key];
    if (value !== undefined) {
      cleanUpdates[key] = value;
    }
  });
  
  await update(userAppStateRef(uid), {
    ...cleanUpdates,
    updatedAt: new Date().toISOString(),
  });
};

export const subscribeUserAppState = (
  uid: string,
  callback: (state: UserAppState | null) => void
): (() => void) => {
  const unsubscribe = onValue(userAppStateRef(uid), (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback(snapshot.val());
  });
  return unsubscribe;
};

// Admin App State operations
export const getAdminAppState = async (uid: string): Promise<AdminAppState | null> => {
  try {
    const snapshot = await get(adminAppStateRef(uid));
    if (!snapshot.exists()) return null;
    return snapshot.val();
  } catch (error) {
    console.error('Error getting admin app state:', error);
    return null;
  }
};

export const updateAdminAppState = async (uid: string, updates: Partial<AdminAppState>): Promise<void> => {
  const user = AuthService.getInstance().getCurrentUser();
  if (!user || user.uid !== uid) {
    throw new Error('ไม่มีสิทธิ์แก้ไข state ของ admin อื่น');
  }
  const isAdmin = await AuthService.getInstance().checkIsAdmin(uid);
  if (!isAdmin) {
    throw new Error('ไม่มีสิทธิ์เข้าถึง Admin App State');
  }
  
  const cleanUpdates: Record<string, unknown> = {};
  Object.keys(updates).forEach(key => {
    const value = (updates as Record<string, unknown>)[key];
    if (value !== undefined) {
      cleanUpdates[key] = value;
    }
  });
  
  await update(adminAppStateRef(uid), {
    ...cleanUpdates,
    updatedAt: new Date().toISOString(),
  });
};

export const subscribeAdminAppState = (
  uid: string,
  callback: (state: AdminAppState | null) => void
): (() => void) => {
  const unsubscribe = onValue(adminAppStateRef(uid), (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback(snapshot.val());
  });
  return unsubscribe;
};

