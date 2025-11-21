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
  await set(ref(database, `guests/${guest.id}`), guest);
};

export const updateGuest = async (id: string, updates: Partial<Guest>): Promise<void> => {
  await update(ref(database, `guests/${id}`), updates);
};

export const deleteGuest = async (id: string): Promise<void> => {
  await remove(ref(database, `guests/${id}`));
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
  await set(ref(database, `zones/${zone.id}`), zone);
};

export const updateZone = async (id: string, updates: Partial<Zone>): Promise<void> => {
  await update(ref(database, `zones/${id}`), updates);
};

export const deleteZone = async (id: string): Promise<void> => {
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
  await set(ref(database, `tables/${table.id}`), table);
};

export const updateTable = async (id: string, updates: Partial<TableData>): Promise<void> => {
  await update(ref(database, `tables/${id}`), updates);
};

export const deleteTable = async (id: string): Promise<void> => {
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
  phoneNumber?: string;
  firstName: string;
  lastName: string;
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
  return Object.keys(data).map(key => ({ id: key, ...data[key] }));
};

export const getRSVPByPhone = async (phoneNumber: string): Promise<RSVPData | null> => {
  const snapshot = await get(rsvpsRef());
  if (!snapshot.exists()) return null;
  const data = snapshot.val();
  const rsvps = Object.keys(data).map(key => ({ id: key, ...data[key] }));
  return rsvps.find(r => r.phoneNumber === phoneNumber) || null;
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
  await update(configRef(), config);
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

export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    // Fallback to redirect if popup fails (common on mobile in-app browsers)
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
       if (isMobile()) {
          await signInWithRedirect(auth, googleProvider);
          // This promise will never resolve as page redirects
          throw new Error('Redirecting to Google Login...');
       }
    }
    throw error;
  }
};

export const signInWithFacebook = async (): Promise<User> => {
  try {
    // Facebook often requires redirect on mobile to work correctly with native app/safari
    if (isMobile()) {
       await signInWithRedirect(auth, facebookProvider);
       // This promise will never resolve as page redirects
       throw new Error('Redirecting to Facebook Login...');
    }
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
