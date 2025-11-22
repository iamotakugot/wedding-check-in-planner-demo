/* eslint-disable security/detect-object-injection */
import { ref, get, set, push, update, remove, onValue, DataSnapshot, onDisconnect } from 'firebase/database';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User,
  signInWithRedirect,
  getRedirectResult,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider
} from 'firebase/auth';
import { database, auth } from '@/firebase/config';
import { Guest, Zone, TableData } from '@/types';

// ============================================================================
// GUESTS
// ============================================================================

export const guestsRef = () => ref(database, 'guests');

export const getGuests = async (): Promise<Guest[]> => {
  const snapshot = await get(guestsRef());
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.keys(data).map(key => ({ id: key, ...data[key] }));
};

export const getGuest = async (id: string): Promise<Guest | null> => {
  const snapshot = await get(ref(database, `guests/${id}`));
  if (!snapshot.exists()) return null;
  return { id, ...snapshot.val() };
};

export const createGuest = async (guest: Guest): Promise<void> => {
  await requireAdmin();
  await set(ref(database, `guests/${guest.id}`), guest);
};

export const updateGuest = async (id: string, updates: Partial<Guest>): Promise<void> => {
  await requireAdmin();
  await update(ref(database, `guests/${id}`), updates);
};

export const deleteGuest = async (id: string): Promise<void> => {
  await requireAdmin();
  await remove(ref(database, `guests/${id}`));
};

// ============================================================================
// GUEST FUNCTIONS FOR RSVP FLOW (ไม่ต้อง requireAdmin)
// ============================================================================

/**
 * สร้าง Guest จาก RSVP flow (แขกทั่วไปสามารถใช้ได้)
 * จะเพิ่ม rsvpUid เพื่อติดตามว่าใครสร้าง
 */
export const createGuestFromRSVP = async (guest: Guest, rsvpUid: string): Promise<void> => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('ต้องเข้าสู่ระบบก่อน');
  }
  if (user.uid !== rsvpUid) {
    throw new Error('ไม่สามารถสร้าง Guest สำหรับ RSVP ของผู้อื่นได้');
  }
  // เพิ่ม rsvpUid เพื่อติดตาม
  const guestWithRsvpUid = { ...guest, rsvpUid };
  await set(ref(database, `guests/${guest.id}`), guestWithRsvpUid);
};

/**
 * แก้ไข Guest จาก RSVP flow (แขกทั่วไปสามารถใช้ได้)
 * ตรวจสอบว่า user ที่ login ตรงกับ rsvpUid ของ Guest หรือไม่
 */
export const updateGuestFromRSVP = async (id: string, updates: Partial<Guest>, rsvpUid: string): Promise<void> => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('ต้องเข้าสู่ระบบก่อน');
  }
  if (user.uid !== rsvpUid) {
    throw new Error('ไม่สามารถแก้ไข Guest ของผู้อื่นได้');
  }
  
  // ตรวจสอบว่า Guest มี rsvpUid และตรงกับ rsvpUid ที่ส่งมาหรือไม่
  const existingGuest = await getGuest(id);
  if (!existingGuest) {
    throw new Error('ไม่พบ Guest ที่ต้องการแก้ไข');
  }
  
  // ถ้า Guest ถูกสร้างโดย admin (ไม่มี rsvpUid) แขกไม่สามารถแก้ไขได้
  if (existingGuest.rsvpUid && existingGuest.rsvpUid !== rsvpUid) {
    throw new Error('ไม่สามารถแก้ไข Guest ของผู้อื่นได้');
  }
  
  // ถ้า Guest ถูกสร้างโดย admin (ไม่มี rsvpUid) แขกไม่สามารถแก้ไขได้
  if (!existingGuest.rsvpUid) {
    throw new Error('ไม่สามารถแก้ไข Guest ที่ถูกสร้างโดย Admin ได้');
  }
  
  await update(ref(database, `guests/${id}`), { ...updates, updatedAt: new Date().toISOString() });
};

export const subscribeGuests = (callback: (guests: Guest[]) => void): () => void => {
  const unsubscribe = onValue(guestsRef(), (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const guests = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    callback(guests);
  });
  return unsubscribe;
};

