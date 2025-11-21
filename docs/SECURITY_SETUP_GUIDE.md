# 🔐 คู่มือการตั้งค่าความปลอดภัย - Security Setup Guide

## ⚠️ สำคัญ: ต้องทำตามขั้นตอนนี้ก่อนใช้งาน Production

คู่มือนี้จะช่วยคุณตั้งค่า Firebase Security Rules และ Admin Account เพื่อป้องกันการเข้าถึงข้อมูลโดยไม่ได้รับอนุญาต

---

## 📋 สารบัญ

1. [สร้าง Admin Account ใน Firebase](#1-สร้าง-admin-account-ใน-firebase)
2. [ตั้งค่า Firebase Security Rules](#2-ตั้งค่า-firebase-security-rules)
3. [เพิ่ม Admin UID ใน Database](#3-เพิ่ม-admin-uid-ใน-database)
4. [ทดสอบระบบ](#4-ทดสอบระบบ)
5. [แก้ไขปัญหา](#5-แก้ไขปัญหา)

---

## 1. สร้าง Admin Account ใน Firebase

### ขั้นตอนที่ 1.1: เปิด Firebase Console

1. ไปที่: https://console.firebase.google.com
2. เลือกโปรเจกต์: **got-nan-wedding**

### ขั้นตอนที่ 1.2: สร้าง Admin User

1. ไปที่เมนู **Authentication** (ด้านซ้าย)
2. คลิกแท็บ **Users**
3. คลิกปุ่ม **Add user** (หรือ **Add user manually**)
4. กรอกข้อมูล:
   - **Email**: ใส่ email ที่ต้องการใช้เป็น admin (เช่น `admin@example.com`)
   - **Password**: ตั้งรหัสผ่านที่แข็งแรง (อย่างน้อย 6 ตัวอักษร)
5. คลิก **Add user**

### ขั้นตอนที่ 1.3: คัดลอก UID

1. หลังจากสร้าง user แล้ว จะเห็นรายการ user ในตาราง
2. คลิกที่ user ที่เพิ่งสร้าง
3. **คัดลอก UID** (จะเป็น string ยาวๆ เช่น `abc123def456ghi789`)
4. **เก็บ UID นี้ไว้** - จะใช้ในขั้นตอนต่อไป

**ตัวอย่าง UID:**
```
abc123def456ghi789jkl012mno345pqr678stu901vwx234
```

---

## 2. ตั้งค่า Firebase Security Rules

### ขั้นตอนที่ 2.1: เปิดหน้า Rules

1. ใน Firebase Console ไปที่ **Realtime Database**
2. คลิกแท็บ **Rules** (ด้านบน)

### ขั้นตอนที่ 2.2: Copy และ Paste Security Rules

**ลบ Rules เดิมทั้งหมด** แล้ว **Copy Rules ด้านล่างนี้**:

```json
{
  "rules": {
    "guests": {
      ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
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

### ขั้นตอนที่ 2.3: Publish Rules

1. วาง Rules ลงใน editor
2. คลิกปุ่ม **Publish** (สีเขียว)
3. รอให้ระบบบันทึก (จะแสดงข้อความ "Rules published successfully")

**หมายเหตุ:**
- Rules นี้จะบล็อกการเข้าถึงข้อมูลทั้งหมดจนกว่าจะเพิ่ม Admin UID ในขั้นตอนที่ 3
- **อย่าตกใจ** ถ้าเห็น error ในแอพ - นี่เป็นเรื่องปกติ จนกว่าจะตั้งค่าเสร็จ

---

## 3. เพิ่ม Admin UID ใน Database

### ขั้นตอนที่ 3.1: เปิดหน้า Database

1. ใน Firebase Console ไปที่ **Realtime Database**
2. คลิกแท็บ **Data** (ด้านบน)

### ขั้นตอนที่ 3.2: สร้าง Node `admins`

1. คลิกที่ **+** (Add node) ด้านบนสุด
2. ใส่ชื่อ node: **`admins`**
3. คลิก **Add**

### ขั้นตอนที่ 3.3: เพิ่ม Admin UID

1. คลิกที่ node **`admins`** ที่เพิ่งสร้าง
2. คลิก **+** (Add node) อีกครั้ง
3. ใส่ชื่อ node: **UID ที่คัดลอกไว้** (จากขั้นตอนที่ 1.3)
4. ใส่ค่า: **`true`**
5. คลิก **Add**

**ตัวอย่างโครงสร้าง:**
```
admins
  └── abc123def456ghi789jkl012mno345pqr678stu901vwx234: true
```

### ขั้นตอนที่ 3.4: ตรวจสอบ

ตรวจสอบว่าโครงสร้างถูกต้อง:
- มี node `admins` ที่ root level
- ภายใน `admins` มี UID ของ admin
- ค่าของ UID เป็น `true`

---

## 4. ทดสอบระบบ

### ขั้นตอนที่ 4.1: ทดสอบ Admin Login

1. เปิดเว็บแอพ: `https://got-nan-wedding.web.app/admin`
2. ใส่ **Email** และ **Password** ที่สร้างไว้ในขั้นตอนที่ 1.2
3. คลิก **เข้าสู่ระบบ**
4. ควรจะเข้าสู่ระบบได้และเห็น Dashboard

### ขั้นตอนที่ 4.2: ทดสอบ Guest RSVP

1. เปิดเว็บแอพ: `https://got-nan-wedding.web.app/`
2. ควรจะเห็นหน้า Guest RSVP App
3. ทดสอบ Login ด้วย Google/Facebook
4. ควรจะสามารถกรอก RSVP ได้

### ขั้นตอนที่ 4.3: ทดสอบการป้องกัน

1. เปิด **Developer Tools** (F12)
2. ไปที่ **Console**
3. พยายามเข้าถึงข้อมูลโดยตรง (ถ้าทำได้)
4. ควรจะเห็น error ว่า "Permission denied"

---

## 5. แก้ไขปัญหา

### ปัญหา: "Permission denied" เมื่อ Login หรือ "Error checking admin status"

**สาเหตุ:** 
1. ยังไม่ได้เพิ่ม Admin UID ใน Database
2. Security Rules บล็อกการอ่าน `/admins` (Rules เก่า)

**วิธีแก้:**
1. **ตรวจสอบ Security Rules:** ต้องมี Rules ที่อนุญาตให้อ่าน `/admins/{uid}` ของตัวเอง:
   ```json
   "admins": {
     "$uid": {
       ".read": "auth != null && auth.uid === $uid"
     },
     ".read": false,
     ".write": false
   }
   ```
2. **ตรวจสอบว่าได้เพิ่ม UID ใน `/admins/{UID}` แล้ว**
3. **ตรวจสอบว่าค่าเป็น `true`**
4. **ตรวจสอบว่า UID ถูกต้อง** (คัดลอกมาถูกต้อง)

### ปัญหา: "ไม่พบผู้ใช้นี้ในระบบ"

**สาเหตุ:** Email ที่ใส่ไม่ตรงกับที่สร้างใน Firebase

**วิธีแก้:**
1. ตรวจสอบ Email ใน Firebase Console > Authentication > Users
2. ใช้ Email ที่ถูกต้อง

### ปัญหา: "รหัสผ่านไม่ถูกต้อง"

**สาเหตุ:** รหัสผ่านผิด

**วิธีแก้:**
1. ตรวจสอบรหัสผ่านใน Firebase Console
2. หรือ Reset Password:
   - ไปที่ Authentication > Users
   - คลิกที่ user
   - คลิก "Reset password"

### ปัญหา: "บัญชีนี้ไม่มีสิทธิ์เข้าถึง Admin Panel"

**สาเหตุ:** UID ของ user นี้ไม่ได้อยู่ใน `/admins`

**วิธีแก้:**
1. ตรวจสอบ UID ของ user ใน Authentication > Users
2. เพิ่ม UID นี้ใน `/admins/{UID}` = `true`

### ปัญหา: Guest ไม่สามารถกรอก RSVP ได้

**สาเหตุ:** Security Rules บล็อกการเขียน RSVP

**วิธีแก้:**
ตรวจสอบ Rules ส่วน `rsvps`:
```json
"rsvps": {
  ".read": "auth != null",
  ".write": "auth != null"
}
```

Rules นี้ควรจะอนุญาตให้ user ที่ login แล้วเขียน RSVP ได้

---

## ✅ Checklist

ทำตามขั้นตอนนี้เสร็จแล้วหรือยัง?

- [ ] สร้าง Admin Account ใน Firebase Authentication
- [ ] คัดลอก Admin UID ไว้
- [ ] ตั้งค่า Firebase Security Rules
- [ ] เพิ่ม Admin UID ใน Database (`/admins/{UID}` = `true`)
- [ ] ทดสอบ Admin Login ได้
- [ ] ทดสอบ Guest RSVP ได้
- [ ] ระบบทำงานปกติ

---

## 📝 หมายเหตุสำคัญ

1. **เก็บ Email และ Password ของ Admin ไว้ในที่ปลอดภัย**
2. **อย่าแชร์ Admin UID ให้คนอื่น**
3. **ถ้าต้องการเพิ่ม Admin คนอื่น:** ทำตามขั้นตอนที่ 1 และ 3 (สร้าง user ใหม่ และเพิ่ม UID ใน `/admins`)
4. **ถ้าลืมรหัสผ่าน:** ใช้ฟีเจอร์ "Reset password" ใน Firebase Console

---

## 🔒 Security Rules อธิบาย

### Guests, Zones, Tables
- **อ่าน/เขียน:** เฉพาะ Admin เท่านั้น (ตรวจสอบจาก `/admins/{uid}`)

### RSVPs
- **อ่าน:** User ที่ login แล้ว
- **เขียน:** User ที่ login แล้ว (แขกสามารถกรอก RSVP ได้)

### Config
- **อ่าน:** ทุกคน (เปิดให้อ่านได้)
- **เขียน:** เฉพาะ Admin เท่านั้น

### Admins
- **อ่าน:** User สามารถอ่าน `/admins/{uid}` ของตัวเองได้ (เพื่อตรวจสอบ admin status)
- **เขียน:** ไม่มีใครสามารถเขียนได้ (ป้องกันการแก้ไขสิทธิ์)
- **หมายเหตุ:** User ไม่สามารถอ่าน `/admins` ทั้งหมดหรือ UID ของคนอื่นได้

---

## 📞 ติดต่อ

ถ้ามีปัญหาหรือคำถาม:
1. ตรวจสอบ Console ใน Browser (F12)
2. ตรวจสอบ Firebase Console > Realtime Database > Rules
3. ตรวจสอบว่า Admin UID ถูกต้อง

---

**สร้างเมื่อ:** 2024
**อัพเดทล่าสุด:** 2024

