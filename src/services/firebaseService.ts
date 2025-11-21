/* eslint-disable security/detect-object-injection */
import { ref, get, set, push, update, remove, onValue, off, DataSnapshot } from 'firebase/database';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User,
  signInWithPopup,
  signInWithRedirect, // Add this
  getRedirectResult, // Add this
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
  return () => off(guestsRef(), 'value', unsubscribe);
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
  return () => off(zonesRef(), 'value', unsubscribe);
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
  return () => off(tablesRef(), 'value', unsubscribe);
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
  const newRef = push(rsvpsRef());
  const now = new Date().toISOString();
  const rsvpData: RSVPData = {
    ...rsvp,
    id: newRef.key!,
    createdAt: now,
    updatedAt: now,
  };
  await set(newRef, rsvpData);
  return newRef.key!;
};

export const getRSVPs = async (): Promise<RSVPData[]> => {
  const snapshot = await get(rsvpsRef());
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.keys(data).map(key => {
    const rsvp = { id: key, ...data[key] };
    // ลบ phoneNumber ออกถ้ามี (สำหรับข้อมูลเก่า)
    if ('phoneNumber' in rsvp) {
      delete (rsvp as any).phoneNumber;
    }
    return rsvp;
  });
};

export const getRSVPByUid = async (uid: string): Promise<RSVPData | null> => {
  const snapshot = await get(rsvpsRef());
  if (!snapshot.exists()) return null;
  const data = snapshot.val();
  const rsvps = Object.keys(data).map(key => ({ id: key, ...data[key] }));
  // Find the most recent RSVP for this user (in case there are multiple)
  const userRSVPs = rsvps.filter(r => r.uid === uid);
  if (userRSVPs.length === 0) return null;
  // Return the most recent one (by updatedAt or createdAt)
  const mostRecent = userRSVPs.sort((a, b) => {
    const aTime = a.updatedAt || a.createdAt || '';
    const bTime = b.updatedAt || b.createdAt || '';
    return bTime.localeCompare(aTime);
  })[0];
  // ลบ phoneNumber ออกถ้ามี (สำหรับข้อมูลเก่า)
  if ('phoneNumber' in mostRecent) {
    delete (mostRecent as any).phoneNumber;
  }
  return mostRecent;
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
        delete (rsvp as any).phoneNumber;
      }
      return rsvp;
    });
    callback(rsvps);
  });
  return () => off(rsvpsRef(), 'value', unsubscribe);
};

export const updateRSVP = async (id: string, updates: Partial<RSVPData>): Promise<void> => {
  await update(ref(database, `rsvps/${id}`), { ...updates, updatedAt: new Date().toISOString() });
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
    console.log('Data already exists, skipping migration');
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

  console.log('Initial data migrated successfully');
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

// Social Authentication
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Configure providers
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

facebookProvider.setCustomParameters({
  display: 'popup'
});

// Add scopes if needed
googleProvider.addScope('profile');
googleProvider.addScope('email');
facebookProvider.addScope('email');

// Mobile detection helper
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// In-app browser detection (Facebook, Line, etc.)
const isInAppBrowser = () => {
  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.includes('fban') || // Facebook Android
    ua.includes('fbav') || // Facebook iOS
    ua.includes('line/') || // Line
    ua.includes('wv') || // WebView
    (ua.includes('safari') && !ua.includes('chrome') && (window.navigator as any).standalone !== undefined) // iOS Safari standalone
  );
};

export const signInWithGoogle = async (): Promise<User> => {
  try {
    // ถ้าเป็น in-app browser ให้ใช้ redirect เสมอ
    if (isInAppBrowser() || isMobile()) {
      await signInWithRedirect(auth, googleProvider);
      // This promise will never resolve as page redirects
      throw new Error('Redirecting to Google Login...');
    }
    
    // Desktop: ลองใช้ popup ก่อน
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    // Fallback to redirect if popup fails
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
      await signInWithRedirect(auth, googleProvider);
      throw new Error('Redirecting to Google Login...');
    }
    throw error;
  }
};

export const signInWithFacebook = async (): Promise<User> => {
  try {
    // ถ้าเป็น in-app browser ให้ใช้ redirect เสมอ
    if (isInAppBrowser() || isMobile()) {
      await signInWithRedirect(auth, facebookProvider);
      // This promise will never resolve as page redirects
      throw new Error('Redirecting to Facebook Login...');
    }
    
    // Desktop: ลองใช้ popup ก่อน
    const result = await signInWithPopup(auth, facebookProvider);
    return result.user;
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
      // Fallback to redirect
      await signInWithRedirect(auth, facebookProvider);
      throw new Error('Redirecting to Facebook Login...');
    }
    throw error;
  }
};

// Check for redirect result on page load
export const checkRedirectResult = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch (error) {
    console.error('Redirect login error:', error);
    throw error;
  }
};