// ============================================================================
// ZONES
// ============================================================================

export const zonesRef = () => ref(database, 'zones');

export const getZones = async (): Promise<Zone[]> => {
  const snapshot = await get(zonesRef());
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.keys(data).map(key => ({ id: key, ...data[key] }));
};

export const createZone = async (zone: Zone): Promise<void> => {
  await requireAdmin();
  await set(ref(database, `zones/${zone.id}`), zone);
};

export const updateZone = async (id: string, updates: Partial<Zone>): Promise<void> => {
  await requireAdmin();
  await update(ref(database, `zones/${id}`), updates);
};

export const deleteZone = async (id: string): Promise<void> => {
  await requireAdmin();
  await remove(ref(database, `zones/${id}`));
};

export const subscribeZones = (callback: (zones: Zone[]) => void): () => void => {
  const unsubscribe = onValue(zonesRef(), (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const zones = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    callback(zones);
  });
  return unsubscribe;
};

// ============================================================================
// TABLES
// ============================================================================

export const tablesRef = () => ref(database, 'tables');

export const getTables = async (): Promise<TableData[]> => {
  const snapshot = await get(tablesRef());
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.keys(data).map(key => ({ id: key, ...data[key] }));
};

export const createTable = async (table: TableData): Promise<void> => {
  await requireAdmin();
  await set(ref(database, `tables/${table.id}`), table);
};

export const updateTable = async (id: string, updates: Partial<TableData>): Promise<void> => {
  await requireAdmin();
  await update(ref(database, `tables/${id}`), updates);
};

export const deleteTable = async (id: string): Promise<void> => {
  await requireAdmin();
  await remove(ref(database, `tables/${id}`));
};

export const subscribeTables = (callback: (tables: TableData[]) => void): () => void => {
  const unsubscribe = onValue(tablesRef(), (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const tables = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    callback(tables);
  });
  return unsubscribe;
};

// ============================================================================
// RSVP
// ============================================================================

export interface RSVPData {
  id?: string;
  uid?: string;
  firstName: string;
  lastName: string;
  fullName?: string; // เพิ่ม field สำหรับเก็บชื่อ-นามสกุลรวมกัน
  photoURL?: string | null; // เพิ่ม field สำหรับเก็บ URL ภาพจาก Facebook/Google
  nickname: string;
  isComing: 'yes' | 'no';
  side: 'groom' | 'bride';
  relation: string;
  note: string;
  accompanyingGuestsCount: number;
  accompanyingGuests: { name: string; relationToMain: string }[];
  guestId?: string | null; // Link to Guest if exists
  createdAt: string;
  updatedAt: string;
}

export const rsvpsRef = () => ref(database, 'rsvps');

