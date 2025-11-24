# 📊 โครงสร้างข้อมูล (Data Model)

## 📋 สารบัญ

1. [ภาพรวมโครงสร้างข้อมูล](#1-ภาพรวมโครงสร้างข้อมูล)
2. [Guest](#2-guest)
3. [Zone](#3-zone)
4. [Table](#4-table)
5. [RSVP](#5-rsvp)
6. [Config](#6-config)
7. [Admins](#7-admins)
8. [Sessions](#8-sessions)
9. [App State](#9-app-state)
10. [Data Relationships](#10-data-relationships)
11. [NoSQL Data Modeling](#11-nosql-data-modeling)

---

## 1. ภาพรวมโครงสร้างข้อมูล

### Firebase Realtime Database Structure

```
{
  "guests": { ... },           // รายชื่อแขก
  "zones": { ... },            // โซนที่นั่ง
  "tables": { ... },          // โต๊ะ
  "rsvps": { ... },           // การตอบรับจากแขก
  "config": { ... },          // การตั้งค่าระบบ
  "admins": { ... },         // รายชื่อ Admin
  "userSessions": { ... },    // Session ของ Guest
  "adminSessions": { ... },   // Session ของ Admin
  "userAppState": { ... },    // UI State ของ Guest
  "adminAppState": { ... }    // UI State ของ Admin
}
```

---

## 2. Guest

### Path: `/guests/{guestId}`

### TypeScript Interface

```typescript
interface Guest {
  id: string;                    // Guest ID (unique)
  firstName: string;              // ชื่อ
  lastName: string;               // นามสกุล
  nickname: string;               // ชื่อเล่น
  age: number | null;             // อายุ
  gender: 'male' | 'female' | 'other';  // เพศ
  relationToCouple: string;       // ความสัมพันธ์กับคู่บ่าวสาว
  side: 'groom' | 'bride' | 'both';  // ฝ่าย
  note: string;                   // หมายเหตุ
  zoneId: string | null;          // โซน ID (link to Zone)
  tableId: string | null;         // โต๊ะ ID (link to Table)
  seatNumber: number | null;       // หมายเลขที่นั่ง
  groupId: string | null;         // กลุ่ม ID (สำหรับกลุ่มแขก)
  groupName: string | null;       // ชื่อกลุ่ม
  checkedInAt: string | null;     // เวลาที่เช็คอิน (ISO timestamp)
  checkInMethod: 'manual' | 'qr' | null;  // วิธีเช็คอิน
  rsvpUid: string | null;         // UID ของผู้ที่สร้าง (link to RSVP/Auth)
  isComing?: boolean;             // มาหรือไม่
  accompanyingGuestsCount?: number;  // จำนวนผู้ติดตาม
  createdAt: string;              // เวลาที่สร้าง (ISO timestamp)
  updatedAt: string;              // เวลาที่อัพเดท (ISO timestamp)
}
```

### ตัวอย่างข้อมูล

```json
{
  "guests": {
    "G1234567890_123456": {
      "id": "G1234567890_123456",
      "firstName": "สมชาย",
      "lastName": "ใจดี",
      "nickname": "ชาย",
      "age": 30,
      "gender": "male",
      "relationToCouple": "เพื่อน",
      "side": "groom",
      "note": "",
      "zoneId": "ZONE_001",
      "tableId": "TABLE_001",
      "seatNumber": 1,
      "groupId": "GROUP_1234567890_123456",
      "groupName": "สมชาย ใจดี",
      "checkedInAt": "2024-01-15T10:30:00.000Z",
      "checkInMethod": "qr",
      "rsvpUid": "abc123def456",
      "isComing": true,
      "accompanyingGuestsCount": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Fields Description

- **id**: Unique identifier สำหรับ Guest (format: `G{timestamp}_{random}`)
- **rsvpUid**: Link กับ Firebase Authentication UID (ถ้าถูกสร้างจาก RSVP)
- **groupId**: ใช้สำหรับจัดกลุ่มแขกที่มาด้วยกัน (เช่น ครอบครัว)
- **zoneId/tableId**: Link กับ Zone และ Table สำหรับการจัดที่นั่ง

---

## 3. Zone

### Path: `/zones/{zoneId}`

### TypeScript Interface

```typescript
interface Zone {
  id: string;                     // Zone ID (internal)
  zoneId: string;                 // Zone ID (public)
  zoneName: string;               // ชื่อโซน
  description: string;            // คำอธิบาย
  capacity: number;               // ความจุ (คำนวณจาก tables)
  color: string;                  // สี (hex code)
  order: number;                  // ลำดับ
}
```

### ตัวอย่างข้อมูล

```json
{
  "zones": {
    "ZONE_001": {
      "id": "ZONE_001",
      "zoneId": "ZONE_001",
      "zoneName": "โซน VIP",
      "description": "โซนสำหรับแขกพิเศษ",
      "capacity": 50,
      "color": "#FF6B6B",
      "order": 1
    }
  }
}
```

### Fields Description

- **capacity**: คำนวณอัตโนมัติจากผลรวมของ `tables` ที่อยู่ในโซนนี้
- **order**: ใช้สำหรับเรียงลำดับการแสดงผล

---

## 4. Table

### Path: `/tables/{tableId}`

### TypeScript Interface

```typescript
interface TableData {
  id: string;                     // Table ID (internal)
  tableId: string;                // Table ID (public)
  tableName: string;              // ชื่อโต๊ะ
  zoneId: string;                 // Zone ID (link to Zone)
  capacity: number;              // ความจุ (จำนวนที่นั่ง)
  note: string;                   // หมายเหตุ
  order: number;                  // ลำดับ
  x: number;                      // ตำแหน่ง X (0-100, percent)
  y: number;                      // ตำแหน่ง Y (0-100, percent)
}
```

### ตัวอย่างข้อมูล

```json
{
  "tables": {
    "TABLE_001": {
      "id": "TABLE_001",
      "tableId": "TABLE_001",
      "tableName": "โต๊ะ 1",
      "zoneId": "ZONE_001",
      "capacity": 10,
      "note": "",
      "order": 1,
      "x": 25,
      "y": 30
    }
  }
}
```

### Fields Description

- **x, y**: ตำแหน่งบนแผนผัง (0-100, เปอร์เซ็นต์จากซ้าย/บน)
- **zoneId**: Link กับ Zone ที่โต๊ะนี้อยู่

---

## 5. RSVP

### Path: `/rsvps/{rsvpId}`

### TypeScript Interface

```typescript
interface RSVPData {
  id: string;                     // RSVP ID (unique)
  uid: string;                    // User UID (Firebase Auth) - link to Authentication
  firstName: string;              // ชื่อ
  lastName: string;                // นามสกุล
  fullName: string;                // ชื่อ-นามสกุลรวมกัน
  photoURL: string | null;        // URL ภาพจาก Facebook/Google
  nickname: string;               // ชื่อเล่น
  isComing: 'yes' | 'no';         // มาหรือไม่
  side: 'groom' | 'bride';        // ฝ่าย
  relation: string;               // ความสัมพันธ์
  note: string;                   // หมายเหตุ
  accompanyingGuestsCount: number;  // จำนวนแขกที่มาด้วย
  accompanyingGuests: Array<{      // รายชื่อแขกที่มาด้วย
    name: string;
    relationToMain: string;
  }>;
  guestId: string | null;         // Link to Guest (ถ้ามี)
  createdAt: string;              // เวลาที่สร้าง (ISO timestamp)
  updatedAt: string;              // เวลาที่อัพเดท (ISO timestamp)
}
```

### ตัวอย่างข้อมูล

```json
{
  "rsvps": {
    "RSVP_1234567890": {
      "id": "RSVP_1234567890",
      "uid": "abc123def456",
      "firstName": "สมชาย",
      "lastName": "ใจดี",
      "fullName": "สมชาย ใจดี",
      "photoURL": "https://graph.facebook.com/...",
      "nickname": "ชาย",
      "isComing": "yes",
      "side": "groom",
      "relation": "เพื่อน",
      "note": "จะมาพร้อมครอบครัว",
      "accompanyingGuestsCount": 1,
      "accompanyingGuests": [
        {
          "name": "สมหญิง ใจดี",
          "relationToMain": "ภรรยา"
        }
      ],
      "guestId": "G1234567890_123456",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Fields Description

- **uid**: Firebase Authentication UID (link กับ user ที่ login)
- **guestId**: Link กับ Guest (ถ้าถูก import แล้ว)
- **accompanyingGuests**: รายชื่อผู้ติดตาม (จะถูกสร้างเป็น Guest แยก)

---

## 6. Config

### Path: `/config`

### TypeScript Interface

```typescript
interface Config {
  inviteLink: string;              // ลิงก์เชิญ
  weddingDate: string;             // วันที่งาน (YYYY-MM-DD)
  groomName: string;               // ชื่อเจ้าบ่าว
  brideName: string;               // ชื่อเจ้าสาว
  venue: string;                   // สถานที่
  venueMapLink: string | null;     // ลิงก์แผนที่
}
```

### ตัวอย่างข้อมูล

```json
{
  "config": {
    "inviteLink": "https://got-nan-wedding.web.app",
    "weddingDate": "2024-02-14",
    "groomName": "สมชาย",
    "brideName": "สมหญิง",
    "venue": "โรงแรม ABC",
    "venueMapLink": "https://maps.google.com/..."
  }
}
```

### Access Control

- **Read**: ทุกคนอ่านได้ (public)
- **Write**: เฉพาะ Admin เท่านั้น

---

## 7. Admins

### Path: `/admins/{uid}`

### Structure

```typescript
{
  [uid: string]: boolean;  // UID ของ Admin = true
}
```

### ตัวอย่างข้อมูล

```json
{
  "admins": {
    "31y6CzqUO2aVj0VmLZAqg2LL1tJ3": true
  }
}
```

### Access Control

- **Read**: User สามารถอ่าน `/admins/{uid}` ของตัวเองได้ (เพื่อตรวจสอบ admin status)
- **Write**: ไม่มีใครสามารถเขียนได้ (ป้องกันการแก้ไขสิทธิ์)

---

## 8. Sessions

### User Sessions

#### Path: `/userSessions/{uid}`

```typescript
interface UserSession {
  isOnline: 0 | 1;              // สถานะ online (0 = offline, 1 = online)
  startedAt: string;             // เวลาเริ่มต้น session (ISO timestamp)
  sessionId: string;             // Session ID (unique, สำหรับตรวจสอบ session hijacking)
}
```

### Admin Sessions

#### Path: `/adminSessions/{uid}`

```typescript
interface AdminSession {
  isOnline: 0 | 1;
  startedAt: string;
  sessionId: string;
}
```

### Usage

- ใช้สำหรับติดตาม session ที่ active ของ user แต่ละคน
- ตรวจสอบการ login จากหลายอุปกรณ์
- Real-time sync ระหว่างอุปกรณ์

---

## 9. App State

### User App State

#### Path: `/userAppState/{uid}`

```typescript
interface UserAppState {
  currentStep?: number;          // Current step in RSVP form
  formData?: any;                // Form data (optional)
}
```

### Admin App State

#### Path: `/adminAppState/{uid}`

```typescript
interface AdminAppState {
  currentView?: string;          // Current page/view (e.g., '1', '2', '3')
  sidebarCollapsed?: boolean;    // Sidebar state (optional)
}
```

### Usage

- เก็บ UI state เพื่อ sync ระหว่างแท็บ/อุปกรณ์
- Real-time sync เมื่อมีการเปลี่ยนแปลง

---

## 10. Data Relationships

### Entity Relationship Diagram

```
Authentication (Firebase Auth)
    │
    ├── uid
    │   │
    │   ├──→ RSVP.uid
    │   │       │
    │   │       └──→ RSVP.guestId → Guest.id
    │   │
    │   └──→ Guest.rsvpUid
    │
    └──→ Admins[uid] = true

Guest
    ├── zoneId → Zone.zoneId
    ├── tableId → Table.tableId
    ├── groupId → (same for guests in same group)
    └── rsvpUid → Authentication.uid

Table
    └── zoneId → Zone.zoneId

Zone
    └── capacity (calculated from Tables)
```

### Linking Strategy

1. **Authentication ↔ RSVP**: ใช้ `uid` (Firebase Auth UID)
2. **RSVP ↔ Guest**: ใช้ `guestId` ใน RSVP และ `rsvpUid` ใน Guest
3. **Guest ↔ Zone/Table**: ใช้ `zoneId` และ `tableId`
4. **Guest Grouping**: ใช้ `groupId` และ `groupName`

---

## 11. NoSQL Data Modeling

### Best Practices

#### 1. Denormalization

เก็บข้อมูลซ้ำเพื่อให้ query เร็ว:

```typescript
// Guest มี groupId และ groupName (denormalized)
{
  groupId: "GROUP_123",
  groupName: "สมชาย ใจดี"  // ไม่ต้อง join กับ table อื่น
}
```

#### 2. Aggregates

จัดกลุ่มข้อมูลที่เกี่ยวข้องกันไว้ด้วยกัน:

```typescript
// Guests ในกลุ่มเดียวกันมี groupId เดียวกัน
guests: {
  "G1": { groupId: "GROUP_123", groupName: "สมชาย ใจดี" },
  "G2": { groupId: "GROUP_123", groupName: "สมชาย ใจดี" }
}
```

#### 3. Application-Specific Access Patterns

ออกแบบโครงสร้างข้อมูลตาม query patterns:

```typescript
// Query: "Get all guests in zone X"
// Solution: Store zoneId in Guest (denormalized)

// Query: "Get guest by RSVP UID"
// Solution: Store rsvpUid in Guest (denormalized)
```

#### 4. Security Rules Integration

ใช้ `auth.uid` เป็น key สำหรับ user data:

```typescript
// User sessions: /userSessions/{auth.uid}
// App state: /userAppState/{auth.uid}
// RSVP: rsvps/{rsvpId}.uid === auth.uid
```

---

## 📝 หมายเหตุสำคัญ

1. **Timestamps**: ใช้ ISO 8601 format (`YYYY-MM-DDTHH:mm:ss.sssZ`)
2. **IDs**: ใช้ format ที่ unique (เช่น `G{timestamp}_{random}`)
3. **Null Values**: ใช้ `null` แทน empty string สำหรับ optional fields
4. **Real-time Sync**: ข้อมูลทั้งหมด sync แบบ real-time อัตโนมัติ
5. **Data Validation**: Validate ข้อมูลทั้งฝั่ง client และ server (Firebase Rules)

---

**อัพเดทล่าสุด:** 2024

