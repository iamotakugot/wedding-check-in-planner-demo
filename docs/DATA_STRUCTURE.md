# 📊 โครงสร้างข้อมูล - Data Structure

## 📋 สารบัญ

1. [โครงสร้าง Firebase Database](#1-โครงสร้าง-firebase-database)
2. [Guest](#2-guest)
3. [Zone](#3-zone)
4. [Table](#4-table)
5. [RSVP](#5-rsvp)
6. [Config](#6-config)
7. [Admins](#7-admins)

---

## 1. โครงสร้าง Firebase Database

```
{
  "guests": { ... },
  "zones": { ... },
  "tables": { ... },
  "rsvps": { ... },
  "config": { ... },
  "admins": { ... }
}
```

---

## 2. Guest

### Path: `/guests/{guestId}`

### Structure:
```typescript
{
  id: string;                    // Guest ID
  firstName: string;              // ชื่อ
  lastName: string;               // นามสกุล
  nickname: string;               // ชื่อเล่น
  age: number | null;             // อายุ
  gender: 'male' | 'female' | 'other';  // เพศ
  relationToCouple: string;       // ความสัมพันธ์กับคู่บ่าวสาว
  side: 'groom' | 'bride' | 'both';  // ฝ่าย
  note: string;                   // หมายเหตุ
  zoneId: string | null;          // โซน ID
  tableId: string | null;         // โต๊ะ ID
  seatNumber: number | null;      // หมายเลขที่นั่ง
  groupId: string | null;         // กลุ่ม ID
  groupName: string | null;       // ชื่อกลุ่ม
  checkedInAt: string | null;     // เวลาที่เช็คอิน (ISO timestamp)
  checkInMethod: 'manual' | 'qr' | null;  // วิธีเช็คอิน
  rsvpUid: string | null;         // UID ของผู้ที่สร้าง (สำหรับ RSVP flow)
  createdAt: string;              // เวลาที่สร้าง (ISO timestamp)
  updatedAt: string;              // เวลาที่อัพเดท (ISO timestamp)
}
```

---

## 3. Zone

### Path: `/zones/{zoneId}`

### Structure:
```typescript
{
  id: string;                     // Zone ID (internal)
  zoneId: string;                 // Zone ID (public)
  zoneName: string;               // ชื่อโซน
  description: string;            // คำอธิบาย
  capacity: number;               // ความจุ (คำนวณจาก tables)
  color: string;                  // สี (hex code)
  order: number;                  // ลำดับ
}
```

---

## 4. Table

### Path: `/tables/{tableId}`

### Structure:
```typescript
{
  id: string;                     // Table ID (internal)
  tableId: string;                // Table ID (public)
  tableName: string;              // ชื่อโต๊ะ
  zoneId: string;                 // Zone ID
  capacity: number;               // ความจุ
  note: string;                   // หมายเหตุ
  order: number;                  // ลำดับ
  x: number;                      // ตำแหน่ง X (0-100)
  y: number;                      // ตำแหน่ง Y (0-100)
}
```

---

## 5. RSVP

### Path: `/rsvps/{rsvpId}`

### Structure:
```typescript
{
  id: string;                     // RSVP ID
  uid: string;                    // User UID (Firebase Auth) - มาจาก Facebook/Google Login
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

### Security Rules:
- **อ่าน/เขียน**: User ที่ login แล้ว (`auth != null`) สามารถอ่านและเขียน RSVP ได้
- **Authentication**: ใช้ Facebook หรือ Google Login
- **ดูรายละเอียดเพิ่มเติม**: [FIREBASE_RULES.md](./FIREBASE_RULES.md)

---

## 6. Config

### Path: `/config`

### Structure:
```typescript
{
  inviteLink: string;              // ลิงก์เชิญ
  weddingDate: string;             // วันที่งาน (YYYY-MM-DD)
  groomName: string;               // ชื่อเจ้าบ่าว
  brideName: string;               // ชื่อเจ้าสาว
  venue: string;                   // สถานที่
  venueMapLink: string | null;     // ลิงก์แผนที่
}
```

---

## 7. Admins

### Path: `/admins/{uid}`

### Structure:
```typescript
{
  [uid: string]: boolean;         // UID ของ Admin = true
}
```

### ตัวอย่าง:
```json
{
  "admins": {
    "31y6CzqUO2aVj0VmLZAqg2LL1tJ3": true
  }
}
```

---

## 📝 หมายเหตุ

1. **Guest** สามารถถูกสร้างได้ทั้งจาก Admin และจาก RSVP flow
2. **RSVP** ถูกสร้างโดยแขกผ่าน Guest RSVP App (ต้อง login ด้วย Facebook หรือ Google)
3. **Admins** ใช้สำหรับตรวจสอบสิทธิ์การเข้าถึง Admin Panel
4. **Config** เปิดให้อ่านได้ทุกคน แต่เขียนได้เฉพาะ Admin
5. **Authentication**: 
   - **Admin**: ใช้ Email/Password authentication
   - **Guest**: ใช้ Facebook หรือ Google authentication (Social Login)
6. **Security Rules**: ดูรายละเอียดใน [FIREBASE_RULES.md](./FIREBASE_RULES.md)

---

**อัพเดทล่าสุด:** 2024

