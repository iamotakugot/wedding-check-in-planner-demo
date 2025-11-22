/* eslint-disable security/detect-object-injection */
import { ref, get, set, push, update, remove, onValue, off, DataSnapshot } from 'firebase/database';
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
  return () => off(rsvpsRef(), 'value', unsubscribe);
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
  // พยายามใช้ Popup ก่อนเพื่อ UX ที่ดีกว่า ถ้าถูกบล็อก/ไม่รองรับ ค่อย fallback เป็น Redirect
  try {
    await signInWithPopup(auth, googleProvider);
    // สำเร็จด้วย popup → onAuthStateChanged จะ trigger ต่อเอง
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
      await signInWithRedirect(auth, googleProvider);
      return;
    }
    throw error;
  }
};

export const signInWithFacebook = async (): Promise<void> => {
  // พยายามใช้ Popup ก่อน ถ้าถูกบล็อก/ไม่รองรับ ค่อย fallback เป็น Redirect
  try {
    await signInWithPopup(auth, facebookProvider);
    return;
  } catch (error: any) {
    const fallbackCodes = new Set([
      'auth/popup-blocked',
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/operation-not-supported-in-this-environment',
    ]);
    if (error && error.code && fallbackCodes.has(error.code)) {
      await signInWithRedirect(auth, facebookProvider);
      return;
    }
    throw error;
  }
};

// Check for redirect result on page load
// ต้องเรียกฟังก์ชันนี้ทันทีหลังจาก page load เพื่อเช็คว่าการ redirect สำเร็จหรือไม่
// ควรเรียกก่อน onAuthStateChanged เพื่อให้ได้รับผลลัพธ์จาก redirect
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
    // Handle specific error codes
    if (error.code === 'auth/account-exists-with-different-credential') {
      console.error('An account already exists with the same email address but different sign-in credentials');
      throw error;
    }
    if (error.code === 'auth/email-already-in-use') {
      console.error('The email address is already in use by another account');
      throw error;
    }
    // Ignore other errors that might occur when checking redirect result
    console.warn('Error checking redirect result:', error);
    return null;
  }
};