export const createRSVP = async (rsvp: Omit<RSVPData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    // ตรวจสอบว่า user login แล้วหรือไม่
    const user = getCurrentUser();
    if (!user) {
      console.error('No user logged in when creating RSVP');
      throw new Error('ต้องเข้าสู่ระบบก่อนบันทึกข้อมูล RSVP');
    }

    console.log('Current user:', { uid: user.uid, email: user.email, providerId: user.providerData?.[0]?.providerId });

    // ตรวจสอบว่า rsvp.uid ตรงกับ user.uid หรือไม่
    if (rsvp.uid && rsvp.uid !== user.uid) {
      console.warn('RSVP UID does not match current user UID. Using current user UID.');
    }

    // ใช้ currentUser.uid แทน rsvp.uid เพื่อความปลอดภัย
    const rsvpWithUid = {
      ...rsvp,
      uid: user.uid, // ใช้ uid จาก currentUser เสมอ
    };

    const newRef = push(rsvpsRef());
    const now = new Date().toISOString();
    const rsvpData: RSVPData = {
      ...rsvpWithUid,
      id: newRef.key!,
      createdAt: now,
      updatedAt: now,
    };
    
    // Remove undefined fields ก่อนบันทึก (Firebase ไม่ยอมรับ undefined)
    Object.keys(rsvpData).forEach(key => {
      if ((rsvpData as any)[key] === undefined) {
        delete (rsvpData as any)[key];
      }
    });
    
    console.log('Creating RSVP with data:', JSON.stringify(rsvpData, null, 2));
    console.log('RSVP path:', `rsvps/${newRef.key}`);
    console.log('User UID:', user.uid);
    console.log('Auth state check: auth != null should be true');
    
    try {
      await set(newRef, rsvpData);
      console.log('✅ RSVP created successfully with ID:', newRef.key);
      return newRef.key!;
    } catch (firebaseError: any) {
      console.error('❌ Firebase error when creating RSVP:', firebaseError);
      console.error('Error code:', firebaseError.code);
      console.error('Error message:', firebaseError.message);
      
      if (firebaseError.code === 'PERMISSION_DENIED' || firebaseError.code === 'PERMISSION_DENIED') {
        console.error('PERMISSION_DENIED - Rules may be blocking write access');
        console.error('Current user UID:', user.uid);
        console.error('Rules should allow: auth != null && user is logged in');
        throw new Error('ไม่มีสิทธิ์ในการบันทึกข้อมูล RSVP กรุณาตรวจสอบ Firebase Rules และ Authentication state');
      }
      throw firebaseError;
    }
  } catch (error: any) {
    console.error('Error creating RSVP:', error);
    if (error.code === 'PERMISSION_DENIED' || error.code === 'PERMISSION_DENIED') {
      throw new Error('ไม่มีสิทธิ์ในการบันทึกข้อมูล RSVP กรุณาตรวจสอบ Firebase Rules');
    }
    throw error;
  }
};

export const getRSVPs = async (): Promise<RSVPData[]> => {
  const snapshot = await get(rsvpsRef());
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.keys(data).map(key => {
    const rsvp = { id: key, ...data[key] };
    // ลบ phoneNumber ออกถ้ามี (สำหรับข้อมูลเก่า)
    if ('phoneNumber' in rsvp) {
      delete (rsvp as Record<string, unknown>).phoneNumber;
    }
    return rsvp;
  });
};

export const getRSVPByUid = async (_uid?: string): Promise<RSVPData | null> => {
  try {
    // ตรวจสอบว่า user login แล้วหรือไม่
    const user = getCurrentUser();
    if (!user) {
      console.warn('No user logged in when fetching RSVP');
      return null;
    }

    // ใช้ uid จาก currentUser เสมอเพื่อความปลอดภัย (ไม่ใช้ parameter)
    const targetUid = user.uid;
    
    console.log('Fetching RSVP for UID:', targetUid);
    
    const snapshot = await get(rsvpsRef());
    if (!snapshot.exists()) {
      console.log('No RSVPs found in database');
      return null;
    }
    
    const data = snapshot.val();
    const rsvps = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    
    // Find the most recent RSVP for this user (in case there are multiple)
    const userRSVPs = rsvps.filter(r => r.uid === targetUid);
    
    if (userRSVPs.length === 0) {
      console.log('No RSVP found for user UID:', targetUid);
      return null;
    }
    
    // Return the most recent one (by updatedAt or createdAt)
    const mostRecent = userRSVPs.sort((a, b) => {
      const aTime = a.updatedAt || a.createdAt || '';
      const bTime = b.updatedAt || b.createdAt || '';
      return bTime.localeCompare(aTime);
    })[0];
    
    // ลบ phoneNumber ออกถ้ามี (สำหรับข้อมูลเก่า)
    if ('phoneNumber' in mostRecent) {
      delete (mostRecent as Record<string, unknown>).phoneNumber;
    }
    
    console.log('RSVP found for user:', mostRecent.id);
    return mostRecent;
  } catch (error: any) {
    console.error('Error fetching RSVP by UID:', error);
    if (error.code === 'PERMISSION_DENIED') {
      console.error('Permission denied when fetching RSVP. Check Firebase Rules.');
    }
    throw error;
  }
};

