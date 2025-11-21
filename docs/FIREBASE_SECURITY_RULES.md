# Firebase Security Rules

## ⚠️ สำคัญ: ใช้ Security Rules นี้สำหรับ Production

**⚠️ คำเตือน:** Rules เก่าเป็น Public (ไม่ปลอดภัย) - **ต้องเปลี่ยนเป็น Rules ใหม่ทันที**

## Security Rules สำหรับ Production (แนะนำ)

**Rules นี้จะป้องกันการเข้าถึงข้อมูลโดยไม่ได้รับอนุญาต**

```json
{
  "rules": {
    "guests": {
      ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
      "$guestId": {
        ".read": "auth != null && (root.child('admins').child(auth.uid).exists() || data.child('rsvpUid').val() === auth.uid)",
        ".write": "auth != null && (root.child('admins').child(auth.uid).exists() || (data.exists() && data.child('rsvpUid').val() === auth.uid && newData.child('rsvpUid').val() === auth.uid) || (!data.exists() && newData.child('rsvpUid').val() === auth.uid))",
        ".validate": "!newData.exists() || root.child('admins').child(auth.uid).exists() || newData.child('rsvpUid').val() === auth.uid"
      }
    },
    "zones": {
      ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },
    "tables": {
      ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },
    "rsvps": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "config": {
      ".read": true,
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },
    "admins": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid"
      },
      ".read": false,
      ".write": false
    }
  }
}
```

### อธิบาย Rules

- **guests**: 
  - **อ่าน**: Admin หรือแขกที่สร้าง Guest เอง (ตรวจสอบจาก `rsvpUid`)
  - **เขียน**: 
    - Admin สามารถทำทุกอย่างได้
    - แขกสามารถสร้าง Guest ใหม่ได้ (ต้องมี `rsvpUid === auth.uid`)
    - แขกสามารถแก้ไข Guest ที่ตัวเองสร้างได้ (ต้องมี `rsvpUid === auth.uid`)
    - แขกไม่สามารถลบ Guest ได้ (ให้ Admin เป็นคนลบ)
- **zones, tables**: เฉพาะ Admin เท่านั้นที่อ่าน/เขียนได้ (ตรวจสอบจาก `/admins/{uid}`)
- **rsvps**: User ที่ login แล้วสามารถอ่าน/เขียนได้ (แขกสามารถกรอก RSVP ได้)
- **config**: ทุกคนอ่านได้, เฉพาะ Admin เท่านั้นที่เขียนได้
- **admins**: 
  - User สามารถอ่าน `/admins/{uid}` ของตัวเองได้ (เพื่อตรวจสอบ admin status)
  - ไม่สามารถอ่าน `/admins` ทั้งหมดหรือ UID ของคนอื่นได้
  - ไม่มีใครสามารถเขียนได้ (ป้องกันการแก้ไขสิทธิ์)

## วิธีตั้งค่า Security Rules

**⚠️ สำคัญ:** ต้องทำตามขั้นตอนใน `docs/SECURITY_SETUP_GUIDE.md` ก่อน

1. ไปที่ Firebase Console: https://console.firebase.google.com
2. เลือกโปรเจกต์: `got-nan-wedding`
3. ไปที่ **Realtime Database** > **Rules**
4. Copy rules ด้านบน (Production Rules)
5. คลิก **Publish**

## หมายเหตุ

- **Rules นี้ต้องมี Admin Account และ Admin UID ใน Database ก่อน**
- ดูคู่มือการตั้งค่า: `docs/SECURITY_SETUP_GUIDE.md`
- หลังจากตั้งค่า Rules แล้ว ระบบจะบล็อกการเข้าถึงข้อมูลทั้งหมดจนกว่าจะเพิ่ม Admin UID

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

