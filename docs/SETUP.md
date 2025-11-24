# คู่มือการติดตั้งและตั้งค่า

## ความต้องการของระบบ

- Node.js v18.0.0+
- npm v9.0.0+
- Firebase Project

## ติดตั้ง Dependencies

```bash
npm install
```

## ตั้งค่า Firebase

1. สร้าง Firebase Project ใน [Firebase Console](https://console.firebase.google.com/)
2. เปิดใช้งาน Realtime Database
3. เปิดใช้งาน Authentication (Email/Password, Google, Facebook)
4. อัปเดต `src/firebase/config.ts` ด้วย Firebase config ของคุณ
5. Deploy Firebase Rules (รวม .indexOn rules สำหรับ performance):

```bash
firebase deploy --only database
```

**หมายเหตุ**: Rules ประกอบด้วย `.indexOn` rules สำหรับ:
- `rsvps`: uid, isComing, guestId
- `guests`: rsvpUid, rsvpId, groupId, zoneId, tableId, checkedInAt
- `zones`: order
- `tables`: zoneId, order

## ตั้งค่า Admin Account

1. สร้าง user ใน Firebase Authentication
2. เพิ่ม UID ของ user ลงใน `/admins/{uid}` ใน Realtime Database:

```json
{
  "admins": {
    "your-uid-here": true
  }
}
```

## รัน Development Server

```bash
npm run dev
```

## Build และ Deploy

```bash
npm run build
firebase deploy
```

## Migration (ถ้ามีข้อมูลเก่า)

```bash
npx ts-node scripts/migrate-database.ts
```
