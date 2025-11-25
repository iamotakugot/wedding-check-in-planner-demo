# Architecture Documentation

## Overview
ระบบ Wedding Planner ใช้ React + TypeScript + Firebase Realtime Database

## Architecture Pattern

### OOP Structure
- **Service Layer**: Class-based services (Singleton pattern)
  - `RSVPService`: จัดการ RSVP operations (create, update, get, subscribe)
  - `GuestService`: จัดการ Guest operations (CRUD, createFromRSVP, updateFromRSVP)
  - `ZoneService`: จัดการ Zone operations (CRUD, subscribe)
  - `TableService`: จัดการ Table operations (CRUD, subscribe)
  - `ConfigService`: จัดการ Config operations (wedding card config)
  - `AuthService`: จัดการ Authentication (login, logout, social auth, WebView detection)

- **Manager Layer**: Business logic managers
  - `RSVPManager`: จัดการ RSVP และ Guest synchronization
  - `SeatingManager`: จัดการการจัดที่นั่ง
  - `CheckInManager`: จัดการ check-in และ group management

- **Hook Layer**: React hooks ที่ใช้ service instances
  - `useRSVPs`: RSVP data hook
  - `useGuests`: Guest data hook
  - `useZones`: Zone data hook
  - `useTables`: Table data hook
  - `useConfig`: Config data hook
  - `useRSVPSync`: Auto-sync RSVP to Guest hook

## Data Flow

### Guest Flow (Card Page)
1. Guest เข้าสู่ระบบ (Google/Facebook)
2. สร้าง/อัปเดต RSVP (ตอบรับร่วมงาน)
3. `useRSVPSync` auto-create Guest entries
4. Real-time sync ไปยัง Admin Panel

### Admin Flow
1. Admin login
2. ใช้ hooks เพื่อดึงข้อมูล real-time
3. จัดการ Guests, Zones, Tables
4. Real-time sync ไปยัง Card Page (config changes)

### Group Check-in Flow
1. แอดมินเลือกกลุ่มจากรายชื่อแขก
2. เปิด Modal Group Check-in
3. เลือกแขกที่ต้องการเช็คอินจาก checkbox (per guest)
4. ระบบตรวจสอบ RSVP status (`isComing`) ก่อนเช็คอิน
5. เช็คอินเฉพาะแขกที่เลือก
6. Real-time sync ไปยัง Card Page

### Click-based Seating Assignment Flow
1. แอดมินเลือกแขกจาก Sidebar (แขกที่ยังไม่ได้จัดที่นั่ง)
2. ระบบเข้าสู่ "Assign Mode" (disable drag & drop)
3. แอดมินคลิกโต๊ะที่ต้องการจัดที่นั่ง
4. ระบบเรียก `SeatingManager.assignGuestToTable()`
5. Real-time sync ไปยัง Card Page

### Auth Flow & In-App Browser Handling

#### WebView Detection
- ใช้ `navigator.userAgent` patterns เพื่อ detect:
  - **Messenger WebView**: `FBAN/Messenger`, `Messenger/\d+`, `FB_IAB.*Messenger`
  - **Instagram WebView**: `Instagram`, `FB_IAB.*Instagram`, `FBAN/Instagram`
  - **Facebook App WebView**: `FBAN/FB`, `FB_IAB.*FB`, `FB4A` (ไม่ใช่ Messenger)
- ตรวจสอบ `sessionStorage` availability ก่อน redirect

#### Facebook Login Flow
- **Normal Browser (Chrome/Safari)**:
  1. ใช้ `signInWithPopup` เป็นหลัก
  2. ถ้า popup ถูก block → fallback เป็น `signInWithRedirect`
  3. ตรวจสอบ redirect result ด้วย `getRedirectResult()`
  4. Login สำเร็จ → sync auth state

- **In-App Browser (Messenger/Instagram/Facebook App)**:
  1. Detect WebView environment
  2. แสดง inline banner เตือน (ไม่ block login)
  3. Banner มีปุ่ม "คัดลอกลิงก์" และ "เปิดในเบราว์เซอร์"
  4. ผู้ใช้สามารถลอง login ได้ แต่ banner จะเตือนว่าอาจไม่สำเร็จ
  5. User เปิดใน external browser → login ทำงานปกติ