export const subscribeRSVPs = (callback: (rsvps: RSVPData[]) => void): () => void => {
  const unsubscribe = onValue(rsvpsRef(), (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const rsvps = Object.keys(data).map(key => {
      const rsvp = { id: key, ...data[key] };
      // ลบ phoneNumber ออกถ้ามี (สำหรับข้อมูลเก่า)
      if ('phoneNumber' in rsvp) {
        delete (rsvp as Record<string, unknown>).phoneNumber;
      }
      return rsvp;
    });
    callback(rsvps);
  });
  return unsubscribe;
};

export const updateRSVP = async (id: string, updates: Partial<RSVPData>): Promise<void> => {
  try {
    // ตรวจสอบว่า user login แล้วหรือไม่
    const user = getCurrentUser();
    if (!user) {
      console.error('No user logged in when updating RSVP');
      throw new Error('ต้องเข้าสู่ระบบก่อนแก้ไขข้อมูล RSVP');
    }

    console.log('Current user:', { uid: user.uid, email: user.email, providerId: user.providerData?.[0]?.providerId });

    // ตรวจสอบว่า updates.uid ตรงกับ user.uid หรือไม่
    if (updates.uid && updates.uid !== user.uid) {
      console.warn('Update UID does not match current user UID. Using current user UID.');
      updates.uid = user.uid; // ใช้ uid จาก currentUser เสมอ
    }

    // Remove undefined fields ก่อนบันทึก
    Object.keys(updates).forEach(key => {
      if ((updates as any)[key] === undefined) {
        delete (updates as any)[key];
      }
    });

    const updateData = { 
      ...updates, 
      uid: user.uid, // ใช้ uid จาก currentUser เสมอ
      updatedAt: new Date().toISOString() 
    };

    console.log('Updating RSVP with ID:', id);
    console.log('Update data:', JSON.stringify(updateData, null, 2));
    console.log('RSVP path:', `rsvps/${id}`);
    console.log('User UID:', user.uid);
    console.log('Auth state check: auth != null should be true');
    
    try {
      await update(ref(database, `rsvps/${id}`), updateData);
      console.log('✅ RSVP updated successfully');
    } catch (firebaseError: any) {
      console.error('❌ Firebase error when updating RSVP:', firebaseError);
      console.error('Error code:', firebaseError.code);
      console.error('Error message:', firebaseError.message);
      
      if (firebaseError.code === 'PERMISSION_DENIED' || firebaseError.code === 'PERMISSION_DENIED') {
        console.error('PERMISSION_DENIED - Rules may be blocking write access');
        console.error('Current user UID:', user.uid);
        console.error('Rules should allow: auth != null && user is logged in');
        throw new Error('ไม่มีสิทธิ์ในการแก้ไขข้อมูล RSVP กรุณาตรวจสอบ Firebase Rules และ Authentication state');
      }
      throw firebaseError;
    }
  } catch (error: any) {
    console.error('Error updating RSVP:', error);
    if (error.code === 'PERMISSION_DENIED' || error.code === 'PERMISSION_DENIED') {
      throw new Error('ไม่มีสิทธิ์ในการแก้ไขข้อมูล RSVP กรุณาตรวจสอบ Firebase Rules');
    }
    throw error;
  }
};

// ============================================================================
// WEDDING CONFIG
// ============================================================================

export interface WeddingConfig {
  inviteLink: string;
  weddingDate: string;
  groomName: string;
  brideName: string;
  venue: string;
  venueMapLink?: string;
}

export const configRef = () => ref(database, 'config');

export const getConfig = async (): Promise<WeddingConfig | null> => {
  const snapshot = await get(configRef());
  if (!snapshot.exists()) return null;
  return snapshot.val();
};

export const updateConfig = async (config: Partial<WeddingConfig>): Promise<void> => {
  await requireAdmin();
  await update(configRef(), config);
};

// ============================================================================
// ADMIN AUTHENTICATION & AUTHORIZATION
// ============================================================================

/**
 * ตรวจสอบว่า user ปัจจุบันเป็น admin หรือไม่
 * โดยตรวจสอบจาก /admins/{uid} ใน database
 */
