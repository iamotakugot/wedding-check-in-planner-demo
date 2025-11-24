# 🏗️ สถาปัตยกรรมระบบ Wedding Planner

## 📋 สารบัญ

1. [ภาพรวมสถาปัตยกรรม](#1-ภาพรวมสถาปัตยกรรม)
2. [Frontend Architecture](#2-frontend-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [Data Flow](#4-data-flow)
5. [Component Structure](#5-component-structure)
6. [State Management](#6-state-management)
7. [Authentication Flow](#7-authentication-flow)

---

## 1. ภาพรวมสถาปัตยกรรม

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  ┌──────────────────┐         ┌──────────────────┐       │
│  │   Admin Panel   │         │  Guest RSVP App │       │
│  │   (/admin/*)    │         │      (/)        │       │
│  └────────┬────────┘         └────────┬────────┘       │
│           │                            │                 │
│           └────────────┬───────────────┘                 │
│                        │                                 │
│            ┌───────────▼───────────┐                    │
│            │   React App (App.tsx) │                    │
│            └───────────┬───────────┘                    │
│                        │                                 │
│            ┌───────────▼───────────┐                    │
│            │  Firebase Service      │                    │
│            │  (firebaseService.ts)  │                    │
│            └───────────┬───────────┘                    │
└────────────────────────┼─────────────────────────────────┘
                         │
                         │ HTTPS
                         │
┌────────────────────────▼─────────────────────────────────┐
│              Firebase Backend                             │
│  ┌──────────────────┐         ┌──────────────────┐       │
│  │  Authentication │         │  Realtime Database│       │
│  │  (Email/Pass)   │         │  (guests, rsvps,  │       │
│  │  (Google)       │         │   zones, tables)  │       │
│  │  (Facebook)     │         │                   │       │
│  └──────────────────┘         └──────────────────┘       │
│                                                           │
│  ┌──────────────────┐                                     │
│  │  Security Rules  │                                     │
│  │  (database.rules)│                                     │
│  └──────────────────┘                                     │
└───────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Ant Design 5
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Realtime Database + Authentication)
- **State Management**: React Hooks + Firebase Realtime Sync

---

## 2. Frontend Architecture

### Application Structure

```
App.tsx (Root Component)
├── Route Detection (/admin vs /)
├── Authentication Check
├── Admin Mode
│   ├── AdminLoginPage (if not authenticated)
│   └── MainLayout (if authenticated)
│       ├── DashboardPage
│       ├── GuestListPage
│       ├── SeatingManagementPage
│       ├── CheckInPage
│       ├── CardManagementPage
│       └── RSVPListPage
└── Guest Mode
    └── GuestRSVPApp
```

### Key Components

#### App.tsx
- **หน้าที่**: Root component, Route management, Authentication state
- **State Management**: 
  - `isAuthenticated`: Admin authentication status
  - `appMode`: 'admin' | 'guest'
  - `currentView`: Current admin page
  - `guests`, `zones`, `tables`, `rsvps`: Central state

#### MainLayout
- **หน้าที่**: Admin panel layout (Sidebar + Content)
- **Features**: Navigation, Logout, View switching

#### GuestRSVPApp
- **หน้าที่**: Guest RSVP form and card display
- **Features**: 
  - Social Login (Facebook/Google)
  - RSVP Form
  - Guest Creation
  - Real-time state sync

### Component Communication

```
App.tsx (Central State)
    ↓ props
MainLayout
    ↓ props
Page Components (DashboardPage, GuestListPage, etc.)
    ↓ callbacks
App.tsx (update state)
```

---

## 3. Backend Architecture

### Firebase Services

#### firebaseService.ts

แบ่งเป็น modules ตาม entity:

1. **Guests Module**
   - `getGuests()`, `createGuest()`, `updateGuest()`, `deleteGuest()`
   - `createGuestFromRSVP()`, `updateGuestFromRSVP()` (for Guest users)
   - `subscribeGuests()` (real-time)

2. **Zones Module**
   - `getZones()`, `createZone()`, `updateZone()`, `deleteZone()`
   - `subscribeZones()` (real-time)

3. **Tables Module**
   - `getTables()`, `createTable()`, `updateTable()`, `deleteTable()`
   - `subscribeTables()` (real-time)

4. **RSVPs Module**
   - `getRSVPs()`, `createRSVP()`, `updateRSVP()`, `getRSVPByUid()`
   - `subscribeRSVPs()` (real-time)

5. **Authentication Module**
   - `signInWithEmailAndPassword()` (Admin)
   - `signInWithGoogle()`, `signInWithFacebook()` (Guest)
   - `onAuthStateChange()`, `checkIsAdmin()`, `logout()`

6. **Session Management**
   - `registerSession()`, `endSession()`, `subscribeSessionChanges()`

7. **App State Management**
   - `getAdminAppState()`, `updateAdminAppState()`, `subscribeAdminAppState()`
   - `getUserAppState()`, `updateUserAppState()`, `subscribeUserAppState()`

### Firebase Realtime Database Structure

```
{
  "guests": { ... },
  "zones": { ... },
  "tables": { ... },
  "rsvps": { ... },
  "config": { ... },
  "admins": { ... },
  "userSessions": { ... },
  "adminSessions": { ... },
  "userAppState": { ... },
  "adminAppState": { ... }
}
```

---

## 4. Data Flow

### Guest RSVP Flow

```
1. Guest opens app (/)
   ↓
2. GuestRSVPApp renders
   ↓
3. Guest clicks "Login with Facebook/Google"
   ↓
4. Firebase Authentication
   ↓
5. onAuthStateChange triggered
   ↓
6. Load existing RSVP (if any) via getRSVPByUid()
   ↓
7. Guest fills RSVP form
   ↓
8. Submit → createRSVP()
   ↓
9. If isComing === 'yes' → createGuestFromRSVP()
   ↓
10. Real-time sync via subscribeRSVPs() and subscribeGuests()
```

### Admin Import Flow

```
1. Admin opens RSVPListPage
   ↓
2. subscribeRSVPs() loads all RSVPs
   ↓
3. Admin clicks "Import" on an RSVP
   ↓
4. Check if guestId exists (already imported)
   ↓
5. Check idempotency (getGuestByRsvpUid())
   ↓
6. Create Guest group (main guest + accompanying guests)
   ↓
7. createGuest() for each guest
   ↓
8. updateRSVP() to link guestId
   ↓
9. Real-time sync updates UI
```

### Check-in Flow

```
1. Admin/Staff opens CheckInPage
   ↓
2. subscribeGuests() loads all guests
   ↓
3. Scan QR code or search manually
   ↓
4. Find guest by ID or name
   ↓
5. updateGuest() with check-in data
   ↓
6. Real-time sync updates all devices
```

---

## 5. Component Structure

### Admin Components

```
MainLayout
├── Sidebar (Navigation)
└── Content Area
    ├── DashboardPage
    │   ├── Statistics Cards
    │   └── Quick Actions
    ├── GuestListPage
    │   ├── Guest Table
    │   └── GuestFormDrawer
    ├── SeatingManagementPage
    │   ├── Zone List
    │   ├── Table List
    │   ├── DraggableTable
    │   ├── TableModal
    │   └── ZoneModal
    ├── CheckInPage
    │   ├── QR Scanner
    │   └── Guest Search
    ├── CardManagementPage
    │   └── Card Preview
    └── RSVPListPage
        ├── RSVP Table
        └── Import Action
```

### Guest Components

```
GuestRSVPApp
├── Login Section (if not authenticated)
│   ├── Facebook Login Button
│   └── Google Login Button
├── Card Display Section
│   └── Wedding Card Component
└── RSVP Form Section
    ├── Personal Info Form
    ├── Accompanying Guests Form
    └── Submit Button
```

---

## 6. State Management

### Central State (App.tsx)

```typescript
const [guests, setGuests] = useState<Guest[]>([]);
const [zones, setZones] = useState<Zone[]>([]);
const [tables, setTables] = useState<TableData[]>([]);
const [rsvps, setRsvps] = useState<RSVPData[]>([]);
```

### Real-time Subscriptions

```typescript
// Subscribe to real-time updates
useEffect(() => {
  const unsubscribeGuests = subscribeGuests((data) => {
    setGuests(data);
  });
  
  const unsubscribeZones = subscribeZones((data) => {
    setZones(data);
  });
  
  // ... cleanup
  return () => {
    unsubscribeGuests();
    unsubscribeZones();
    // ...
  };
}, []);
```

### App State Sync (Multi-device)

```typescript
// Admin App State
useEffect(() => {
  // Load initial state
  getAdminAppState(user.uid).then((state) => {
    if (state?.currentView) {
      setCurrentView(state.currentView);
    }
  });
  
  // Subscribe to changes
  const unsubscribe = subscribeAdminAppState(user.uid, (state) => {
    if (state?.currentView) {
      setCurrentView(state.currentView);
    }
  });
  
  return () => unsubscribe();
}, []);

// Save state changes
useEffect(() => {
  updateAdminAppState(user.uid, { currentView });
}, [currentView]);
```

---

## 7. Authentication Flow

### Admin Authentication

```
1. User navigates to /admin
   ↓
2. App.tsx detects admin path
   ↓
3. onAuthStateChange() checks auth state
   ↓
4. If not authenticated → show AdminLoginPage
   ↓
5. User enters email/password
   ↓
6. signInWithEmailAndPassword()
   ↓
7. checkIsAdmin(user.uid) → check /admins/{uid}
   ↓
8. If admin → setIsAuthenticated(true)
   ↓
9. Load admin app state and data
   ↓
10. Show MainLayout
```

### Guest Authentication

```
1. User navigates to /
   ↓
2. App.tsx detects guest path
   ↓
3. GuestRSVPApp renders
   ↓
4. User clicks "Login with Facebook/Google"
   ↓
5. signInWithFacebook() or signInWithGoogle()
   ↓
6. Firebase Authentication
   ↓
7. onAuthStateChange() triggered
   ↓
8. Load existing RSVP (if any)
   ↓
9. Show RSVP form or existing data
```

### Session Management

```
Login:
1. registerSession(uid) → set /userSessions/{uid}/isOnline = 1
2. subscribeSessionChanges() → detect if another device is online
3. If conflict → show warning modal

Logout:
1. endSession(uid) → set /userSessions/{uid}/isOnline = 0
2. logout() → Firebase signOut()
```

---

## 🔄 Real-time Synchronization

### How It Works

1. **Firebase Realtime Database**: ใช้ `onValue()` listener
2. **Automatic Sync**: เมื่อมีการเปลี่ยนแปลงใน Firebase → ทุก client ที่ subscribe จะได้รับอัพเดททันที
3. **Optimistic Updates**: Update local state ก่อน แล้ว Firebase จะ sync ไปยัง server

### Example

```typescript
// Component A updates guest
updateGuest(id, { checkedInAt: new Date().toISOString() });

// Component B (another tab/device) automatically receives update
subscribeGuests((guests) => {
  // guests array is automatically updated
  // Component B re-renders with new data
});
```

---

## 🎯 Best Practices

1. **Always use subscribe functions** สำหรับ real-time data
2. **Cleanup subscriptions** ใน useEffect cleanup
3. **Validate data** ทั้งฝั่ง client และ server (Firebase Rules)
4. **Handle loading states** เมื่อโหลดข้อมูล
5. **Error handling** สำหรับทุก async operations
6. **Idempotency checks** สำหรับ operations ที่อาจซ้ำซ้อน

---

**อัพเดทล่าสุด:** 2024

