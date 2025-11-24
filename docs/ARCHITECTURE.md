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
2. สร้าง/อัปเดต RSVP
3. `useRSVPSync` auto-create Guest entries
4. Real-time sync ไปยัง Admin Panel

### Admin Flow
1. Admin login
2. ใช้ hooks เพื่อดึงข้อมูล real-time
3. จัดการ Guests, Zones, Tables
4. Real-time sync ไปยัง Card Page (config changes)

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

