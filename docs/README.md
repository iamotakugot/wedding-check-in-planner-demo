# Wedding Planner - ระบบจัดการงานแต่งงาน

ระบบจัดการงานแต่งงานแบบ Real-time ที่ใช้ Firebase Realtime Database และ React

## ✨ Features

- **Guest RSVP App**: หน้า card เชิญแต่งงานสำหรับแขก
- **Admin Panel**: ระบบจัดการงานแต่งงานสำหรับผู้ดูแล
  - Dashboard: สถิติภาพรวม
  - จัดการแขก: เพิ่ม/แก้ไข/ลบแขก, เช็คอิน, Group Check-in (checkbox per guest)
    - Tree Data Table: แสดงแขกแบบ expandable rows (กลุ่มละ 1, 1.1, 1.2, ...)
    - คอลัมน์ลำดับ: แสดงลำดับกลุ่ม (1, 2, 3, ...) และลำดับสมาชิกในกลุ่ม (1.1, 1.2, ...)
  - จัดการที่นั่ง: จัดโซนและโต๊ะ, Click-based Assignment
  - RSVP: ดูรายการตอบรับ
  - ตั้งค่า: จัดการการ์ดแต่งงานและลิงค์เชิญ

## 🆕 New in 2025 Update

- ✅ **Group Check-in with Checkbox Selection**: เช็คอินแขกหลายคนพร้อมกันจากกลุ่มเดียวกัน
- ✅ **Click-based Seating Assignment**: จัดที่นั่งแบบคลิก (เลือกแขก → คลิกโต๊ะ)
- ✅ **RSVP Status Integration**: ผูกสถานะตอบรับ (`isComing`) กับสิทธิ์เช็คอิน
- ✅ **UI Text Updates**: เปลี่ยนข้อความ "RSVP" เป็น "ตอบรับร่วมงาน"
- ✅ **Facebook Login Fix**: แก้ไขปัญหา Facebook Login ใน Messenger WebView
- ✅ **Configuration Update**: แก้ไขนามสกุล "Pisapeng" → "Phitpheng"
- ✅ **Tree Data Table with Row Numbers**: ตารางแขกแสดงแบบ expandable rows พร้อมลำดับ (กลุ่มละ 1, 1.1, 1.2, ...)

## 🚀 Quick Start

### ติดตั้ง Dependencies

```bash
npm install
```

### ตั้งค่า Firebase

1. สร้างไฟล์ `.env.local`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
```

2. อัปเดต `database.rules.json` ใน Firebase Console

### รัน Development Server

```bash
npm run dev
```

### Build และ Deploy

```bash
npm run build
firebase deploy
```

## 📁 โครงสร้างโปรเจกต์

```
src/
├── card/                    # หน้า card เชิญแต่งงาน
│   ├── GuestRSVPApp.tsx
│   └── MusicPlayer.tsx
├── pages/
│   ├── admin/              # Admin Panel
│   │   ├── AdminLayout.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── GuestsPage.tsx
│   │   ├── SeatingPage.tsx
│   │   ├── RSVPsPage.tsx
│   │   └── SettingsPage.tsx
│   └── AdminLoginPage.tsx
├── services/
│   └── firebase/           # Firebase Service Classes (Singleton pattern)
│       ├── AuthService.ts
│       ├── RSVPService.ts
│       ├── GuestService.ts
│       ├── ZoneService.ts
│       ├── TableService.ts
│       ├── ConfigService.ts
│       ├── sessions.ts
│       └── appState.ts
├── managers/                # Business Logic Managers
│   ├── RSVPManager.ts
│   ├── SeatingManager.ts
│   └── CheckInManager.ts
├── hooks/                   # Custom hooks
├── utils/                   # Utility functions
└── types.ts                 # TypeScript types
```

## 🔐 Security

- Firebase Authentication สำหรับ login
- Firebase Realtime Database Rules สำหรับ authorization
- Admin-only access สำหรับ Admin Panel

## 📝 License

MIT