export const checkIsAdmin = async (uid: string): Promise<boolean> => {
  try {
    const snapshot = await get(ref(database, `admins/${uid}`));
    return snapshot.exists() && snapshot.val() === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * ตรวจสอบว่า user ปัจจุบันเป็น admin ก่อนทำการเขียนข้อมูล
 * ถ้าไม่ใช่ admin จะ throw error
 */
const requireAdmin = async (): Promise<void> => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('ต้องเข้าสู่ระบบก่อน');
  }
  const isAdmin = await checkIsAdmin(user.uid);
  if (!isAdmin) {
    throw new Error('ไม่มีสิทธิ์เข้าถึง - เฉพาะ Admin เท่านั้น');
  }
};

// ============================================================================
// INITIAL DATA MIGRATION
// ============================================================================

export const migrateInitialData = async (
  guests: Guest[],
  zones: Zone[],
  tables: TableData[]
): Promise<void> => {
  // Check if data already exists
  const guestsSnapshot = await get(guestsRef());
  if (guestsSnapshot.exists()) {
    return;
  }

  // Migrate guests
  for (const guest of guests) {
    await createGuest(guest);
  }

  // Migrate zones
  for (const zone of zones) {
    await createZone(zone);
  }

  // Migrate tables
  for (const table of tables) {
    await createTable(table);
  }

  // Set default config
  await updateConfig({
    inviteLink: 'https://wedding-planner.app/rsvp/got-nan-2026',
    weddingDate: '2026-01-31',
    groomName: 'Got (Pattarapong)',
    brideName: 'Nan (Supanee)',
    venue: 'เรือนชมมณี นครราชสีมา',
    venueMapLink: 'https://maps.app.goo.gl/VT1SNFGHSdY7kW9UA',
  });
};

// ============================================================================
// FIREBASE AUTHENTICATION
// ============================================================================

export const loginWithEmail = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const onAuthStateChange = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

// ============================================================================
// HELPER FUNCTIONS - WebView Detection
// ============================================================================

/**
 * ตรวจสอบว่าอยู่ใน webview environment หรือไม่
 * เช่น LINE, Facebook Messenger, Instagram, Twitter ฯลฯ
 */
const isInWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent || '';
  const webViewPatterns = [
    /FBAN|FBAV/i,           // Facebook
    /Line/i,                // LINE
    /Instagram/i,           // Instagram
    /Twitter/i,             // Twitter/X
    /LinkedInApp/i,         // LinkedIn
    /wv/i,                  // Android WebView
    /Mobile.*Safari/i       // iOS WebView (บางกรณี)
  ];
  
  return webViewPatterns.some(pattern => pattern.test(userAgent));
};

/**
 * ตรวจสอบว่า sessionStorage สามารถใช้งานได้หรือไม่
 */
