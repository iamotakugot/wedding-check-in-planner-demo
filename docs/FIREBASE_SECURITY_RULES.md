# Firebase Security Rules

## ⚠️ คำเตือน: Rules ปัจจุบันเป็น Public (ไม่ปลอดภัย)

Rules ปัจจุบันใน Firebase Console แจ้งว่า:
> "Your security rules are defined as public, so anyone can steal, modify, or delete data in your database"

## Security Rules ที่แนะนำ

### สำหรับ Development/Testing (ชั่วคราว - ใช้ได้ทันที)

**⚠️ หมายเหตุ:** Rules นี้เปิดให้ทุกคนอ่าน/เขียนได้ทั้งหมด ใช้สำหรับทดสอบเท่านั้น

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### สำหรับ Production (แนะนำ - ต้องมี Authentication)

**⚠️ หมายเหตุ:** Rules นี้ยังเปิดให้ทุกคนอ่าน/เขียนได้ เพราะระบบยังไม่มี Authentication

```json
{
  "rules": {
    "guests": {
      ".read": true,
      ".write": true
    },
    "zones": {
      ".read": true,
      ".write": true
    },
    "tables": {
      ".read": true,
      ".write": true
    },
    "rsvps": {
      ".read": true,
      ".write": true
    },
    "config": {
      ".read": true,
      ".write": true
    }
  }
}
```

### สำหรับ Production (ปลอดภัยที่สุด - ต้องมี Firebase Authentication)

**⚠️ หมายเหตุ:** Rules นี้ต้องมี Firebase Authentication ก่อน ถึงจะใช้ได้

```json
{
  "rules": {
    "guests": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "zones": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "tables": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "rsvps": {
      ".read": "auth != null",
      ".write": true
    },
    "config": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

## วิธีตั้งค่า Security Rules

1. ไปที่ Firebase Console: https://console.firebase.google.com
2. เลือกโปรเจกต์: `got-nan-wedding`
3. ไปที่ **Realtime Database** > **Rules**
4. Copy rules ด้านบน (เลือกตามต้องการ)
5. คลิก **Publish**

## หมายเหตุ

- **Public rules** (read/write = true) ใช้ได้สำหรับทดสอบเท่านั้น
- สำหรับ production ควรใช้ Firebase Authentication และจำกัดสิทธิ์
- ตอนนี้ระบบยังไม่มี Authentication ดังนั้นใช้ public rules ชั่วคราว

## ✅ Real-time Sync

ระบบใช้ Firebase Realtime Database ซึ่งรองรับ **real-time synchronization** อัตโนมัติ:

### การทำงาน
- เมื่อเปิด 2 เครื่องพร้อมกัน → **จะเห็นการเปลี่ยนแปลงทั้ง 2 เครื่องทันที**
- ใช้ `onValue()` listener จาก Firebase SDK
- เมื่อมีการเปลี่ยนแปลงใน Firebase → ทุกเครื่องที่ subscribe จะได้รับอัพเดทอัตโนมัติ

### ตัวอย่างการทำงาน
1. เครื่อง A: เพิ่มแขกคนใหม่ → บันทึกลง Firebase
2. เครื่อง B: **เห็นแขกคนใหม่ทันที** (ไม่ต้อง refresh)
3. เครื่อง A: แก้ไขข้อมูลแขก → บันทึกลง Firebase
4. เครื่อง B: **เห็นการแก้ไขทันที**

### ข้อมูลที่ sync แบบ real-time
- ✅ `guests` - รายชื่อแขก
- ✅ `zones` - โซนที่นั่ง
- ✅ `tables` - โต๊ะ
- ✅ `rsvps` - การตอบรับจากแขก
- ✅ `config` - การตั้งค่าระบบ

### ข้อดี
- ไม่ต้อง refresh หน้า
- เห็นการเปลี่ยนแปลงทันที
- เหมาะสำหรับใช้งานหลายคนพร้อมกัน

