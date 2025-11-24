# 🛠️ คู่มือการติดตั้งและตั้งค่า

## 📋 สารบัญ

1. [ความต้องการของระบบ](#1-ความต้องการของระบบ)
2. [ติดตั้ง Dependencies](#2-ติดตั้ง-dependencies)
3. [ตั้งค่า Firebase](#3-ตั้งค่า-firebase)
4. [ตั้งค่า Security Rules](#4-ตั้งค่า-security-rules)
5. [ตั้งค่า Admin Account](#5-ตั้งค่า-admin-account)
6. [รันโปรเจกต์](#6-รันโปรเจกต์)
7. [Deploy to Production](#7-deploy-to-production)

---

## 1. ความต้องการของระบบ

### Software Requirements

- **Node.js**: v18.0.0 หรือสูงกว่า
- **npm**: v9.0.0 หรือสูงกว่า
- **Git**: สำหรับ clone repository

### Firebase Requirements

- **Firebase Project**: สร้างโปรเจกต์ใน Firebase Console
- **Realtime Database**: เปิดใช้งาน Realtime Database
- **Authentication**: เปิดใช้งาน Authentication (Email/Password, Google, Facebook)

---

## 2. ติดตั้ง Dependencies

### Clone Repository

```bash
git clone <repository-url>
cd wedding-planner
```

### Install Dependencies

```bash
npm install
```

### Verify Installation

```bash
npm run typecheck
```

---

## 3. ตั้งค่า Firebase

### 3.1 สร้าง Firebase Project

1. ไปที่ [Firebase Console](https://console.firebase.google.com)
2. คลิก "Add project"
3. ตั้งชื่อโปรเจกต์ (เช่น `got-nan-wedding`)
4. เปิดใช้งาน Google Analytics (optional)

### 3.2 เปิดใช้งาน Realtime Database

1. ไปที่ **Realtime Database** ใน Firebase Console
2. คลิก "Create Database"
3. เลือก location (เช่น `asia-southeast1`)
4. เลือก **Start in test mode** (จะตั้ง Security Rules ในขั้นตอนถัดไป)

### 3.3 เปิดใช้งาน Authentication

1. ไปที่ **Authentication** ใน Firebase Console
2. คลิก "Get started"
3. เปิดใช้งาน **Email/Password** provider
4. เปิดใช้งาน **Google** provider
5. เปิดใช้งาน **Facebook** provider

#### สำหรับ Facebook Provider

1. ไปที่ [Facebook Developers](https://developers.facebook.com/)
2. สร้าง App และเพิ่ม Facebook Login
3. คัดลอก **App ID** และ **App Secret**
4. ใส่ใน Firebase Console → Authentication → Sign-in method → Facebook

### 3.4 ตรวจสอบ Firebase Config

ไฟล์ `src/firebase/config.ts` ควรมี config ดังนี้:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**หมายเหตุ**: Config นี้ควรมีอยู่แล้วในโปรเจกต์ แต่ถ้ายังไม่มี ให้คัดลอกจาก Firebase Console → Project Settings → General → Your apps

---

## 4. ตั้งค่า Security Rules

### 4.1 Copy Security Rules

เปิดไฟล์ `database.rules.json` ในโปรเจกต์ (ควรมีอยู่แล้ว)

### 4.2 Deploy Rules to Firebase

#### วิธีที่ 1: ใช้ Firebase CLI

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already initialized)
firebase init

# Deploy rules
firebase deploy --only database
```

#### วิธีที่ 2: ใช้ Firebase Console

1. ไปที่ Firebase Console → Realtime Database → Rules
2. Copy เนื้อหาจาก `database.rules.json`
3. Paste ลงใน Rules editor
4. คลิก "Publish"

### 4.3 ตรวจสอบ Rules

หลังจาก deploy แล้ว ตรวจสอบว่า Rules ถูก publish จริงๆ โดยดูที่ timestamp ใน Firebase Console

---

## 5. ตั้งค่า Admin Account

### 5.1 สร้าง Admin User ใน Firebase Authentication

1. ไปที่ Firebase Console → Authentication → Users
2. คลิก "Add user" (หรือ "Add user manually")
3. กรอกข้อมูล:
   - **Email**: ใส่ email ที่ต้องการใช้เป็น admin (เช่น `admin@admin.com`)
   - **Password**: ตั้งรหัสผ่านที่แข็งแรง (อย่างน้อย 6 ตัวอักษร)
4. คลิก "Add user"

### 5.2 คัดลอก Admin UID

1. หลังจากสร้าง user แล้ว จะเห็นรายการ user ในตาราง
2. คลิกที่ user ที่เพิ่งสร้าง
3. **คัดลอก UID** (จะเป็น string ยาวๆ เช่น `31y6CzqUO2aVj0VmLZAqg2LL1tJ3`)
4. **เก็บ UID นี้ไว้** - จะใช้ในขั้นตอนต่อไป

### 5.3 เพิ่ม Admin UID ใน Database

1. ไปที่ Firebase Console → Realtime Database → Data
2. คลิกที่ node **`admins`** (ถ้ายังไม่มี ให้สร้างใหม่)
3. คลิก **+** (Add node)
4. ใส่ชื่อ node: **UID ที่คัดลอกไว้**
5. ใส่ค่า: **`true`**
6. คลิก **Add**

**โครงสร้างที่ถูกต้อง:**

```json
{
  "admins": {
    "31y6CzqUO2aVj0VmLZAqg2LL1tJ3": true
  }
}
```

### 5.4 ทดสอบ Admin Login

1. รันโปรเจกต์: `npm run dev`
2. เปิดเบราว์เซอร์: `http://localhost:5173/admin`
3. ล็อกอินด้วย Email และ Password ที่สร้างไว้
4. ควรจะเข้าสู่ระบบได้และเห็น Dashboard

---

## 6. รันโปรเจกต์

### Development Mode

```bash
npm run dev
```

เปิดเบราว์เซอร์:
- **Admin Panel**: `http://localhost:5173/admin`
- **Guest RSVP**: `http://localhost:5173/`

### Build for Production

```bash
npm run build
```

ไฟล์ที่ build จะอยู่ในโฟลเดอร์ `dist/`

### Preview Production Build

```bash
npm run preview
```

---

## 7. Deploy to Production

### 7.1 ตั้งค่า Firebase Hosting

#### ใช้ Firebase CLI

```bash
# Initialize Firebase Hosting (if not already initialized)
firebase init hosting

# Select:
# - Use an existing project
# - Public directory: dist
# - Configure as a single-page app: Yes
# - Set up automatic builds: No (optional)
```

#### ตรวจสอบ firebase.json

ไฟล์ `firebase.json` ควรมีโครงสร้างดังนี้:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "database": {
    "rules": "database.rules.json"
  }
}
```

### 7.2 Build และ Deploy

```bash
# Build project
npm run build

# Deploy to Firebase
firebase deploy
```

หรือ deploy เฉพาะ hosting:

```bash
firebase deploy --only hosting
```

### 7.3 ตรวจสอบ Deployment

หลังจาก deploy สำเร็จ จะได้ URL เช่น:
- `https://got-nan-wedding.web.app`
- `https://got-nan-wedding.firebaseapp.com`

---

## ✅ Checklist

### Development Setup

- [ ] ติดตั้ง Node.js และ npm แล้ว
- [ ] Clone repository แล้ว
- [ ] ติดตั้ง dependencies แล้ว (`npm install`)
- [ ] สร้าง Firebase Project แล้ว
- [ ] เปิดใช้งาน Realtime Database แล้ว
- [ ] เปิดใช้งาน Authentication แล้ว (Email/Password, Google, Facebook)
- [ ] ตั้งค่า Firebase Config ใน `src/firebase/config.ts` แล้ว
- [ ] Deploy Security Rules แล้ว
- [ ] สร้าง Admin Account แล้ว
- [ ] เพิ่ม Admin UID ใน Database แล้ว
- [ ] ทดสอบ Admin Login ได้แล้ว
- [ ] รันโปรเจกต์ได้แล้ว (`npm run dev`)

### Production Setup

- [ ] Build project สำเร็จแล้ว (`npm run build`)
- [ ] ตั้งค่า Firebase Hosting แล้ว
- [ ] Deploy to Firebase แล้ว
- [ ] ทดสอบ Production URL แล้ว

---

## 🐛 Troubleshooting

### ปัญหา: "Cannot find module"

**สาเหตุ**: Dependencies ยังไม่ได้ติดตั้ง

**วิธีแก้**:
```bash
npm install
```

### ปัญหา: "Firebase: Error (auth/invalid-api-key)"

**สาเหตุ**: Firebase Config ไม่ถูกต้อง

**วิธีแก้**: ตรวจสอบ `src/firebase/config.ts` และคัดลอก config จาก Firebase Console

### ปัญหา: "PERMISSION_DENIED" เมื่อเข้าถึงข้อมูล

**สาเหตุ**: Security Rules ยังไม่ได้ deploy หรือ Admin UID ยังไม่ได้เพิ่ม

**วิธีแก้**:
1. ตรวจสอบว่า Security Rules ถูก deploy แล้ว
2. ตรวจสอบว่า Admin UID ถูกเพิ่มใน `/admins/{uid}` แล้ว

### ปัญหา: "บัญชีนี้ไม่มีสิทธิ์เข้าถึง Admin Panel"

**สาเหตุ**: Admin UID ยังไม่ได้เพิ่มใน Database

**วิธีแก้**: ทำตามขั้นตอนที่ 5.3

---

## 📝 หมายเหตุ

1. **เก็บ Firebase Config ไว้เป็นความลับ** - อย่า commit ลง Git (ควรใช้ environment variables)
2. **เก็บ Admin Credentials ไว้ในที่ปลอดภัย**
3. **ตรวจสอบ Security Rules** ก่อน deploy to production
4. **Backup Database** เป็นประจำ

---

**อัพเดทล่าสุด:** 2024