const isSessionStorageAvailable = (): boolean => {
  try {
    const testKey = '__sessionStorage_test__';
    sessionStorage.setItem(testKey, 'test');
    sessionStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Social Authentication
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Configure providers
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Add scopes if needed
googleProvider.addScope('profile');
googleProvider.addScope('email');
facebookProvider.addScope('email');
facebookProvider.setCustomParameters({
  display: 'popup',
});

export const signInWithGoogle = async (): Promise<void> => {
  // Google: ใช้ redirect เลยเพื่อให้เด้งออกไป browser ภายนอก
  // เพราะ Google popup มักมีปัญหาใน webview (LINE, Messenger ฯลฯ)
  // และ redirect จะทำให้เด้งออกไป browser ที่ใช้งานได้ดีกว่า
  try {
    // ใช้ redirect โดยตรง - จะเด้งออกไป browser ภายนอก
    await signInWithRedirect(auth, googleProvider);
    // หน้าเพจจะ redirect ไป Google และกลับมาหลัง login สำเร็จ
    return;
  } catch (error: any) {
    // ถ้า redirect ล้มเหลวเพราะ sessionStorage ให้ลอง popup
    if (error.message?.includes('sessionStorage') || 
        error.message?.includes('initial state') ||
        error.message?.includes('missing initial state')) {
      console.warn('Redirect failed, trying popup instead...');
      try {
        await signInWithPopup(auth, googleProvider);
        return;
      } catch (popupError: any) {
        // ถ้า popup ก็ไม่ได้ ให้ throw error
        throw new Error('ไม่สามารถเข้าสู่ระบบได้ กรุณาลองเปิดในเบราว์เซอร์ภายนอก (Chrome, Safari)');
      }
    }
    throw error;
  }
};

export const signInWithFacebook = async (): Promise<void> => {
  // Facebook: พยายามใช้ popup ก่อน (ทำงานได้ดีใน Messenger)
  // ถ้าไม่ได้ค่อย fallback เป็น redirect (จะเด้งออกไป browser)
  const inWebView = isInWebView();
  const sessionStorageAvailable = isSessionStorageAvailable();
  
  // ถ้า sessionStorage ไม่ได้และอยู่ใน webview ให้ใช้ popup เท่านั้น
  if (!sessionStorageAvailable && inWebView) {
    try {
      await signInWithPopup(auth, facebookProvider);
      return;
    } catch (error: any) {
      // ถ้า popup ถูกบล็อก ให้แนะนำผู้ใช้
      if (error.code === 'auth/popup-blocked') {
        throw new Error('กรุณาอนุญาตป๊อปอัป หรือกดปุ่ม "เปิดในเบราว์เซอร์" เพื่อเข้าสู่ระบบ');
      }
      throw error;
    }
  }
  
  // ถ้า sessionStorage ได้ ให้ลอง popup ก่อน
  try {
    await signInWithPopup(auth, facebookProvider);
    return;
  } catch (error: any) {
    // Fallback เป็น redirect สำหรับกรณี popup ถูกบล็อกหรือ environment ไม่รองรับ
    const fallbackCodes = new Set([
      'auth/popup-blocked',
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/operation-not-supported-in-this-environment',
    ]);
    
    if (error && error.code && fallbackCodes.has(error.code)) {
      try {
        // ใช้ redirect - จะเด้งออกไป browser ภายนอก
        await signInWithRedirect(auth, facebookProvider);
        return;
      } catch (redirectError: any) {
        // ถ้า redirect ล้มเหลวเพราะ sessionStorage
        if (redirectError.message?.includes('sessionStorage') || 
            redirectError.message?.includes('initial state') ||
            redirectError.message?.includes('missing initial state')) {
          throw new Error('กรุณากดปุ่ม "เปิดในเบราว์เซอร์" เพื่อเข้าสู่ระบบ (Chrome, Safari)');
        }
        throw redirectError;
      }
    }
    throw error;
  }
};

// Check for redirect result on page load
// ต้องเรียกฟังก์ชันนี้ทันทีหลังจาก page load เพื่อเช็คว่าการ redirect สำเร็จหรือไม่
// ควรเรียกก่อน onAuthStateChanged เพื่อให้ได้รับผลลัพธ์จาก redirect
// ตามมาตรฐาน Firebase Auth: https://firebase.google.com/docs/auth/web/facebook-login
export const checkRedirectResult = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // User successfully signed in via redirect
      return result.user;
    }
    // No redirect result - user didn't come from a redirect
    return null;
  } catch (error: any) {
    // 🔧 IMPORTANT: Handle critical errors - re-throw เพื่อให้ component จัดการ
    if (error.code === 'auth/account-exists-with-different-credential') {
      console.error('An account already exists with the same email address but different sign-in credentials');
      throw error; // Re-throw เพื่อให้ component จัดการ
    }
    if (error.code === 'auth/email-already-in-use') {
      console.error('The email address is already in use by another account');
      throw error; // Re-throw เพื่อให้ component จัดการ
    }
    
    // 🔧 สำหรับ WebView (Messenger) - sessionStorage อาจจะไม่ได้
    // ไม่ควร throw error เพื่อให้ระบบทำงานต่อ (onAuthStateChanged จะจัดการ)
    if (error.message?.includes('sessionStorage') || 
        error.message?.includes('initial state') ||
        error.message?.includes('missing initial state')) {
      console.warn('SessionStorage error during redirect - this may happen in webview, continuing...');
      // Return null เพื่อให้ระบบทำงานต่อ (onAuthStateChanged จะจัดการต่อ)
      return null;
    }
    
    // 🔧 สำหรับ error อื่นๆ - return null แทน throw เพื่อไม่ให้ block UI
    // onAuthStateChanged จะจัดการต่อ
    console.warn('Error checking redirect result:', error);
    return null;
  }
};

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export const userSessionsRef = (uid: string) => ref(database, `userSessions/${uid}`);
export const userSessionIsOnlineRef = (uid: string) => ref(database, `userSessions/${uid}/isOnline`);
export const userSessionStartedAtRef = (uid: string) => ref(database, `userSessions/${uid}/startedAt`);

