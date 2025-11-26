# Wedding Planner - ระบบจัดการงานแต่งงาน

ระบบจัดการงานแต่งงานแบบ Real-time ที่ใช้ Firebase Realtime Database และ React

## ✨ Features

- **Guest RSVP App**: หน้า card เชิญแต่งงานสำหรับแขก
- **Admin Panel**: ระบบจัดการงานแต่งงานสำหรับผู้ดูแล (Responsive Design)
  - Dashboard: สถิติภาพรวม (รองรับ mobile, tablet, desktop)
  - จัดการแขก: เพิ่ม/แก้ไข/ลบแขก, เช็คอิน, Group Check-in (checkbox per guest)
    - Tree Data Table: แสดงแขกแบบ expandable rows (กลุ่มละ 1, 1.1, 1.2, ...)
    - คอลัมน์ลำดับ: แสดงลำดับกลุ่ม (1, 2, 3, ...) และลำดับสมาชิกในกลุ่ม (1.1, 1.2, ...)
    - Responsive Table: รองรับทุกขนาดหน้าจอ พร้อม horizontal scroll
  - จัดการที่นั่ง: จัดโซนและโต๊ะ, Click-based Assignment, Cascader Filter, Bulk Unassign
    - Responsive Canvas: ปรับขนาดตามหน้าจอ
    - Mobile Drawer: ใช้ Drawer สำหรับ sidebar บน mobile
  - RSVP: ดูรายการตอบรับ (Responsive Table)
  - ตั้งค่า: จัดการการ์ดแต่งงานและลิงค์เชิญ (Responsive Form)

## 📱 Responsive Design

ระบบรองรับทุกอุปกรณ์:
- **Mobile** (< 768px): Layout แบบ vertical, Drawer สำหรับ sidebar, ปุ่มและ text ขนาดเหมาะสม
- **Tablet** (768px - 1024px): Layout แบบ hybrid, sidebar แบบ collapsible
- **Desktop** (> 1024px): Layout แบบเต็มรูปแบบ, sidebar แบบ fixed

## 🆕 New in 2025 Update

- ✅ **Group Check-in with Checkbox Selection**: เช็คอินแขกหลายคนพร้อมกันจากกลุ่มเดียวกัน
- ✅ **Click-based Seating Assignment**: จัดที่นั่งแบบคลิก (เลือกแขก → คลิกโต๊ะ)
- ✅ **RSVP Status Integration**: ผูกสถานะตอบรับ (`isComing`) กับสิทธิ์เช็คอิน
- ✅ **UI Text Updates**: เปลี่ยนข้อความ "RSVP" เป็น "ตอบรับร่วมงาน"
- ✅ **Google Login Only**: ใช้ Google Login เท่านั้น (ลบ Facebook Login)
- ✅ **iOS Safari Redirect Fix**: แก้ไขปัญหา redirect login บน iOS Safari ให้ทำงานได้ถูกต้อง
- ✅ **Configuration Update**: แก้ไขนามสกุล "Pisapeng" → "Phitpheng"
- ✅ **Tree Data Table with Row Numbers**: ตารางแขกแสดงแบบ expandable rows พร้อมลำดับ (กลุ่มละ 1, 1.1, 1.2, ...)
- ✅ **Timestamp Columns**: เพิ่มคอลัมน์เวลาแก้ไขในหน้า RSVPs และเวลาเช็คอินในหน้า Guests
- ✅ **Auto-refresh Guest Groups**: แก้ไขปัญหาการอัพเดตแขกที่ยังไม่ได้จัดที่นั่งหลังลบโซน/โต๊ะ
- ✅ **Duplicate Guest Prevention**: ป้องกันการแสดงแขกซ้ำในกลุ่มเดียวกัน
- ✅ **Main Guest Selection**: ปรับปรุงการเลือก main guest ให้ถูกต้องตามชื่อใน RSVP
- ✅ **Performance Optimization**: ลด re-render ที่ไม่จำเป็นใน useGuestGroups hook
- ✅ **Responsive Admin UI**: Redesign หน้า admin ทั้งหมดให้ responsive และใช้ภาษาไทย
- ✅ **Cascader Filter for Guest Selection**: ใช้ Cascader แบบ Multiple สำหรับกรองแขกตามความสัมพันธ์ (เพื่อน, ญาติ, ผู้ใหญ่, ครอบครัว, อื่นๆ)
- ✅ **Real-time Seating Updates**: แก้ไขปัญหาการอัพเดตจำนวนที่นั่งและแขกในโต๊ะให้อัพเดตทันทีโดยไม่ต้องรีเฟรช
- ✅ **Bulk Unassign from Table**: เพิ่มปุ่ม "ย้ายออกทั้งหมด" ใน TableDetailModal เพื่อย้ายแขกทั้งหมดออกจากโต๊ะในครั้งเดียว
- ✅ **Improved TableDetailModal UI**: ปรับปรุง UI ของ modal ให้สวยงามขึ้น พร้อม Card สำหรับปุ่มย้ายออกทั้งหมด
- ✅ **Editable Zone Tabs**: ดับเบิ้ลคลิกที่ tab เพื่อแก้ไขชื่อโซน, คลิกขวาเพื่อลบโซน
- ✅ **Add Table Button in Card Header**: ย้ายปุ่ม "เพิ่มโต๊ะ" ไปไว้ใน Card header ของ Canvas Area
- ✅ **Responsive Design**: Redesign หน้า admin ทั้งหมดให้ responsive และใช้งานได้ทุกอุปกรณ์ (mobile, tablet, desktop)
- ✅ **Modern UI/UX**: ปรับปรุง UI/UX ให้สวยงาม ใช้งานง่าย และรองรับทุกขนาดหน้าจอ

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
