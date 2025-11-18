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

## 🔐 Admin Login

- **Username**: `admin`
- **Password**: `1150`

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
│   │   ├── LinkManagerPage.tsx
│   │   ├── CheckInPage.tsx
│   │   └── LoginPage.tsx
│   ├── data/                # Mock data
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
- **Database Schema**: PostgreSQL schema defined in `db/schema.sql`
- **API Specification**: OpenAPI YAML in `api/openapi.yaml`
- **Documentation**: 
  - `docs/DATA_FLOW.md` - Data flow documentation
  - `docs/SECURITY.md` - Security practices
  - `docs/THREAT_MODEL.md` - Threat modeling

## 📝 License

MIT License

## 👤 Author

Created by [iamotakugot](https://github.com/iamotakugot)

