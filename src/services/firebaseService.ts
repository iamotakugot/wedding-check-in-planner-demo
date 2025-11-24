/* eslint-disable security/detect-object-injection */
import { ref, get, set, push, update, remove, onValue, DataSnapshot, onDisconnect } from 'firebase/database';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User,
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

/**
 * 🔧 DevOps: เช็คว่ามี Guest ที่มี rsvpUid นี้อยู่แล้วหรือไม่ (Idempotency Check)
 * ใช้เพื่อป้องกัน duplicate Guest creation
 */
export const getGuestByRsvpUid = async (rsvpUid: string): Promise<Guest | null> => {
  try {
    console.log('🔍 [Idempotency Check] กำลังค้นหา Guest ที่มี rsvpUid:', rsvpUid);
    const snapshot = await get(guestsRef());
    if (!snapshot.exists()) {
      console.log('✅ [Idempotency Check] ไม่พบ Guest ใดๆ ในระบบ');
      return null;
    }
    
    const data = snapshot.val();
    const guests = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    
    // หา Guest ที่มี rsvpUid ตรงกัน
    const existingGuest = guests.find((g: Guest) => g.rsvpUid === rsvpUid);
    
    if (existingGuest) {
      console.log('✅ [Idempotency Check] พบ Guest ที่มีอยู่แล้ว:', existingGuest.id);
      return existingGuest;
    }
    
    console.log('✅ [Idempotency Check] ไม่พบ Guest ที่มี rsvpUid นี้ สามารถสร้างใหม่ได้');
    return null;
  } catch (error) {
    console.error('❌ [Idempotency Check] เกิดข้อผิดพลาดในการค้นหา Guest:', error);
    throw error;
  }
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
/**
 * 🔧 DevOps: สร้าง Guest จาก RSVP พร้อม Idempotency Check
 * ป้องกัน duplicate Guest creation
 */
export const createGuestFromRSVP = async (guest: Guest, rsvpUid: string): Promise<void> => {
  const user = getCurrentUser();
  if (!user) {
    console.error('❌ [Guest Creation] ไม่พบผู้ใช้ที่เข้าสู่ระบบ');
    throw new Error('ต้องเข้าสู่ระบบก่อน');
  }
  if (user.uid !== rsvpUid) {
    console.error('❌ [Guest Creation] UID ไม่ตรงกัน:', { userUid: user.uid, rsvpUid });
    throw new Error('ไม่สามารถสร้าง Guest สำหรับ RSVP ของผู้อื่นได้');
  }
  
  // 🔧 Idempotency Check: เช็คว่ามี Guest ที่มี rsvpUid นี้อยู่แล้วหรือไม่
  console.log('🔍 [Guest Creation] กำลังตรวจสอบ Guest ที่มีอยู่แล้ว...');
  const existingGuest = await getGuestByRsvpUid(rsvpUid);
  
  if (existingGuest) {
    console.log('⚠️ [Guest Creation] พบ Guest ที่มีอยู่แล้ว ไม่ต้องสร้างซ้ำ:', existingGuest.id);
    // ไม่ต้อง throw error - แค่ log และ return
    // ให้ caller จัดการต่อ (อาจจะต้อง link RSVP กับ Guest ที่มีอยู่)
    return;
  }
  
  // เพิ่ม rsvpUid เพื่อติดตาม
  const guestWithRsvpUid = { ...guest, rsvpUid };
  console.log('✅ [Guest Creation] กำลังสร้าง Guest ใหม่:', guest.id);
  await set(ref(database, `guests/${guest.id}`), guestWithRsvpUid);
  console.log('✅ [Guest Creation] สร้าง Guest สำเร็จ:', guest.id);
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
    // 🔧 DevOps: Validation - ตรวจสอบว่า user login แล้วหรือไม่
    const user = getCurrentUser();
    if (!user) {
      console.error('❌ [RSVP Validation] ไม่พบผู้ใช้ที่เข้าสู่ระบบ');
      throw new Error('ต้องเข้าสู่ระบบก่อนบันทึกข้อมูล RSVP');
    }

    console.log('👤 [RSVP] ผู้ใช้ปัจจุบัน:', { uid: user.uid, email: user.email, providerId: user.providerData?.[0]?.providerId });

    // 🔧 DevOps: Validation - ตรวจสอบข้อมูลที่จำเป็น
    if (!rsvp.firstName || !rsvp.firstName.trim()) {
      console.error('❌ [RSVP Validation] ไม่พบชื่อ (firstName)');
      throw new Error('กรุณากรอกชื่อ');
    }
    if (!rsvp.lastName || !rsvp.lastName.trim()) {
      console.error('❌ [RSVP Validation] ไม่พบนามสกุล (lastName)');
      throw new Error('กรุณากรอกนามสกุล');
    }
    if (!rsvp.isComing || (rsvp.isComing !== 'yes' && rsvp.isComing !== 'no')) {
      console.error('❌ [RSVP Validation] สถานะการร่วมงานไม่ถูกต้อง:', rsvp.isComing);
      throw new Error('กรุณาเลือกสถานะการร่วมงาน');
    }
    if (rsvp.isComing === 'yes' && !rsvp.side) {
      console.error('❌ [RSVP Validation] ไม่พบฝ่าย (side) เมื่อ isComing === yes');
      throw new Error('กรุณาเลือกฝ่าย (เจ้าบ่าว/เจ้าสาว)');
    }

    // ตรวจสอบว่า rsvp.uid ตรงกับ user.uid หรือไม่
    if (rsvp.uid && rsvp.uid !== user.uid) {
      console.warn('⚠️ [RSVP] RSVP UID ไม่ตรงกับผู้ใช้ปัจจุบัน ใช้ UID จากผู้ใช้ปัจจุบันแทน');
    }

    // ใช้ currentUser.uid แทน rsvp.uid เพื่อความปลอดภัย
    const rsvpWithUid = {
      ...rsvp,
      uid: user.uid, // ใช้ uid จาก currentUser เสมอ
    };

    // 🔧 NoSQL Data Modeling: Denormalize fullName เพื่อ query เร็ว
    const fullName = `${rsvpWithUid.firstName.trim()} ${rsvpWithUid.lastName.trim()}`.trim();

    const newRef = push(rsvpsRef());
    const now = new Date().toISOString();
    const rsvpData: RSVPData = {
      ...rsvpWithUid,
      fullName: fullName, // 🔧 Denormalize: เก็บ fullName เพื่อ query เร็ว
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
    
    console.log('📝 [RSVP] ข้อมูล RSVP ที่จะบันทึก:', JSON.stringify(rsvpData, null, 2));
    console.log('📂 [RSVP] Path:', `rsvps/${newRef.key}`);
    console.log('👤 [RSVP] User UID:', user.uid);
    console.log('🔐 [RSVP] Auth state: auth != null (ควรเป็น true)');
    
    try {
      await set(newRef, rsvpData);
      console.log('✅ [RSVP] สร้าง RSVP สำเร็จ ID:', newRef.key);
      return newRef.key!;
    } catch (firebaseError: any) {
      console.error('❌ [RSVP] เกิดข้อผิดพลาดจาก Firebase:', firebaseError);
      console.error('📋 [RSVP] Error code:', firebaseError.code);
      console.error('📋 [RSVP] Error message:', firebaseError.message);
      
      if (firebaseError.code === 'PERMISSION_DENIED' || firebaseError.code === 'PERMISSION_DENIED') {
        console.error('🚫 [RSVP] PERMISSION_DENIED - Firebase Rules อาจบล็อกการเขียน');
        console.error('👤 [RSVP] Current user UID:', user.uid);
        console.error('📋 [RSVP] Rules ควรอนุญาต: auth != null && user is logged in');
        throw new Error('ไม่มีสิทธิ์ในการบันทึกข้อมูล RSVP กรุณาตรวจสอบ Firebase Rules และ Authentication state');
      }
      throw firebaseError;
    }
  } catch (error: any) {
    console.error('❌ [RSVP] เกิดข้อผิดพลาดในการสร้าง RSVP:', error);
    if (error.code === 'PERMISSION_DENIED' || error.code === 'PERMISSION_DENIED') {
      throw new Error('ไม่มีสิทธิ์ในการบันทึกข้อมูล RSVP กรุณาตรวจสอบ Firebase Rules');
    }
    // Re-throw error ที่มี message แล้ว
    if (error.message) {
      throw error;
    }
    throw new Error('เกิดข้อผิดพลาดในการบันทึกข้อมูล RSVP');
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

    // 🔧 NoSQL Data Modeling: Denormalize fullName ถ้ามี firstName หรือ lastName เปลี่ยน
    let updateData: Partial<RSVPData> = { 
      ...updates, 
      uid: user.uid, // ใช้ uid จาก currentUser เสมอ
      updatedAt: new Date().toISOString() 
    };

    // ถ้ามี firstName หรือ lastName เปลี่ยน → อัพเดท fullName
    if (updates.firstName || updates.lastName) {
      // ต้องดึงข้อมูลเดิมก่อนเพื่อสร้าง fullName
      const currentSnapshot = await get(ref(database, `rsvps/${id}`));
      if (currentSnapshot.exists()) {
        const currentData = currentSnapshot.val();
        const firstName = updates.firstName || currentData.firstName || '';
        const lastName = updates.lastName || currentData.lastName || '';
        updateData.fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      }
    }

    console.log('🔄 [RSVP] กำลังอัปเดต RSVP ID:', id);
    console.log('📝 [RSVP] ข้อมูลที่อัปเดต:', JSON.stringify(updateData, null, 2));
    console.log('📂 [RSVP] Path:', `rsvps/${id}`);
    console.log('👤 [RSVP] User UID:', user.uid);
    console.log('🔐 [RSVP] Auth state: auth != null (ควรเป็น true)');
    
    try {
      await update(ref(database, `rsvps/${id}`), updateData);
      console.log('✅ [RSVP] อัปเดต RSVP สำเร็จ');
    } catch (firebaseError: any) {
      console.error('❌ [RSVP] เกิดข้อผิดพลาดจาก Firebase:', firebaseError);
      console.error('📋 [RSVP] Error code:', firebaseError.code);
      console.error('📋 [RSVP] Error message:', firebaseError.message);
      
      if (firebaseError.code === 'PERMISSION_DENIED' || firebaseError.code === 'PERMISSION_DENIED') {
        console.error('🚫 [RSVP] PERMISSION_DENIED - Firebase Rules อาจบล็อกการเขียน');
        console.error('👤 [RSVP] Current user UID:', user.uid);
        console.error('📋 [RSVP] Rules ควรอนุญาต: auth != null && user is logged in');
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
// WEDDING CARD CONFIGURATION
// ============================================================================

export interface WeddingCardConfigFirebase {
  groom: {
    firstName: string;
    lastName: string;
    nickname: string;
    fullNameThai: string;
  };
  bride: {
    firstName: string;
    lastName: string;
    nickname: string;
    fullNameThai: string;
  };
  parents: {
    groom: {
      father: string;
      mother: string;
    };
    bride: {
      father: string;
      mother: string;
    };
  };
  nameOrder: 'bride-first' | 'groom-first';
  showParentsAtTop: boolean;
  dressCode?: {
    colors: string[];
    label?: string;
  };
}

export const weddingCardConfigRef = () => ref(database, 'config/weddingCard');

export const getWeddingCardConfig = async (): Promise<WeddingCardConfigFirebase | null> => {
  const snapshot = await get(weddingCardConfigRef());
  if (!snapshot.exists()) return null;
  return snapshot.val();
};

export const updateWeddingCardConfig = async (config: Partial<WeddingCardConfigFirebase>): Promise<void> => {
  await requireAdmin();
  await update(weddingCardConfigRef(), config);
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
 * ตรวจสอบว่าอยู่ใน Facebook WebView หรือไม่
 */
const isFacebookWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent || '';
  
  // ตรวจสอบ Facebook Messenger WebView (ครอบคลุมทุกกรณี)
  const facebookWebViewPatterns = [
    /FBAN/i,                // Facebook App (Android)
    /FBAV/i,                // Facebook App (iOS)
    /FB_IAB/i,              // Facebook In-App Browser
    /FB4A/i,                 // Facebook for Android
    /Messenger/i,            // Facebook Messenger
    /FBMD/i,                 // Facebook Mobile
    /FBSV/i,                 // Facebook Service
  ];
  
  return facebookWebViewPatterns.some(pattern => pattern.test(userAgent));
};

/**
 * ตรวจสอบว่าเป็น Android หรือไม่
 */
const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent || '';
  return /Android/i.test(userAgent);
};

/**
 * ตรวจสอบว่าเป็น iOS หรือไม่
 */
const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent || '';
  return /iPhone|iPad|iPod/i.test(userAgent);
};

/**
 * ตรวจสอบว่าเป็น Mobile Device หรือไม่ (Android หรือ iOS)
 */
const isMobileDevice = (): boolean => {
  return isAndroid() || isIOS();
};

/**
 * ตรวจสอบว่าอยู่ใน webview environment หรือไม่
 * เช่น LINE, Facebook Messenger, Instagram, Twitter ฯลฯ
 */
const isInWebView = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent || '';
  
  // ตรวจสอบ WebView อื่นๆ
  const otherWebViewPatterns = [
    /Line/i,                // LINE
    /Instagram/i,           // Instagram
    /Twitter/i,             // Twitter/X
    /LinkedInApp/i,         // LinkedIn
    /wv/i,                  // Android WebView
    /Mobile.*Safari/i,      // iOS WebView (บางกรณี)
    /WebView/i,             // Generic WebView
  ];
  
  // เช็ค Facebook WebView ก่อน (สำคัญมาก)
  const isFBWebView = isFacebookWebView();
  
  // เช็ค WebView อื่นๆ
  const isOtherWebView = otherWebViewPatterns.some(pattern => pattern.test(userAgent));
  
  // เช็ค window.navigator.standalone (iOS)
  const isIOSStandalone = (window.navigator as any).standalone === true;
  
  // เช็คว่ามี window.ReactNativeWebView (React Native WebView)
  const isReactNativeWebView = typeof (window as any).ReactNativeWebView !== 'undefined';
  
  // 🔧 DevOps: เช็ค Android WebView โดยดูจาก userAgent
  // Android WebView มักจะมี "wv" ใน userAgent และไม่มี "Chrome" หรือ "Version"
  const isAndroidWebView = /Android/i.test(userAgent) && 
                           /wv/i.test(userAgent) && 
                           !/Chrome/i.test(userAgent);
  
  // 🔧 DevOps: เช็ค iOS WebView โดยดูจาก userAgent
  // iOS WebView มักจะมี "Mobile Safari" แต่ไม่มี "Safari" หรือ "Version" แบบปกติ
  const isIOSWebView = /iPhone|iPad|iPod/i.test(userAgent) && 
                       /Mobile/i.test(userAgent) && 
                       !/Safari/i.test(userAgent);
  
  return isFBWebView || isOtherWebView || isIOSStandalone || isReactNativeWebView || isAndroidWebView || isIOSWebView;
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

/**
 * ตรวจสอบว่า localStorage สามารถใช้งานได้หรือไม่
 */
const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Export helper functions สำหรับใช้ใน components
 */
export const getWebViewInfo = () => {
  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
  const isAndroidDevice = isAndroid();
  const isIOSDevice = isIOS();
  const isMobile = isMobileDevice();
  const inWebView = isInWebView();
  const isFBWebView = isFacebookWebView();
  const sessionStorageAvailable = isSessionStorageAvailable();
  const localStorageAvailable = isLocalStorageAvailable();
  
  // 🔧 DevOps: ตรวจสอบ platform และ environment
  const platform = isAndroidDevice ? 'android' : isIOSDevice ? 'ios' : 'desktop';
  const environment = inWebView ? 'webview' : 'browser';
  
  return {
    isInWebView: inWebView,
    isFacebookWebView: isFBWebView,
    sessionStorageAvailable: sessionStorageAvailable,
    localStorageAvailable: localStorageAvailable,
    userAgent: userAgent,
    // 🔧 DevOps: เพิ่มข้อมูล platform และ environment
    platform: platform,
    isAndroid: isAndroidDevice,
    isIOS: isIOSDevice,
    isMobile: isMobile,
    environment: environment,
  };
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
facebookProvider.addScope('public_profile');
// ปรับปรุง custom parameters สำหรับ WebView
facebookProvider.setCustomParameters({
  display: 'popup',
  auth_type: 'rerequest', // ขอ permission ใหม่ทุกครั้ง
});

export const signInWithGoogle = async (): Promise<void> => {
  const webViewInfo = getWebViewInfo();
  const { isInWebView, isFacebookWebView, sessionStorageAvailable, platform, isMobile } = webViewInfo;

  // 🔧 DevOps: Log platform และ environment
  console.log(`📱 [Google Login] Platform: ${platform}, Mobile: ${isMobile}, WebView: ${isInWebView}, SessionStorage: ${sessionStorageAvailable}, LocalStorage: ${webViewInfo.localStorageAvailable}`);

  // 🔧 DevOps: ใช้ popup เท่านั้น (ไม่ redirect) - ห้ามเด้งเว็บ
  // สำหรับ WebView และ Browser ปกติ - ใช้ popup เท่านั้น
  try {
    if (isFacebookWebView || (isInWebView && !sessionStorageAvailable)) {
      console.log('🔍 [Google Login] กำลังใช้ popup ใน WebView...');
    } else {
      console.log('🔍 [Google Login] กำลังใช้ popup...');
    }
    await signInWithPopup(auth, googleProvider);
    console.log('✅ [Google Login] Popup สำเร็จ');
    return;
  } catch (error: any) {
    // ถ้า popup ถูกบล็อกหรือไม่รองรับ → throw error พร้อม link ให้คัดลอก
    if (error.code === 'auth/popup-blocked' || 
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request' ||
        error.code === 'auth/operation-not-supported-in-this-environment') {
      
      // 🔧 DevOps: ไม่ redirect → throw error พร้อม link
      const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
      throw new Error(`POPUP_BLOCKED|${currentUrl}`);
    }
    
    // ถ้าเป็น error อื่นๆ ให้ throw ต่อ
    throw error;
  }
};

export const signInWithFacebook = async (): Promise<void> => {
  const webViewInfo = getWebViewInfo();
  const { isInWebView, isFacebookWebView, sessionStorageAvailable, platform, isMobile } = webViewInfo;
  
  // 🔧 DevOps: Log platform และ environment
  console.log(`📱 [Facebook Login] Platform: ${platform}, Mobile: ${isMobile}, WebView: ${isInWebView}, SessionStorage: ${sessionStorageAvailable}, LocalStorage: ${webViewInfo.localStorageAvailable}`);
  
  // 🔧 DevOps: ใช้ popup เท่านั้น (ไม่ redirect) - ห้ามเด้งเว็บ
  // Facebook Messenger เป็น Incognito แต่ถ้า user login Facebook ไว้แล้ว → popup จะใช้ session นั้นได้
  // สำหรับ WebView และ Browser ปกติ - ใช้ popup เท่านั้น
  try {
    if (isFacebookWebView || (isInWebView && !sessionStorageAvailable)) {
      console.log('🔍 [Facebook Login] กำลังใช้ popup ใน WebView...');
    } else {
      console.log('🔍 [Facebook Login] กำลังใช้ popup...');
    }
    await signInWithPopup(auth, facebookProvider);
    console.log('✅ [Facebook Login] Popup สำเร็จ');
    return;
  } catch (error: any) {
    // ถ้า popup ถูกบล็อกหรือไม่รองรับ → throw error พร้อม link ให้คัดลอก
    if (error.code === 'auth/popup-blocked' || 
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request' ||
        error.code === 'auth/operation-not-supported-in-this-environment') {
      
      // 🔧 DevOps: ไม่ redirect → throw error พร้อม link
      const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
      throw new Error(`POPUP_BLOCKED|${currentUrl}`);
    }
    
    // 🔧 DevOps Fix: จัดการ error "missing initial state" หรือ sessionStorage errors
    if (error.message?.includes('sessionStorage') ||
        error.message?.includes('initial state') ||
        error.message?.includes('missing initial state') ||
        error.message?.includes('storage-partitioned')) {
      console.warn('⚠️ [Facebook Login] SessionStorage error - แสดง link ให้คัดลอก');
      const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
      throw new Error(`POPUP_BLOCKED|${currentUrl}`);
    }
    
    // ถ้าเป็น error อื่นๆ ให้ throw ต่อ
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
      console.log('✅ [Redirect] Login สำเร็จ');
      return result.user;
    }
    // No redirect result - user didn't come from a redirect
    console.log('ℹ️ [Redirect] ไม่มี redirect result');
    return null;
  } catch (error: any) {
    // 🔧 IMPORTANT: Handle critical errors - re-throw เพื่อให้ component จัดการ
    if (error.code === 'auth/account-exists-with-different-credential') {
      console.error('❌ [Redirect] มี account อื่นใช้ email เดียวกัน');
      throw error; // Re-throw เพื่อให้ component จัดการ
    }
    if (error.code === 'auth/email-already-in-use') {
      console.error('❌ [Redirect] Email ถูกใช้งานแล้ว');
      throw error; // Re-throw เพื่อให้ component จัดการ
    }
    
    // 🔧 DevOps Fix: สำหรับ WebView (Messenger) - sessionStorage อาจจะไม่ได้
    // ไม่ควร throw error เพื่อให้ระบบทำงานต่อ (onAuthStateChanged จะจัดการ)
    if (error.message?.includes('sessionStorage') || 
        error.message?.includes('initial state') ||
        error.message?.includes('missing initial state') ||
        error.message?.includes('storage-partitioned') ||
        error.message?.includes('localStorage') ||
        error.code === 'auth/operation-not-supported-in-this-environment') {
      console.warn('⚠️ [Redirect] SessionStorage/localStorage error - อาจเกิดใน WebView (Messenger) ระบบจะใช้ auth state check แทน');
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
export const userSessionIdRef = (uid: string) => ref(database, `userSessions/${uid}/sessionId`);

// 🔒 Security: แยก session path สำหรับ admin
export const adminSessionsRef = (uid: string) => ref(database, `adminSessions/${uid}`);
export const adminSessionIsOnlineRef = (uid: string) => ref(database, `adminSessions/${uid}/isOnline`);
export const adminSessionStartedAtRef = (uid: string) => ref(database, `adminSessions/${uid}/startedAt`);
export const adminSessionIdRef = (uid: string) => ref(database, `adminSessions/${uid}/sessionId`);

/**
 * 🔧 DevOps: Memory storage สำหรับ session ID (fallback เมื่อ storage ไม่ได้)
 */
let memorySessionId: string | null = null;
let firebaseSessionIdCache: { [uid: string]: string } = {};

/**
 * 🔧 DevOps: ดึง Session ID จาก Firebase (ไม่พึ่งพา browser storage)
 * วิธีนี้จะไม่ถูกล้างโดย browser และทำงานได้ในทุก environment
 * 🔒 Security: ใช้ path ตาม role (userSessions สำหรับ guest, adminSessions สำหรับ admin)
 */
const getSessionIdFromFirebase = async (uid: string, isAdmin: boolean = false): Promise<string | null> => {
  try {
    // ตรวจสอบ cache ก่อน
    if (firebaseSessionIdCache[uid]) {
      return firebaseSessionIdCache[uid];
    }
    
    // 🔒 Security: ใช้ path ตาม role
    const sessionIdRef = isAdmin ? adminSessionIdRef(uid) : userSessionIdRef(uid);
    
    // ดึงจาก Firebase
    const snapshot = await get(sessionIdRef);
    if (snapshot.exists()) {
      const sessionId = snapshot.val();
      // เก็บใน cache
      firebaseSessionIdCache[uid] = sessionId;
      return sessionId;
    }
    return null;
  } catch (error) {
    console.warn('⚠️ [Session ID] ไม่สามารถดึงจาก Firebase ได้:', error);
    return null;
  }
};

/**
 * 🔧 DevOps: บันทึก Session ID ลง Firebase (ไม่พึ่งพา browser storage)
 * 🔒 Security: ใช้ path ตาม role (userSessions สำหรับ guest, adminSessions สำหรับ admin)
 */
const saveSessionIdToFirebase = async (uid: string, sessionId: string, isAdmin: boolean = false): Promise<void> => {
  try {
    // 🔒 Security: ใช้ path ตาม role
    const sessionIdRef = isAdmin ? adminSessionIdRef(uid) : userSessionIdRef(uid);
    await set(sessionIdRef, sessionId);
    // เก็บใน cache
    firebaseSessionIdCache[uid] = sessionId;
  } catch (error) {
    console.warn('⚠️ [Session ID] ไม่สามารถบันทึกลง Firebase ได้:', error);
  }
};

/**
 * 🔧 DevOps: สร้าง Session ID ที่ unique สำหรับแต่ละ tab/window
 * ใช้ Firebase Realtime Database เป็นหลัก (ไม่พึ่งพา browser storage)
 * Priority:
 * 1. Firebase Realtime Database (หลัก) - ไม่ถูกล้างโดย browser
 * 2. Browser storage (cache) - เพิ่มความเร็ว
 * 3. Memory storage (fallback) - สำหรับกรณีที่ยังไม่ login
 * 🔒 Security: ใช้ path ตาม role (userSessions สำหรับ guest, adminSessions สำหรับ admin)
 */
const getOrCreateSessionId = async (uid?: string, isAdmin: boolean = false): Promise<string> => {
  const STORAGE_KEY = '__wedding_session_id__';
  
  // 🔧 DevOps Fix: ถ้ามี user login → ใช้ Firebase เป็นหลัก
  if (uid) {
    try {
      // 1. ลองดึงจาก Firebase ก่อน (ไม่พึ่งพา browser storage)
      const firebaseSessionId = await getSessionIdFromFirebase(uid, isAdmin);
      if (firebaseSessionId) {
        // เก็บใน browser storage เป็น cache (ถ้าใช้ได้)
        try {
          if (isSessionStorageAvailable()) {
            sessionStorage.setItem(STORAGE_KEY, firebaseSessionId);
          } else if (isLocalStorageAvailable()) {
            localStorage.setItem(STORAGE_KEY, firebaseSessionId);
          }
        } catch (e) {
          // ไม่เป็นไร ถ้า storage ไม่ได้
        }
        memorySessionId = firebaseSessionId;
        return firebaseSessionId;
      }
      
      // 2. ถ้าไม่มีใน Firebase → สร้างใหม่และบันทึกลง Firebase
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await saveSessionIdToFirebase(uid, newSessionId, isAdmin);
      
      // เก็บใน browser storage เป็น cache (ถ้าใช้ได้)
      try {
        if (isSessionStorageAvailable()) {
          sessionStorage.setItem(STORAGE_KEY, newSessionId);
        } else if (isLocalStorageAvailable()) {
          localStorage.setItem(STORAGE_KEY, newSessionId);
        }
      } catch (e) {
        // ไม่เป็นไร ถ้า storage ไม่ได้
      }
      memorySessionId = newSessionId;
      return newSessionId;
    } catch (error) {
      console.warn('⚠️ [Session ID] Firebase error, ใช้ fallback:', error);
      // Fallback ไปใช้ browser storage
    }
  }
  
  // 🔧 Fallback: ใช้ browser storage (สำหรับกรณีที่ยังไม่ login)
  // 1. ลองดึงจาก sessionStorage ก่อน
  try {
    const existingId = sessionStorage.getItem(STORAGE_KEY);
    if (existingId) {
      memorySessionId = existingId;
      return existingId;
    }
  } catch (e) {
    // sessionStorage ไม่ได้ → ข้ามไป
  }
  
  // 2. ลองดึงจาก localStorage
  try {
    if (isLocalStorageAvailable()) {
      const existingId = localStorage.getItem(STORAGE_KEY);
      if (existingId) {
        memorySessionId = existingId;
        return existingId;
      }
    }
  } catch (e) {
    // localStorage ไม่ได้ → ข้ามไป
  }
  
  // 3. ลองดึงจาก memory
  if (memorySessionId) {
    return memorySessionId;
  }
  
  // 4. สร้าง session ID ใหม่
  const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  memorySessionId = newSessionId;
  
  // 🔧 DevOps Fix: ถ้ามี uid (Firebase failed แต่มี user) → พยายาม sync กลับไป Firebase
  // เพื่อป้องกัน mismatch ระหว่าง browser storage กับ Firebase
  if (uid) {
    try {
      await saveSessionIdToFirebase(uid, newSessionId, isAdmin);
      console.log('✅ [Session ID] Synced fallback session ID to Firebase');
    } catch (error) {
      // Firebase ยังไม่พร้อม → ไม่เป็นไร, เก็บใน browser storage ไว้ก่อน
      // registerSession จะ sync ให้ทีหลังเมื่อ Firebase พร้อม
      console.warn('⚠️ [Session ID] Could not sync fallback session ID to Firebase (will retry later):', error);
    }
  }
  
  // พยายามเก็บใน storage (ถ้าใช้ได้)
  try {
    if (isSessionStorageAvailable()) {
      sessionStorage.setItem(STORAGE_KEY, newSessionId);
    } else if (isLocalStorageAvailable()) {
      localStorage.setItem(STORAGE_KEY, newSessionId);
    }
  } catch (e) {
    // ไม่เป็นไร ถ้า storage ไม่ได้
  }
  
  return newSessionId;
};

/**
 * สร้าง session ใหม่หลังจาก login สำเร็จ
 * จะเช็คว่ามี session อื่น active อยู่หรือไม่ (เช็ค isOnline === 1 และ sessionId ไม่ตรงกัน)
 * 🔒 Security: ใช้สำหรับ guest เท่านั้น (isAdmin = false)
 */
export const registerSession = async (user: User, isAdmin: boolean = false): Promise<{ hasOtherActiveSession: boolean; otherSessionStartedAt?: string; startedAt: string }> => {
  const uid = user.uid;
  const startedAt = new Date().toISOString();
  const currentSessionId = await getOrCreateSessionId(uid, isAdmin); // 🔧 DevOps: ใช้ session ID จาก Firebase (ไม่พึ่งพา browser storage) + 🔒 Security: ส่ง isAdmin parameter
  
  // 🔒 Security: ใช้ path ตาม role
  const sessionRef = isAdmin ? adminSessionsRef(uid) : userSessionsRef(uid);
  const isOnlineRef = isAdmin ? adminSessionIsOnlineRef(uid) : userSessionIsOnlineRef(uid);
  
  // เช็คว่ามี session อื่น active อยู่หรือไม่ (isOnline === 1)
  const isOnline = await getIsOnline(uid, isAdmin);
  let otherSessionStartedAt: string | undefined;
  let hasOtherActiveSession = false;
  
  if (isOnline) {
    // มี session active อยู่ - ดึงข้อมูล session
    const sessionInfo = await getSessionInfo(uid, isAdmin);
    const existingSessionId = sessionInfo?.sessionId;
    
    // 🔧 DevOps Fix: เช็คว่า session ที่ active อยู่เป็นของตัวเองหรือไม่
    if (existingSessionId && existingSessionId === currentSessionId) {
      // Session ของตัวเอง → ไม่ถือว่าเป็น session อื่น
      console.log('✅ [Session] Session ที่ active อยู่เป็นของตัวเอง ไม่ต้องแสดง warning');
      hasOtherActiveSession = false;
    } else {
      // Session ของคนอื่น → แสดง warning
      otherSessionStartedAt = sessionInfo?.startedAt;
      hasOtherActiveSession = true;
      console.log('⚠️ [Session] พบ session อื่น active อยู่:', existingSessionId);
    }
  }
  
  // ใช้ atomic update เพื่อ set ทั้ง isOnline, startedAt และ sessionId พร้อมกัน
  await update(sessionRef, {
    isOnline: 1,
    startedAt: startedAt,
    sessionId: currentSessionId, // 🔧 DevOps: เก็บ session ID
  });
  
  // ตั้งค่า onDisconnect เพื่อ set isOnline = 0 เมื่อแท็บปิด
  await onDisconnect(isOnlineRef).set(0);
  
  return {
    hasOtherActiveSession,
    otherSessionStartedAt,
    startedAt,
  };
};

/**
 * เช็คว่ามี session active อยู่หรือไม่ (isOnline === 1)
 * 🔒 Security: ใช้ path ตาม role
 */
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

/**
 * ดึงข้อมูล session (isOnline, startedAt และ sessionId)
 * 🔒 Security: ใช้ path ตาม role
 */
export const getSessionInfo = async (uid: string, isAdmin: boolean = false): Promise<{ isOnline: boolean; startedAt?: string; sessionId?: string } | null> => {
  try {
    const isOnlineRef = isAdmin ? adminSessionIsOnlineRef(uid) : userSessionIsOnlineRef(uid);
    const startedAtRef = isAdmin ? adminSessionStartedAtRef(uid) : userSessionStartedAtRef(uid);
    const sessionIdRef = isAdmin ? adminSessionIdRef(uid) : userSessionIdRef(uid);
    
    const [isOnlineSnapshot, startedAtSnapshot, sessionIdSnapshot] = await Promise.all([
      get(isOnlineRef),
      get(startedAtRef),
      get(sessionIdRef),
    ]);
    
    if (!isOnlineSnapshot.exists()) return null;
    
    return {
      isOnline: isOnlineSnapshot.val() === 1,
      startedAt: startedAtSnapshot.exists() ? startedAtSnapshot.val() : undefined,
      sessionId: sessionIdSnapshot.exists() ? sessionIdSnapshot.val() : undefined,
    };
  } catch (error) {
    console.error('Error getting session info:', error);
    return null;
  }
};

/**
 * ปิด session (set isOnline = 0)
 * ใช้เมื่อ logout หรือเมื่อต้องการปิด session
 * 🔒 Security: ใช้ path ตาม role
 */
export const endSession = async (uid: string, isAdmin: boolean = false): Promise<void> => {
  const isOnlineRef = isAdmin ? adminSessionIsOnlineRef(uid) : userSessionIsOnlineRef(uid);
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
  callback: (isOnline: boolean, startedAt?: string, sessionId?: string) => void,
  isAdmin: boolean = false
): (() => void) => {
  const sessionRef = isAdmin ? adminSessionsRef(uid) : userSessionsRef(uid);
  
  const unsubscribe = onValue(sessionRef, (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) {
      // session ไม่มีค่า → ถูกลงชื่อออก
      callback(false);
      return;
    }
    
    const data = snapshot.val();
    const isOnline = data?.isOnline === 1;
    const startedAt = data?.startedAt;
    const sessionId = data?.sessionId; // 🔧 DevOps: เพิ่ม sessionId
    
    // ถ้า isOnline === 0 → ถูกลงชื่อออก (logout จริงๆ)
    if (!isOnline) {
      callback(false, startedAt, sessionId);
      return;
    }
    
    // isOnline === 1 → ยัง active อยู่ (แต่ต้องเช็ค startedAt ใน component ว่าเปลี่ยนหรือไม่)
    callback(true, startedAt, sessionId);
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

