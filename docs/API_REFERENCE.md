# 📚 API Reference

## 📋 สารบัญ

1. [ภาพรวม](#1-ภาพรวม)
2. [Guests API](#2-guests-api)
3. [Zones API](#3-zones-api)
4. [Tables API](#4-tables-api)
5. [RSVPs API](#5-rsvps-api)
6. [Config API](#6-config-api)
7. [Authentication API](#7-authentication-api)
8. [Session Management API](#8-session-management-api)
9. [App State API](#9-app-state-api)

---

## 1. ภาพรวม

### Location

ไฟล์: `src/services/firebaseService.ts`

### Import

```typescript
import {
  // Guests
  getGuests,
  createGuest,
  updateGuest,
  deleteGuest,
  subscribeGuests,
  // ... other APIs
} from '@/services/firebaseService';
```

### Error Handling

ทุก function จะ throw error ถ้าเกิดปัญหา:
- `PERMISSION_DENIED`: ไม่มีสิทธิ์เข้าถึง
- `Network error`: ปัญหาเครือข่าย
- `Validation error`: ข้อมูลไม่ถูกต้อง

---

## 2. Guests API

### getGuests()

ดึงข้อมูลแขกทั้งหมด (one-time)

```typescript
const guests: Guest[] = await getGuests();
```

**Returns**: `Promise<Guest[]>`

**Permissions**: Admin only

---

### getGuest(id)

ดึงข้อมูลแขกตาม ID

```typescript
const guest: Guest | null = await getGuest('G1234567890_123456');
```

**Parameters**:
- `id: string` - Guest ID

**Returns**: `Promise<Guest | null>`

**Permissions**: Admin หรือ Owner (rsvpUid === auth.uid)

---

### getGuestByRsvpUid(rsvpUid)

เช็คว่ามี Guest ที่มี rsvpUid นี้อยู่แล้วหรือไม่ (Idempotency Check)

```typescript
const existingGuest: Guest | null = await getGuestByRsvpUid('abc123def456');
```

**Parameters**:
- `rsvpUid: string` - Firebase Auth UID

**Returns**: `Promise<Guest | null>`

**Permissions**: Authenticated users

**Usage**: ใช้เพื่อป้องกัน duplicate Guest creation

---

### createGuest(guest)

สร้างแขกใหม่ (Admin only)

```typescript
const guest: Guest = {
  id: 'G1234567890_123456',
  firstName: 'สมชาย',
  lastName: 'ใจดี',
  // ... other fields
};

await createGuest(guest);
```

**Parameters**:
- `guest: Guest` - Guest object

**Returns**: `Promise<void>`

**Permissions**: Admin only

**Throws**: Error if not admin

---

### createGuestFromRSVP(guest, rsvpUid)

สร้างแขกจาก RSVP flow (Guest users)

```typescript
const guest: Guest = {
  id: 'G1234567890_123456',
  firstName: 'สมชาย',
  lastName: 'ใจดี',
  rsvpUid: 'abc123def456',
  // ... other fields
};

await createGuestFromRSVP(guest, 'abc123def456');
```

**Parameters**:
- `guest: Guest` - Guest object
- `rsvpUid: string` - Firebase Auth UID

**Returns**: `Promise<void>`

**Permissions**: Authenticated users (must match rsvpUid)

**Features**:
- Idempotency check (ไม่สร้างซ้ำ)
- Auto-validate ownership

---

### updateGuest(id, updates)

อัพเดทข้อมูลแขก (Admin only)

```typescript
await updateGuest('G1234567890_123456', {
  checkedInAt: new Date().toISOString(),
  checkInMethod: 'qr'
});
```

**Parameters**:
- `id: string` - Guest ID
- `updates: Partial<Guest>` - Fields to update

**Returns**: `Promise<void>`

**Permissions**: Admin only

---

### updateGuestFromRSVP(id, updates, rsvpUid)

อัพเดทข้อมูลแขกจาก RSVP flow (Guest users)

```typescript
await updateGuestFromRSVP('G1234567890_123456', {
  note: 'จะมาพร้อมครอบครัว'
}, 'abc123def456');
```

**Parameters**:
- `id: string` - Guest ID
- `updates: Partial<Guest>` - Fields to update
- `rsvpUid: string` - Firebase Auth UID

**Returns**: `Promise<void>`

**Permissions**: Owner only (rsvpUid must match)

---

### deleteGuest(id)

ลบแขก (Admin only)

```typescript
await deleteGuest('G1234567890_123456');
```

**Parameters**:
- `id: string` - Guest ID

**Returns**: `Promise<void>`

**Permissions**: Admin only

---

### subscribeGuests(callback)

Subscribe ข้อมูลแขกแบบ real-time

```typescript
const unsubscribe = subscribeGuests((guests: Guest[]) => {
  console.log('Guests updated:', guests);
  // Update UI
});

// Cleanup
unsubscribe();
```

**Parameters**:
- `callback: (guests: Guest[]) => void` - Callback function

**Returns**: `() => void` - Unsubscribe function

**Permissions**: Admin (reads all), Guest (reads own)

**Usage**: ใช้ใน `useEffect` สำหรับ real-time updates

---

## 3. Zones API

### getZones()

ดึงข้อมูลโซนทั้งหมด (one-time)

```typescript
const zones: Zone[] = await getZones();
```

**Returns**: `Promise<Zone[]>`

**Permissions**: Admin only

---

### createZone(zone)

สร้างโซนใหม่

```typescript
const zone: Zone = {
  id: 'ZONE_001',
  zoneId: 'ZONE_001',
  zoneName: 'โซน VIP',
  // ... other fields
};

await createZone(zone);
```

**Parameters**:
- `zone: Zone` - Zone object

**Returns**: `Promise<void>`

**Permissions**: Admin only

---

### updateZone(id, updates)

อัพเดทข้อมูลโซน

```typescript
await updateZone('ZONE_001', {
  zoneName: 'โซน VIP (อัพเดท)'
});
```

**Parameters**:
- `id: string` - Zone ID
- `updates: Partial<Zone>` - Fields to update

**Returns**: `Promise<void>`

**Permissions**: Admin only

---

### deleteZone(id)

ลบโซน

```typescript
await deleteZone('ZONE_001');
```

**Parameters**:
- `id: string` - Zone ID

**Returns**: `Promise<void>`

**Permissions**: Admin only

---

### subscribeZones(callback)

Subscribe ข้อมูลโซนแบบ real-time

```typescript
const unsubscribe = subscribeZones((zones: Zone[]) => {
  console.log('Zones updated:', zones);
});

unsubscribe();
```

**Parameters**:
- `callback: (zones: Zone[]) => void` - Callback function

**Returns**: `() => void` - Unsubscribe function

**Permissions**: Admin only

---

## 4. Tables API

### getTables()

ดึงข้อมูลโต๊ะทั้งหมด (one-time)

```typescript
const tables: TableData[] = await getTables();
```

**Returns**: `Promise<TableData[]>`

**Permissions**: Admin only

---

### createTable(table)

สร้างโต๊ะใหม่

```typescript
const table: TableData = {
  id: 'TABLE_001',
  tableId: 'TABLE_001',
  tableName: 'โต๊ะ 1',
  zoneId: 'ZONE_001',
  // ... other fields
};

await createTable(table);
```

**Parameters**:
- `table: TableData` - Table object

**Returns**: `Promise<void>`

**Permissions**: Admin only

---

### updateTable(id, updates)

อัพเดทข้อมูลโต๊ะ

```typescript
await updateTable('TABLE_001', {
  capacity: 12
});
```

**Parameters**:
- `id: string` - Table ID
- `updates: Partial<TableData>` - Fields to update

**Returns**: `Promise<void>`

**Permissions**: Admin only

---

### deleteTable(id)

ลบโต๊ะ

```typescript
await deleteTable('TABLE_001');
```

**Parameters**:
- `id: string` - Table ID

**Returns**: `Promise<void>`

**Permissions**: Admin only

---

### subscribeTables(callback)

Subscribe ข้อมูลโต๊ะแบบ real-time

```typescript
const unsubscribe = subscribeTables((tables: TableData[]) => {
  console.log('Tables updated:', tables);
});

unsubscribe();
```

**Parameters**:
- `callback: (tables: TableData[]) => void` - Callback function

**Returns**: `() => void` - Unsubscribe function

**Permissions**: Admin only

---

## 5. RSVPs API

### createRSVP(rsvp)

สร้าง RSVP ใหม่

```typescript
const rsvp = {
  firstName: 'สมชาย',
  lastName: 'ใจดี',
  nickname: 'ชาย',
  isComing: 'yes' as const,
  side: 'groom' as const,
  relation: 'เพื่อน',
  note: '',
  accompanyingGuestsCount: 1,
  accompanyingGuests: [
    { name: 'สมหญิง ใจดี', relationToMain: 'ภรรยา' }
  ]
};

const rsvpId = await createRSVP(rsvp);
```

**Parameters**:
- `rsvp: Omit<RSVPData, 'id' | 'createdAt' | 'updatedAt'>` - RSVP data

**Returns**: `Promise<string>` - RSVP ID

**Permissions**: Authenticated users

**Features**:
- Auto-set `uid` from current user
- Auto-generate `fullName`
- Validation (firstName, lastName, isComing required)

---

### getRSVPs()

ดึงข้อมูล RSVP ทั้งหมด (one-time)

```typescript
const rsvps: RSVPData[] = await getRSVPs();
```

**Returns**: `Promise<RSVPData[]>`

**Permissions**: Authenticated users (reads all, but filter by uid on client)

---

### getRSVPByUid(uid?)

ดึงข้อมูล RSVP ตาม UID

```typescript
const rsvp: RSVPData | null = await getRSVPByUid();
```

**Parameters**:
- `uid?: string` - Optional UID (uses current user UID if not provided)

**Returns**: `Promise<RSVPData | null>`

**Permissions**: Authenticated users (reads own RSVP)

**Features**:
- Auto-uses current user UID (ignores parameter for security)
- Returns most recent RSVP if multiple exist

---

### updateRSVP(id, updates)

อัพเดทข้อมูล RSVP

```typescript
await updateRSVP('RSVP_1234567890', {
  isComing: 'no',
  note: 'ไม่สามารถมาร่วมงานได้'
});
```

**Parameters**:
- `id: string` - RSVP ID
- `updates: Partial<RSVPData>` - Fields to update

**Returns**: `Promise<void>`

**Permissions**: Owner only (uid must match auth.uid)

**Features**:
- Auto-updates `fullName` if firstName/lastName changed
- Auto-updates `updatedAt`

---

### subscribeRSVPs(callback)

Subscribe ข้อมูล RSVP แบบ real-time

```typescript
const unsubscribe = subscribeRSVPs((rsvps: RSVPData[]) => {
  console.log('RSVPs updated:', rsvps);
});

unsubscribe();
```

**Parameters**:
- `callback: (rsvps: RSVPData[]) => void` - Callback function

**Returns**: `() => void` - Unsubscribe function

**Permissions**: Authenticated users

---

## 6. Config API

### getConfig()

ดึงข้อมูลการตั้งค่าระบบ

```typescript
const config: WeddingConfig | null = await getConfig();
```

**Returns**: `Promise<WeddingConfig | null>`

**Permissions**: Public (everyone can read)

---

### updateConfig(config)

อัพเดทข้อมูลการตั้งค่าระบบ

```typescript
await updateConfig({
  weddingDate: '2024-02-14',
  venue: 'โรงแรม ABC'
});
```

**Parameters**:
- `config: Partial<WeddingConfig>` - Config fields to update

**Returns**: `Promise<void>`

**Permissions**: Admin only

---

### getWeddingCardConfig()

ดึงข้อมูลการตั้งค่าการ์ดเชิญ

```typescript
const cardConfig: WeddingCardConfigFirebase | null = await getWeddingCardConfig();
```

**Returns**: `Promise<WeddingCardConfigFirebase | null>`

**Permissions**: Public

---

### updateWeddingCardConfig(config)

อัพเดทข้อมูลการตั้งค่าการ์ดเชิญ

```typescript
await updateWeddingCardConfig({
  groom: { firstName: 'สมชาย', ... },
  bride: { firstName: 'สมหญิง', ... }
});
```

**Parameters**:
- `config: Partial<WeddingCardConfigFirebase>` - Card config fields

**Returns**: `Promise<void>`

**Permissions**: Admin only

---

## 7. Authentication API

### signInWithEmailAndPassword(email, password)

ล็อกอินด้วย Email/Password (Admin)

```typescript
const user: User = await signInWithEmailAndPassword('admin@admin.com', 'password123');
```

**Parameters**:
- `email: string` - Email address
- `password: string` - Password

**Returns**: `Promise<User>` - Firebase User object

**Permissions**: Public (but requires admin check after login)

---

### signInWithGoogle()

ล็อกอินด้วย Google (Guest)

```typescript
const user: User = await signInWithGoogle();
```

**Returns**: `Promise<User>` - Firebase User object

**Permissions**: Public

**Features**: Opens Google popup for authentication

---

### signInWithFacebook()

ล็อกอินด้วย Facebook (Guest)

```typescript
const user: User = await signInWithFacebook();
```

**Returns**: `Promise<User>` - Firebase User object

**Permissions**: Public

**Features**: Opens Facebook popup for authentication

---

### logout()

ล็อกเอาท์

```typescript
await logout();
```

**Returns**: `Promise<void>`

**Permissions**: Authenticated users

**Features**: 
- Signs out from Firebase
- Clears session state

---

### onAuthStateChange(callback)

Subscribe การเปลี่ยนแปลง authentication state

```typescript
const unsubscribe = onAuthStateChange((user: User | null) => {
  if (user) {
    console.log('User logged in:', user.uid);
  } else {
    console.log('User logged out');
  }
});

unsubscribe();
```

**Parameters**:
- `callback: (user: User | null) => void` - Callback function

**Returns**: `() => void` - Unsubscribe function

**Usage**: ใช้ใน `useEffect` เพื่อตรวจสอบ auth state

---

### checkIsAdmin(uid)

ตรวจสอบว่า user เป็น admin หรือไม่

```typescript
const isAdmin: boolean = await checkIsAdmin('abc123def456');
```

**Parameters**:
- `uid: string` - Firebase Auth UID

**Returns**: `Promise<boolean>`

**Permissions**: Authenticated users (can check own admin status)

---

### getCurrentUser()

ดึงข้อมูล user ปัจจุบัน

```typescript
const user: User | null = getCurrentUser();
```

**Returns**: `User | null` - Firebase User object หรือ null

**Usage**: ใช้เพื่อดึง UID หรือข้อมูล user อื่นๆ

---

### checkRedirectResult()

ตรวจสอบ redirect result (สำหรับ Facebook/Google redirect flow)

```typescript
const user: User | null = await checkRedirectResult();
```

**Returns**: `Promise<User | null>`

**Usage**: ใช้หลังจาก redirect จาก social login

---

## 8. Session Management API

### registerSession(uid)

ลงทะเบียน session (ตั้งค่า isOnline = 1)

```typescript
await registerSession('abc123def456');
```

**Parameters**:
- `uid: string` - Firebase Auth UID

**Returns**: `Promise<void>`

**Permissions**: Authenticated users (own session only)

**Features**:
- Sets `isOnline: 1`
- Sets `startedAt` timestamp
- Generates unique `sessionId`
- Sets `onDisconnect` handler

---

### endSession(uid)

จบ session (ตั้งค่า isOnline = 0)

```typescript
await endSession('abc123def456');
```

**Parameters**:
- `uid: string` - Firebase Auth UID

**Returns**: `Promise<void>`

**Permissions**: Authenticated users (own session only)

---

### subscribeSessionChanges(uid, callback)

Subscribe การเปลี่ยนแปลง session state

```typescript
const unsubscribe = subscribeSessionChanges('abc123def456', (session: UserSession | null) => {
  if (session?.isOnline === 1) {
    console.log('User is online');
  }
});

unsubscribe();
```

**Parameters**:
- `uid: string` - Firebase Auth UID
- `callback: (session: UserSession | null) => void` - Callback function

**Returns**: `() => void` - Unsubscribe function

**Usage**: ใช้เพื่อตรวจสอบ multi-device login

---

## 9. App State API

### getUserAppState(uid)

ดึงข้อมูล UI state ของ user

```typescript
const state: UserAppState | null = await getUserAppState('abc123def456');
```

**Parameters**:
- `uid: string` - Firebase Auth UID

**Returns**: `Promise<UserAppState | null>`

**Permissions**: Authenticated users (own state only)

---

### updateUserAppState(uid, state)

อัพเดท UI state ของ user

```typescript
await updateUserAppState('abc123def456', {
  currentStep: 2,
  formData: { ... }
});
```

**Parameters**:
- `uid: string` - Firebase Auth UID
- `state: Partial<UserAppState>` - State fields to update

**Returns**: `Promise<void>`

**Permissions**: Authenticated users (own state only)

---

### subscribeUserAppState(uid, callback)

Subscribe การเปลี่ยนแปลง UI state ของ user

```typescript
const unsubscribe = subscribeUserAppState('abc123def456', (state: UserAppState | null) => {
  console.log('App state updated:', state);
});

unsubscribe();
```

**Parameters**:
- `uid: string` - Firebase Auth UID
- `callback: (state: UserAppState | null) => void` - Callback function

**Returns**: `() => void` - Unsubscribe function

---

### getAdminAppState(uid)

ดึงข้อมูล UI state ของ admin

```typescript
const state: AdminAppState | null = await getAdminAppState('abc123def456');
```

**Parameters**:
- `uid: string` - Firebase Auth UID

**Returns**: `Promise<AdminAppState | null>`

**Permissions**: Admin only

---

### updateAdminAppState(uid, state)

อัพเดท UI state ของ admin

```typescript
await updateAdminAppState('abc123def456', {
  currentView: '2',
  sidebarCollapsed: false
});
```

**Parameters**:
- `uid: string` - Firebase Auth UID
- `state: Partial<AdminAppState>` - State fields to update

**Returns**: `Promise<void>`

**Permissions**: Admin only

---

### subscribeAdminAppState(uid, callback)

Subscribe การเปลี่ยนแปลง UI state ของ admin

```typescript
const unsubscribe = subscribeAdminAppState('abc123def456', (state: AdminAppState | null) => {
  console.log('Admin app state updated:', state);
});

unsubscribe();
```

**Parameters**:
- `uid: string` - Firebase Auth UID
- `callback: (state: AdminAppState | null) => void` - Callback function

**Returns**: `() => void` - Unsubscribe function

**Permissions**: Admin only

---

## 📝 Best Practices

1. **Always use subscribe functions** สำหรับ real-time data
2. **Cleanup subscriptions** ใน useEffect cleanup
3. **Handle errors** สำหรับทุก async operations
4. **Check permissions** ก่อนเรียก API ที่ต้องการ admin
5. **Use idempotency checks** สำหรับ operations ที่อาจซ้ำซ้อน

---

**อัพเดทล่าสุด:** 2024

