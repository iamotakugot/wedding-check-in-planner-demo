/**
 * Firebase Session Service
 * ฟังก์ชันสำหรับจัดการ Session Management
 */

import { ref, get, set, update, onValue, DataSnapshot, onDisconnect } from 'firebase/database';
import { database } from '@/firebase/config';
import { User } from 'firebase/auth';
// checkIsAdmin not needed in sessions.ts

// Refs
export const userSessionsRef = (uid: string) => ref(database, `userSessions/${uid}`);
export const userSessionIsOnlineRef = (uid: string) => ref(database, `userSessions/${uid}/isOnline`);
export const userSessionStartedAtRef = (uid: string) => ref(database, `userSessions/${uid}/startedAt`);

export const adminSessionsRef = (uid: string) => ref(database, `adminSessions/${uid}`);
export const adminSessionIsOnlineRef = (uid: string) => ref(database, `adminSessions/${uid}/isOnline`);
export const adminSessionStartedAtRef = (uid: string) => ref(database, `adminSessions/${uid}/startedAt`);

// Session operations
export const registerSession = async (user: User, isAdmin: boolean = false): Promise<void> => {
  const uid = user.uid;
  const startedAt = new Date().toISOString();
  
  const sessionRef = isAdmin ? adminSessionsRef(uid) : userSessionsRef(uid);
  const isOnlineRef = isAdmin ? adminSessionIsOnlineRef(uid) : userSessionIsOnlineRef(uid);
  
  await update(sessionRef, {
    isOnline: 1,
    startedAt: startedAt,
  });
  
  await onDisconnect(isOnlineRef).set(0);
};

export const getIsOnline = async (uid: string, isAdmin: boolean = false): Promise<boolean> => {
  try {
    const isOnlineRef = isAdmin ? adminSessionIsOnlineRef(uid) : userSessionIsOnlineRef(uid);
    const snapshot = await get(isOnlineRef);
    if (!snapshot.exists()) return false;
    return snapshot.val() === 1;
  } catch (error) {
    console.error('Error getting isOnline:', error);
    return false;
  }
};

export const getSessionInfo = async (uid: string, isAdmin: boolean = false): Promise<{ isOnline: boolean; startedAt?: string } | null> => {
  try {
    const isOnlineRef = isAdmin ? adminSessionIsOnlineRef(uid) : userSessionIsOnlineRef(uid);
    const startedAtRef = isAdmin ? adminSessionStartedAtRef(uid) : userSessionStartedAtRef(uid);
    
    const [isOnlineSnapshot, startedAtSnapshot] = await Promise.all([
      get(isOnlineRef),
      get(startedAtRef),
    ]);
    
    if (!isOnlineSnapshot.exists()) return null;
    
    return {
      isOnline: isOnlineSnapshot.val() === 1,
      startedAt: startedAtSnapshot.exists() ? startedAtSnapshot.val() : undefined,
    };
  } catch (error) {
    console.error('Error getting session info:', error);
    return null;
  }
};

export const endSession = async (uid: string, isAdmin: boolean = false): Promise<void> => {
  const isOnlineRef = isAdmin ? adminSessionIsOnlineRef(uid) : userSessionIsOnlineRef(uid);
  await set(isOnlineRef, 0);
};

export const subscribeSessionChanges = (
  uid: string,
  callback: (isOnline: boolean) => void,
  isAdmin: boolean = false
): (() => void) => {
  const isOnlineRef = isAdmin ? adminSessionIsOnlineRef(uid) : userSessionIsOnlineRef(uid);
  const unsubscribe = onValue(isOnlineRef, (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) {
      callback(false);
      return;
    }
    callback(snapshot.val() === 1);
  });
  return unsubscribe;
};

