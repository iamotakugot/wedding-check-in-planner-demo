# 🛠️ คู่มือการตั้งค่า - Setup Guide

## 📋 สารบัญ

1. [ติดตั้ง Dependencies](#1-ติดตั้ง-dependencies)
2. [ตั้งค่า Firebase](#2-ตั้งค่า-firebase)
3. [รันโปรเจกต์](#3-รันโปรเจกต์)
4. [ตั้งค่า Admin Account](#4-ตั้งค่า-admin-account)

---

## 1. ติดตั้ง Dependencies

```bash
npm install
```

---

## 2. ตั้งค่า Firebase

### 2.1 ตรวจสอบ Firebase Config

ไฟล์ `src/firebase/config.ts` มี config แล้ว:
- ✅ apiKey
- ✅ authDomain
- ✅ databaseURL
- ✅ projectId
- ✅ storageBucket
- ✅ messagingSenderId
- ✅ appId

### 2.2 ตั้งค่า Security Rules

ดูคู่มือใน [FIREBASE_RULES.md](./FIREBASE_RULES.md)

---

## 3. รันโปรเจกต์

```bash
npm run dev
```

เปิดเบราว์เซอร์:
- **Admin Panel**: `http://localhost:5173/admin`
- **Guest RSVP**: `http://localhost:5173/`

---

## 4. ตั้งค่า Admin Account

ดูคู่มือใน [ADMIN_LOGIN.md](./ADMIN_LOGIN.md)

---

## ✅ Checklist

- [ ] ติดตั้ง dependencies แล้ว
- [ ] ตั้งค่า Firebase Config แล้ว
- [ ] ตั้งค่า Security Rules แล้ว
- [ ] สร้าง Admin Account แล้ว
- [ ] ล็อกอิน Admin ได้แล้ว

---

**อัพเดทล่าสุด:** 2024

