# 🔒 Security และ Authentication

## 📋 สารบัญ

1. [ภาพรวม Security](#1-ภาพรวม-security)
2. [Firebase Security Rules](#2-firebase-security-rules)
3. [Authentication Methods](#3-authentication-methods)
4. [Authorization](#4-authorization)
5. [Session Management](#5-session-management)
6. [Data Validation](#6-data-validation)
7. [Best Practices](#7-best-practices)

---

## 1. ภาพรวม Security

### Security Layers

1. **Firebase Security Rules**: ควบคุมการเข้าถึงข้อมูลในระดับ Database
2. **Authentication**: ตรวจสอบตัวตนของผู้ใช้
3. **Authorization**: ตรวจสอบสิทธิ์การเข้าถึง (Admin/Guest)
4. **Client-side Validation**: Validate ข้อมูลก่อนส่งไปยัง Firebase
5. **Server-side Validation**: Firebase Rules validate ข้อมูลอีกครั้ง

---

## 2. Firebase Security Rules

### Rules Location

ไฟล์: `database.rules.json`

### Rules Structure

```json
{
  "rules": {
    "guests": { ... },
    "zones": { ... },
    "tables": { ... },
    "rsvps": { ... },
    "config": { ... },
    "admins": { ... },
    "userSessions": { ... },
    "adminSessions": { ... },
    "userAppState": { ... },
    "adminAppState": { ... }
  }
}
```

### Rules สำหรับแต่ละ Entity

#### Guests

```json
{
  "guests": {
    ".read": "auth != null",
    "$guestId": {
      ".read": "auth != null && (root.child('admins').child(auth.uid).exists() || (data.exists() && data.child('rsvpUid').val() === auth.uid))",
      ".write": "auth != null && (root.child('admins').child(auth.uid).exists() || (!root.child('admins').child(auth.uid).exists() && ((!data.exists() && newData.child('rsvpUid').val() === auth.uid) || (data.exists() && data.child('rsvpUid').val() === auth.uid && newData.child('rsvpUid').val() === auth.uid))))",
      ".validate": "!newData.exists() || root.child('admins').child(auth.uid).exists() || (!root.child('admins').child(auth.uid).exists() && newData.hasChildren(['rsvpUid']) && newData.child('rsvpUid').val() === auth.uid)"
    }
  }
}
```

**อธิบาย**:
- **Read**: Admin อ่านได้ทั้งหมด, Guest อ่านได้เฉพาะของตัวเอง (ตรวจสอบจาก `rsvpUid`)
- **Write**: Admin เขียนได้ทั้งหมด, Guest เขียนได้เฉพาะของตัวเอง (ต้องมี `rsvpUid === auth.uid`)
- **Validate**: ตรวจสอบว่า `rsvpUid` ต้องตรงกับ `auth.uid` (ถ้าไม่ใช่ admin)

#### Zones & Tables

```json
{
  "zones": {
    ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
    ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
  },
  "tables": {
    ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
    ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
  }
}
```

**อธิบาย**: เฉพาะ Admin เท่านั้นที่สามารถอ่าน/เขียนได้

#### RSVPs

```json
{
  "rsvps": {
    ".read": "auth != null",
    "$rsvpId": {
      ".read": "auth != null && (root.child('admins').child(auth.uid).exists() || data.child('uid').val() === auth.uid)",
      ".write": "auth != null && (root.child('admins').child(auth.uid).exists() || (!root.child('admins').child(auth.uid).exists() && ((!data.exists() && newData.child('uid').val() === auth.uid) || (data.exists() && data.child('uid').val() === auth.uid && newData.child('uid').val() === auth.uid))))",
      ".validate": "!newData.exists() || root.child('admins').child(auth.uid).exists() || (!root.child('admins').child(auth.uid).exists() && newData.child('uid').val() === auth.uid)"
    }
  }
}
```

**อธิบาย**:
- **Read**: Admin อ่านได้ทั้งหมด, Guest อ่านได้เฉพาะของตัวเอง (ตรวจสอบจาก `uid`)
- **Write**: Admin เขียนได้ทั้งหมด, Guest เขียนได้เฉพาะของตัวเอง (ต้องมี `uid === auth.uid`)

#### Config

```json
{
  "config": {
    ".read": true,
    ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
  }
}
```

**อธิบาย**: ทุกคนอ่านได้, เฉพาะ Admin เท่านั้นที่เขียนได้

#### Admins

```json
{
  "admins": {
    "$uid": {
      ".read": "auth != null && auth.uid === $uid"
    },
    ".read": false,
    ".write": false
  }
}
```

**อธิบาย**: User อ่านได้เฉพาะ `/admins/{uid}` ของตัวเอง, ไม่มีใครเขียนได้

#### User Sessions

```json
{
  "userSessions": {
    "$uid": {
      ".read": "auth != null && auth.uid === $uid && !root.child('admins').child(auth.uid).exists()",
      "isOnline": {
        ".write": "auth != null && auth.uid === $uid && !root.child('admins').child(auth.uid).exists()"
      },
      "startedAt": {
        ".write": "auth != null && auth.uid === $uid && !root.child('admins').child(auth.uid).exists()"
      },
      "sessionId": {
        ".write": "auth != null && auth.uid === $uid && !root.child('admins').child(auth.uid).exists()"
      }
    },
    ".read": false,
    ".write": false
  }
}
```

**อธิบาย**: Guest (ไม่ใช่ admin) อ่าน/เขียนได้เฉพาะ `/userSessions/{uid}` ของตัวเอง

#### Admin Sessions

```json
{
  "adminSessions": {
    "$uid": {
      ".read": "auth != null && auth.uid === $uid && root.child('admins').child(auth.uid).exists()",
      "isOnline": {
        ".write": "auth != null && auth.uid === $uid && root.child('admins').child(auth.uid).exists()"
      },
      "startedAt": {
        ".write": "auth != null && auth.uid === $uid && root.child('admins').child(auth.uid).exists()"
      },
      "sessionId": {
        ".write": "auth != null && auth.uid === $uid && root.child('admins').child(auth.uid).exists()"
      }
    },
    ".read": false,
    ".write": false
  }
}
```

**อธิบาย**: Admin อ่าน/เขียนได้เฉพาะ `/adminSessions/{uid}` ของตัวเอง

---

## 3. Authentication Methods

### Admin Authentication

#### Method: Email/Password

```typescript
// src/services/firebaseService.ts
export const signInWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};
```

#### Flow

```
1. User enters email/password
2. signInWithEmailAndPassword()
3. Firebase Authentication
4. checkIsAdmin(user.uid) → check /admins/{uid}
5. If admin → grant access
```

### Guest Authentication

#### Method: Google Login

```typescript
export const signInWithGoogle = async (): Promise<User> => {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  return userCredential.user;
};
```

#### Method: Facebook Login

```typescript
export const signInWithFacebook = async (): Promise<User> => {
  const provider = new FacebookAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  return userCredential.user;
};
```

#### Flow

```
1. User clicks "Login with Google/Facebook"
2. signInWithGoogle() or signInWithFacebook()
3. Firebase Authentication (popup)
4. User authorizes app
5. Firebase returns User object
6. Access granted (auth.uid available)
```

### Auth Persistence

```typescript
// src/firebase/config.ts
import { setPersistence, browserLocalPersistence } from 'firebase/auth';

setPersistence(auth, browserLocalPersistence);
```

**หมายเหตุ**: ทั้ง Admin และ Guest ใช้ `browserLocalPersistence` เหมือนกัน (เก็บ token ใน localStorage)

---

## 4. Authorization

### Admin Authorization

```typescript
// Check if user is admin
export const checkIsAdmin = async (uid: string): Promise<boolean> => {
  const snapshot = await get(ref(database, `admins/${uid}`));
  return snapshot.exists() && snapshot.val() === true;
};
```

### Guest Authorization

```typescript
// Check ownership via rsvpUid
const guest = await getGuest(guestId);
if (guest.rsvpUid !== auth.uid) {
  throw new Error('Permission denied');
}
```

### Role-based Access Control

| Resource | Admin | Guest |
|----------|-------|-------|
| Guests | Read/Write All | Read/Write Own |
| Zones | Read/Write All | None |
| Tables | Read/Write All | None |
| RSVPs | Read/Write All | Read/Write Own |
| Config | Read/Write | Read Only |
| Sessions | Admin Sessions | User Sessions |

---

## 5. Session Management

### Session Registration

```typescript
export const registerSession = async (uid: string): Promise<void> => {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await set(ref(database, `userSessions/${uid}`), {
    isOnline: 1,
    startedAt: new Date().toISOString(),
    sessionId: sessionId
  });
  
  // Set onDisconnect
  const sessionRef = ref(database, `userSessions/${uid}/isOnline`);
  onDisconnect(sessionRef).set(0);
};
```

### Session Monitoring

```typescript
export const subscribeSessionChanges = (
  uid: string,
  callback: (session: UserSession | null) => void
): () => void => {
  const sessionRef = ref(database, `userSessions/${uid}`);
  return onValue(sessionRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
};
```

### Multi-device Detection

```typescript
// Check if another device is online
const session = await getSession(uid);
if (session.isOnline === 1 && session.sessionId !== currentSessionId) {
  // Another device is online
  showWarning('มีการ login จากอุปกรณ์อื่น');
}
```

---

## 6. Data Validation

### Client-side Validation

```typescript
// Example: Validate RSVP data
const validateRSVP = (data: RSVPData): boolean => {
  if (!data.firstName || !data.lastName) {
    return false;
  }
  if (data.isComing !== 'yes' && data.isComing !== 'no') {
    return false;
  }
  return true;
};
```

### Server-side Validation (Firebase Rules)

```json
{
  "rsvps": {
    "$rsvpId": {
      ".validate": "newData.hasChildren(['uid', 'firstName', 'lastName', 'isComing']) && newData.child('uid').val() === auth.uid && (newData.child('isComing').val() === 'yes' || newData.child('isComing').val() === 'no')"
    }
  }
}
```

---

## 7. Best Practices

### 1. Always Validate on Server

- Client-side validation: สำหรับ UX (แสดง error ทันที)
- Server-side validation: สำหรับ security (Firebase Rules)

### 2. Use auth.uid for Ownership

```typescript
// ✅ Good
const guest = { ...guest, rsvpUid: auth.uid };

// ❌ Bad
const guest = { ...guest, rsvpUid: 'hardcoded-uid' };
```

### 3. Check Permissions Before Operations

```typescript
// ✅ Good
const isAdmin = await checkIsAdmin(user.uid);
if (!isAdmin) {
  throw new Error('Permission denied');
}

// ❌ Bad
// Assume user is admin without checking
```

### 4. Use Secure Session Management

- Generate unique session IDs
- Track session state in Firebase
- Use onDisconnect for cleanup
- Monitor multi-device sessions

### 5. Protect Sensitive Data

- Admin UID list: Read-only for users
- Session data: User-specific only
- Guest data: Ownership-based access

---

## 🐛 Troubleshooting

### ปัญหา: "PERMISSION_DENIED"

**สาเหตุ**: Security Rules บล็อกการเข้าถึง

**วิธีแก้**:
1. ตรวจสอบว่า user login แล้ว (`auth != null`)
2. ตรวจสอบว่า user มีสิทธิ์เข้าถึงข้อมูล (Admin หรือ Owner)
3. ตรวจสอบ Firebase Rules ว่า deploy แล้ว

### ปัญหา: "Admin ไม่สามารถล็อกอินได้"

**สาเหตุ**: Admin UID ยังไม่ได้เพิ่มใน Database

**วิธีแก้**: เพิ่ม UID ใน `/admins/{uid}` = `true`

### ปัญหา: "Guest ไม่สามารถสร้าง RSVP ได้"

**สาเหตุ**: Security Rules บล็อกการเขียน

**วิธีแก้**: ตรวจสอบว่า Rules อนุญาตให้ Guest เขียน RSVP ของตัวเองได้

---

**อัพเดทล่าสุด:** 2024