/**
 * สร้าง session ใหม่หลังจาก login สำเร็จ
 * จะเช็คว่ามี session อื่น active อยู่หรือไม่ (เช็ค isOnline === 1)
 */
export const registerSession = async (user: User): Promise<{ hasOtherActiveSession: boolean; otherSessionStartedAt?: string; startedAt: string }> => {
  const uid = user.uid;
  const startedAt = new Date().toISOString();
  
  // เช็คว่ามี session อื่น active อยู่หรือไม่ (isOnline === 1)
  const isOnline = await getIsOnline(uid);
  let otherSessionStartedAt: string | undefined;
  
  if (isOnline) {
    // มี session อื่น active อยู่ - ดึงเวลาเริ่มต้นของ session อื่น
    const sessionInfo = await getSessionInfo(uid);
    otherSessionStartedAt = sessionInfo?.startedAt;
    
    // ใช้ atomic update เพื่อ set ทั้ง isOnline และ startedAt พร้อมกัน
    // ไม่ต้อง set isOnline = 0 ก่อน เพื่อป้องกัน session อื่น logout โดยไม่ตั้งใจ
    // Session listener จะเช็ค startedAt เปลี่ยนหรือไม่เพื่อตรวจจับการยึด session
    const sessionRef = userSessionsRef(uid);
    await update(sessionRef, {
      isOnline: 1,
      startedAt: startedAt,
    });
    
    // ตั้งค่า onDisconnect เพื่อ set isOnline = 0 เมื่อแท็บปิด
    // await เพื่อให้แน่ใจว่า server ได้รับการยืนยันและจัดการ error ได้
    const isOnlineRef = userSessionIsOnlineRef(uid);
    await onDisconnect(isOnlineRef).set(0);
    
    return {
      hasOtherActiveSession: true,
      otherSessionStartedAt,
      startedAt,
    };
  }
  
  // ไม่มี session อื่น active อยู่ - ใช้ atomic update เพื่อ set ทั้ง isOnline และ startedAt พร้อมกัน
  const sessionRef = userSessionsRef(uid);
  await update(sessionRef, {
    isOnline: 1,
    startedAt: startedAt,
  });
  
  // ตั้งค่า onDisconnect เพื่อ set isOnline = 0 เมื่อแท็บปิด
  // await เพื่อให้แน่ใจว่า server ได้รับการยืนยันและจัดการ error ได้
  const isOnlineRef = userSessionIsOnlineRef(uid);
  await onDisconnect(isOnlineRef).set(0);
  
  return {
    hasOtherActiveSession: false,
    startedAt,
  };
};

/**
 * เช็คว่ามี session active อยู่หรือไม่ (isOnline === 1)
 */
export const getIsOnline = async (uid: string): Promise<boolean> => {
  try {
    const snapshot = await get(userSessionIsOnlineRef(uid));
    if (!snapshot.exists()) return false;
    return snapshot.val() === 1;
  } catch (error) {
    console.error('Error getting isOnline:', error);
    return false;
  }
};

/**
 * ดึงข้อมูล session (isOnline และ startedAt)
 */
