# Firebase Setup Guide

## ขั้นตอนการ Setup Firebase

### 1. สร้าง Firebase Project (ทำเสร็จแล้ว ✅)

- Project ID: `got-nan-wedding`
- Database URL: `https://got-nan-wedding-default-rtdb.asia-southeast1.firebasedatabase.app`

### 2. ตั้งค่า Security Rules

⚠️ **สำคัญ**: ตอนนี้ Security Rules เป็น Public (ไม่ปลอดภัย)

**วิธีแก้ไข:**

1. ไปที่ Firebase Console: https://console.firebase.google.com
2. เลือกโปรเจกต์: `got-nan-wedding`
3. ไปที่ **Realtime Database** > **Rules**
4. ตั้งค่า rules ตาม `docs/FIREBASE_SECURITY_RULES.md`
5. คลิก **Publish**

**สำหรับ Development (ชั่วคราว):**
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### 3. ตรวจสอบ Firebase Config

ไฟล์ `src/firebase/config.ts` มี config แล้ว:
- ✅ apiKey
- ✅ authDomain
- ✅ databaseURL
- ✅ projectId
- ✅ storageBucket
- ✅ messagingSenderId
- ✅ appId

### 4. Test การเชื่อมต่อ

1. รัน `npm run dev`
2. เปิดหน้า Admin และ Login
3. ตรวจสอบว่า:
   - ข้อมูล migrate จาก mockData ไป Firebase แล้ว
   - สามารถเพิ่ม/แก้ไข/ลบ Guest ได้
   - Real-time sync ทำงาน (เปิด 2 tabs แล้วแก้ไขดู)

### 5. ตรวจสอบใน Firebase Console

1. ไปที่ **Realtime Database** > **Data**
2. ควรเห็นโครงสร้าง:
```
{
  "guests": { ... },
  "zones": { ... },
  "tables": { ... },
  "rsvps": { ... },
  "config": { ... }
}
```

## Troubleshooting

### ปัญหา: "Permission denied"
- ตรวจสอบ Security Rules ว่า allow read/write หรือไม่

### ปัญหา: "Database not found"
- ตรวจสอบ databaseURL ใน config.ts
- ตรวจสอบว่า Realtime Database ถูกสร้างแล้ว

### ปัญหา: "Network error"
- ตรวจสอบ internet connection
- ตรวจสอบว่า Firebase project ยัง active อยู่

## Next Steps

1. ✅ Firebase integration เสร็จแล้ว
2. ⏳ ตั้งค่า Security Rules ให้ปลอดภัยขึ้น
3. ⏳ (Optional) เพิ่ม Firebase Authentication สำหรับ admin
4. ⏳ Deploy ไป Firebase Hosting

