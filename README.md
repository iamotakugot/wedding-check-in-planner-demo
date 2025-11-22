# Wedding Check-in Planner Demo

ระบบจัดการรายชื่อแขกและเช็คอินสำหรับงานแต่งงาน พร้อมระบบ RSVP และจัดที่นั่ง

## ✨ Features

- 📊 **Dashboard ภาพรวม**: สรุปจำนวนแขก, สถานะการจัดโต๊ะ, สถิติฝ่ายบ่าว-สาว
- 👥 **จัดการรายชื่อแขก**: เพิ่ม/แก้ไข/ลบแขก, ค้นหาและกรองข้อมูล
- 🪑 **จัดการผังโต๊ะ & โซน**: ลากวางโต๊ะ, จัดแขกลงโต๊ะ, จัดการโซนที่นั่ง
- 🔗 **จัดการลิงค์เชิญ & RSVP**: แก้ไขการ์ดเชิญ, กำหนดการ, แผนที่ Google Maps
- ✅ **เช็คอินหน้างาน**: ระบบเช็คอินแบบ manual, จัดกลุ่มแขก, แสดงสถานะเช็คอิน
- 📱 **Guest RSVP App**: หน้าจอสำหรับแขกตอบรับ RSVP แบบออนไลน์

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Ant Design 5
- **State Management**: React Hooks (useState, useMemo, useCallback)
- **Styling**: Tailwind CSS (via className utilities)
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Authentication (สำหรับ Guest RSVP เท่านั้น)

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm build

# Lint code
npm run lint

# Type check
npm run typecheck
```

## 🚀 Getting Started

1. Clone the repository:
```bash
git clone https://github.com/iamotakugot/wedding-check-in-planner-demo.git
cd wedding-check-in-planner-demo
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open browser at `http://localhost:5173`
   - **Admin Panel**: ไปที่ `http://localhost:5173/admin` (ต้องล็อคอิน)
   - **Guest RSVP**: ไปที่ `http://localhost:5173/` (ไม่ต้องล็อคอิน)

## 🔐 Authentication

### Admin Login
- **Authentication**: Firebase Authentication (Email/Password)
- **Location**: `src/pages/AdminLoginPage.tsx`
- **หมายเหตุ**: Admin Panel ต้องล็อคอินก่อนใช้งาน (ต้องเป็น Admin ที่อยู่ใน Firebase Database)
- **ดูคู่มือ**: [ADMIN_LOGIN.md](./docs/ADMIN_LOGIN.md)

### Guest RSVP Login
- **Authentication**: Firebase Authentication (Facebook/Google Social Login)
- **Location**: `src/components/RSVP/GuestRSVPApp.tsx`
- **หมายเหตุ**: แขกต้อง login ด้วย Facebook หรือ Google ก่อนกรอก RSVP
- **Security Rules**: User ที่ login แล้วสามารถอ่าน/เขียน RSVP ได้ (`auth != null`)

## 📁 Project Structure

```
wedding-check-in-planner-demo/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Layout/          # Main layout components
│   │   └── RSVP/            # RSVP-related components
│   ├── pages/               # Page components
│   │   ├── DashboardPage.tsx
│   │   ├── GuestListPage.tsx
│   │   ├── SeatingManagementPage.tsx
│   │   ├── LinkManagementPage.tsx
│   │   ├── CheckInPage.tsx
│   │   ├── RSVPListPage.tsx
│   │   └── AdminLoginPage.tsx
│   ├── data/                # Form options data
│   ├── firebase/            # Firebase configuration
│   ├── services/            # Firebase service functions
│   ├── types.ts             # TypeScript type definitions
│   ├── App.tsx              # Root component
│   └── main.tsx             # Entry point
├── db/                      # Database schema
├── backend/                 # Backend skeleton
├── docs/                    # Documentation (Data Flow, Security, etc.)
└── .github/workflows/       # CI/CD pipelines
```

## 🔒 Security & DevSecOps

- **Security**: ESLint with security plugins
- **CI/CD**: GitHub Actions for automated testing and security scanning
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Authentication (Email/Password for Admin, Facebook/Google for Guest)
- **Security Rules**: Firebase Realtime Database Rules - ดูรายละเอียดใน [FIREBASE_RULES.md](./docs/FIREBASE_RULES.md)
- **Documentation**: 
  - [FIREBASE_RULES.md](./docs/FIREBASE_RULES.md) - **Firebase Security Rules** ⭐ (ต้องอ่านก่อน deploy)
  - [ADMIN_LOGIN.md](./docs/ADMIN_LOGIN.md) - คู่มือการล็อกอินแอดมิน
  - [DATA_STRUCTURE.md](./docs/DATA_STRUCTURE.md) - โครงสร้างข้อมูลใน Firebase
  - [SETUP.md](./docs/SETUP.md) - คู่มือการตั้งค่าโปรเจกต์

## 📝 License

MIT License

## 👤 Author

Created by [iamotakugot](https://github.com/iamotakugot)