export const getSessionInfo = async (uid: string): Promise<{ isOnline: boolean; startedAt?: string } | null> => {
  try {
    const [isOnlineSnapshot, startedAtSnapshot] = await Promise.all([
      get(userSessionIsOnlineRef(uid)),
      get(userSessionStartedAtRef(uid)),
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

/**
 * ปิด session (set isOnline = 0)
 * ใช้เมื่อ logout หรือเมื่อต้องการปิด session
 */
export const endSession = async (uid: string): Promise<void> => {
  const isOnlineRef = userSessionIsOnlineRef(uid);
  await set(isOnlineRef, 0);
  // ไม่ต้องลบ startedAt เพื่อเก็บประวัติ
};

/**
 * เตะ session อื่นออก (set isOnline = 0)
 */
export const forceEndSession = async (uid: string): Promise<void> => {
  await endSession(uid);
};

/**
 * Subscribe เพื่อเช็คว่า session ถูกปิดหรือไม่ (ถูกเตะออก)
 * จะ subscribe ทั้ง isOnline และ startedAt เพื่อตรวจจับการยึด session
 * - ถ้า isOnline === 0 → logout (logout จริงๆ)
 * - ถ้า startedAt เปลี่ยน → session ถูกยึด (ต้อง logout)
 */
export const subscribeSessionChanges = (
  uid: string,
  callback: (isOnline: boolean, startedAt?: string) => void
): (() => void) => {
  const sessionRef = userSessionsRef(uid);
  
  const unsubscribe = onValue(sessionRef, (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) {
      // session ไม่มีค่า → ถูกลงชื่อออก
      callback(false);
      return;
    }
    
    const data = snapshot.val();
    const isOnline = data?.isOnline === 1;
    const startedAt = data?.startedAt;
    
    // ถ้า isOnline === 0 → ถูกลงชื่อออก (logout จริงๆ)
    if (!isOnline) {
      callback(false, startedAt);
      return;
    }
    
    // isOnline === 1 → ยัง active อยู่ (แต่ต้องเช็ค startedAt ใน component ว่าเปลี่ยนหรือไม่)
    callback(true, startedAt);
  });
  
  return unsubscribe;
};

// ============================================================================
// USER APP STATE (สำหรับ Guest RSVP App)
// ============================================================================

export const userAppStateRef = (uid: string) => ref(database, `userAppState/${uid}`);

export interface UserAppState {
  isFlipped?: boolean;
  musicPlaying?: boolean;
  hasStarted?: boolean;
  currentTrackIndex?: number;
  updatedAt?: string;
}

/**
 * ดึงข้อมูล app state ของ user จาก Firebase Realtime Database
 */
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

/**
 * อัพเดท app state ของ user ใน Firebase Realtime Database
 */
export const updateUserAppState = async (uid: string, updates: Partial<UserAppState>): Promise<void> => {
  try {
    const user = getCurrentUser();
    if (!user || user.uid !== uid) {
      throw new Error('ไม่มีสิทธิ์แก้ไข state ของ user อื่น');
    }
    
    // Remove undefined fields ก่อนบันทึก
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
  } catch (error) {
    console.error('Error updating user app state:', error);
    throw error;
  }
};

/**
 * Subscribe เพื่อรับการเปลี่ยนแปลง app state ของ user แบบ real-time
 */
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

// ============================================================================
// ADMIN APP STATE (สำหรับ Admin Panel)
// ============================================================================

export const adminAppStateRef = (uid: string) => ref(database, `adminAppState/${uid}`);

export interface AdminAppState {
  currentView?: string;
  updatedAt?: string;
}

/**
 * ดึงข้อมูล app state ของ admin จาก Firebase Realtime Database
 */
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

/**
 * อัพเดท app state ของ admin ใน Firebase Realtime Database
 */
export const updateAdminAppState = async (uid: string, updates: Partial<AdminAppState>): Promise<void> => {
  try {
    const user = getCurrentUser();
    if (!user || user.uid !== uid) {
      throw new Error('ไม่มีสิทธิ์แก้ไข state ของ admin อื่น');
    }
    const isAdmin = await checkIsAdmin(uid);
    if (!isAdmin) {
      throw new Error('ไม่มีสิทธิ์เข้าถึง Admin App State');
    }
    
    // Remove undefined fields ก่อนบันทึก
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
  } catch (error) {
    console.error('Error updating admin app state:', error);
    throw error;
  }
};

/**
 * Subscribe เพื่อรับการเปลี่ยนแปลง app state ของ admin แบบ real-time
 */
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