#### Redirect Flow
- ใช้ `signInWithRedirect` สำหรับ:
  - Facebook WebView (เมื่อ sessionStorage available)
  - WebView ที่ไม่มี sessionStorage (fallback)
  - เมื่อ popup ถูก block
- ตรวจสอบ redirect result:
  - เรียก `checkRedirectResult()` ก่อน `onAuthStateChanged`
  - Handle errors (sessionStorage unavailable, missing initial state)
  - Log warnings เมื่อ redirect result ไม่สำเร็จใน WebView

#### Session Persistence
- ใช้ `browserLocalPersistence` สำหรับ Firebase Auth
- ตรวจสอบ sessionStorage availability ก่อน redirect
- ถ้า sessionStorage ไม่ available → แสดง warning และแนะนำให้เปิดใน browser

## Firebase Realtime Database Structure

```
/
├── rsvps/
│   └── {rsvpId}/
│       ├── uid
│       ├── firstName
│       ├── lastName
│       ├── isComing
│       └── guestId
├── guests/
│   └── {guestId}/
│       ├── rsvpUid
│       ├── tableId
│       ├── zoneId
│       └── groupId
├── zones/
│   └── {zoneId}/
├── tables/
│   └── {tableId}/
│       └── zoneId
├── config/
│   └── weddingCard/
└── admins/
    └── {uid}: true
```

## Performance Optimizations

1. **Code Splitting**: Lazy load admin pages
2. **Bundle Optimization**: Manual chunks สำหรับ vendor libraries
3. **Firebase Indexes**: `.indexOn` rules สำหรับ queries
4. **Debouncing**: Drag operations, state updates

## Mobile Compatibility

- Facebook Messenger WebView support
- Responsive design
- Touch-friendly UI
- Optimized for mobile browsers

## Social Login in Embedded Browsers (Messenger/Instagram)

### Overview
ระบบไม่บล็อก login ตรง ๆ แต่แสดง inline banner เตือนและแนะนำให้เปิดใน external browser เพื่อความปลอดภัยและความเสถียรของ OAuth flow

### Rationale
- **Google/Facebook Security Policies**: ไม่แนะนำ OAuth ผ่าน embedded WebView เนื่องจาก:
  - Session storage/cookies อาจไม่ persist
  - Redirect flow อาจไม่ทำงาน
  - Security concerns เกี่ยวกับ third-party storage
- **User Experience**: ไม่บังการ์ดหน้าแรก แต่เตือนเฉพาะเมื่อผู้ใช้กด "ลงทะเบียน" แล้ว

### Implementation
1. **Detection**: ใช้ `AuthService.getWebViewInfo()` เพื่อตรวจจับ embedded browser
2. **Banner Display**: แสดง inline banner เฉพาะเมื่อ:
   - `isFlipped === true` (flip ไปหน้า form แล้ว)
   - `isInWebView === true` (อยู่ใน embedded browser)
3. **User Actions**:
   - **คัดลอกลิงก์**: ใช้ `navigator.clipboard.writeText()` พร้อม toast notification
   - **เปิดในเบราว์เซอร์**: ใช้ `window.open(url, '_blank')` สำหรับ iOS/Android จะเด้งไป Safari/Chrome
4. **Login Flow**: ไม่ block login - ผู้ใช้สามารถลอง login ได้ แต่ banner จะเตือนว่าอาจไม่สำเร็จ

### References
- [Firebase – Best practices for `signInWithRedirect`](https://firebase.google.com/docs/auth/web/redirect-best-practices)
- [Google – Security changes to OAuth 2.0 in embedded webviews](https://developers.google.com/identity/protocols/oauth2/policies)
- [Facebook – Deprecating support for FB Login on Android embedded browsers](https://developers.facebook.com/docs/facebook-login/android)
- Common OAuth errors in in-app browsers: `disallowed_useragent` error

