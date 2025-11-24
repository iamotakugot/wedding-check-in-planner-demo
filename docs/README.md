# 📚 เอกสารระบบ Wedding Planner

## 📋 ภาพรวมระบบ

ระบบ Wedding Planner เป็นแอปพลิเคชันสำหรับจัดการงานแต่งงานที่ครอบคลุม ประกอบด้วย:

- **Admin Panel**: ระบบจัดการสำหรับเจ้าของงาน (จัดการแขก, โต๊ะ, RSVP, Check-in)
- **Guest RSVP App**: ระบบตอบรับคำเชิญสำหรับแขก (รองรับ Facebook/Google Login)

### เทคโนโลยีที่ใช้

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Ant Design 5
- **Backend**: Firebase Realtime Database
- **Authentication**: Firebase Authentication (Email/Password, Google, Facebook)
- **Styling**: Tailwind CSS
- **Deployment**: Firebase Hosting

---

## 📖 สารบัญเอกสาร

### สำหรับ Developer

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - สถาปัตยกรรมระบบ, Data Flow, Component Structure
2. **[SETUP.md](./SETUP.md)** - คู่มือการติดตั้งและตั้งค่าโปรเจกต์
3. **[DATA_MODEL.md](./DATA_MODEL.md)** - โครงสร้างข้อมูลใน Firebase, Data Relationships
4. **[SECURITY.md](./SECURITY.md)** - Security Rules, Authentication, Authorization
5. **[API_REFERENCE.md](./API_REFERENCE.md)** - API Reference สำหรับ Firebase Service

### สำหรับ Admin/User

6. **[USER_GUIDE.md](./USER_GUIDE.md)** - คู่มือการใช้งานสำหรับ Admin และ Guest

---

## 🚀 เริ่มต้นใช้งาน

### สำหรับ Developer

1. อ่าน [SETUP.md](./SETUP.md) เพื่อติดตั้งและตั้งค่าโปรเจกต์
2. อ่าน [ARCHITECTURE.md](./ARCHITECTURE.md) เพื่อเข้าใจโครงสร้างระบบ
3. อ่าน [SECURITY.md](./SECURITY.md) เพื่อตั้งค่า Security Rules และ Admin Account

### สำหรับ Admin

1. อ่าน [USER_GUIDE.md](./USER_GUIDE.md) เพื่อเรียนรู้วิธีใช้งานระบบ
2. อ่าน [SETUP.md](./SETUP.md) ส่วน "ตั้งค่า Admin Account"

---

## 🏗️ โครงสร้างโปรเจกต์

```
wedding-planner/
├── src/
│   ├── components/          # React Components
│   │   ├── Layout/         # Layout Components
│   │   └── RSVP/          # RSVP Components
│   ├── pages/             # Page Components
│   ├── services/          # Firebase Service Layer
│   ├── firebase/          # Firebase Configuration
│   ├── types.ts           # TypeScript Type Definitions
│   ├── constants/         # Constants
│   ├── data/              # Static Data
│   └── utils/             # Utility Functions
├── docs/                  # เอกสารระบบ
├── database.rules.json    # Firebase Security Rules
└── package.json          # Dependencies
```

---

## 🔑 ฟีเจอร์หลัก

### Admin Panel

- ✅ **Dashboard**: ภาพรวมสถิติงาน (จำนวนแขก, RSVP, Check-in)
- ✅ **Guest Management**: จัดการรายชื่อแขก (เพิ่ม, แก้ไข, ลบ, จัดกลุ่ม)
- ✅ **Seating Management**: จัดการโซนและโต๊ะ (Drag & Drop)
- ✅ **RSVP Management**: ดูและจัดการ RSVP จากแขก
- ✅ **Check-in**: ระบบเช็คอินแขก (Manual, QR Code)
- ✅ **Card Management**: จัดการการ์ดเชิญ

### Guest RSVP App

- ✅ **Social Login**: รองรับ Facebook และ Google Login
- ✅ **RSVP Form**: ฟอร์มตอบรับคำเชิญ (พร้อมผู้ติดตาม)
- ✅ **Guest Creation**: สร้าง Guest อัตโนมัติเมื่อตอบรับ
- ✅ **Real-time Sync**: Sync ข้อมูลแบบ real-time
- ✅ **Multi-device Support**: รองรับหลายอุปกรณ์/แท็บ

---

## 🔐 Authentication

### Admin Authentication

- **Method**: Email/Password (Firebase Authentication)
- **Access Control**: ตรวจสอบจาก `/admins/{uid}` ใน Firebase Database
- **Session**: ใช้ Firebase Auth persistence (browserLocalPersistence)

### Guest Authentication

- **Methods**: Facebook Login, Google Login
- **Access Control**: ตรวจสอบจาก `auth.uid` ใน Security Rules
- **Session**: ใช้ Firebase Auth persistence (browserLocalPersistence)

---

## 📊 Data Flow

### Guest RSVP Flow

```
Guest → Login (Facebook/Google) → Fill RSVP Form → Create RSVP → Auto Create Guest (if isComing === 'yes')
```

### Admin Import Flow

```
Admin → View RSVP List → Import RSVP → Create Guest Group → Link RSVP with Guest
```

### Check-in Flow

```
Admin/Staff → Scan QR Code or Manual Search → Update Guest Check-in Status
```

---

## 🔒 Security

- **Firebase Security Rules**: ควบคุมการเข้าถึงข้อมูลตาม role (Admin/Guest)
- **Authentication-based Access**: ใช้ `auth.uid` เพื่อตรวจสอบ ownership
- **Role-based Authorization**: แยก Admin และ Guest permissions
- **Data Validation**: Validate ข้อมูลทั้งฝั่ง client และ server (Firebase Rules)

---

## 📝 หมายเหตุสำคัญ

1. **Firebase Realtime Database**: ระบบใช้ Realtime Database (ไม่ใช่ Firestore)
2. **Real-time Sync**: ข้อมูล sync แบบ real-time อัตโนมัติระหว่างอุปกรณ์
3. **NoSQL Data Modeling**: ใช้ Denormalization และ Aggregates เพื่อประสิทธิภาพ
4. **Idempotency**: ป้องกัน duplicate Guest creation ด้วย `rsvpUid` check
5. **Multi-device Support**: รองรับการใช้งานหลายแท็บ/อุปกรณ์พร้อมกัน

---

## 🐛 Troubleshooting

### ปัญหาที่พบบ่อย

1. **Admin ไม่สามารถล็อกอินได้**
   - ตรวจสอบว่า UID ถูกเพิ่มใน `/admins/{uid}` แล้วหรือยัง
   - ดู [SECURITY.md](./SECURITY.md) ส่วน "ตั้งค่า Admin Account"

2. **Guest ไม่สามารถสร้าง RSVP ได้**
   - ตรวจสอบว่า login สำเร็จแล้วหรือยัง
   - ตรวจสอบ Firebase Security Rules

3. **ข้อมูลไม่ sync แบบ real-time**
   - ตรวจสอบว่าใช้ `subscribe*` functions แทน `get*` functions
   - ตรวจสอบ Firebase connection

---

## 📞 ติดต่อ

สำหรับคำถามหรือปัญหาเกี่ยวกับระบบ กรุณาอ่านเอกสารในโฟลเดอร์ `docs/` ก่อน

---

**อัพเดทล่าสุด:** 2024

