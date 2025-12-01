# System Architecture

This document provides an overview of the technical architecture of the Wedding Planner application.

## 🏗️ High-Level Architecture

The application follows a **Client-Serverless** architecture using **React** for the frontend and **Firebase** for backend services (Database, Auth, Hosting).

```mermaid
graph TD
    Client[Client (Browser)]
    Auth[Firebase Auth]
    DB[Firebase Realtime DB]
    Hosting[Firebase Hosting]

    Client -->|Authenticate| Auth
    Client -->|Read/Write Data| DB
    Client -->|Load Assets| Hosting
    Auth -->|Token| Client
    DB -->|Real-time Updates| Client
```

## 🔐 Authentication

The system supports two distinct user roles with different authentication methods:

### 1. Guest Users (Public)
- **Method**: Phone Number Authentication (OTP).
- **Flow**:
    1. User visits the invitation link (Intro Page).
    2. User enters phone number.
    3. Firebase sends SMS with OTP.
    4. User enters OTP to verify identity.
    5. On success, user gains access to the RSVP form.
- **Security**: Prevents unauthorized access to private event details while keeping it easy for guests.

### 2. Admin Users (Organizers)
- **Method**: Email and Password.
- **Flow**:
    1. User navigates to `/admin`.
    2. User logs in with credentials.
    3. System verifies admin privileges via Firebase Custom Claims or Database rules.
- **Access**: Full access to the Admin Panel (Dashboard, Guests, Seating, Settings).

## 💾 Database Schema

The data is structured in a JSON tree within Firebase Realtime Database:

```json
{
  "rsvps": {
    "rsvpId": {
      "uid": "user_firebase_uid",
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "+66812345678",
      "email": "john@example.com",
      "isComing": true,
      "numberOfGuests": 2,
      "relationship": "friend",
      "guestId": "linked_guest_id",
      "createdAt": 1234567890,
      "updatedAt": 1234567890
    }
  },
  "guests": {
    "guestId": {
      "name": "John Doe",
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "+66812345678",
      "email": "john@example.com",
      "relationship": "friend",
      "groupId": "group_123",
      "groupName": "John's Group",
      "tableId": "table_1",
      "tableName": "Table 1",
      "zoneId": "zone_A",
      "zoneName": "VIP Zone",
      "rsvpUid": "user_firebase_uid",
      "rsvpId": "rsvpId",
      "isComing": true,
      "checkedIn": false,
      "checkedInAt": null,
      "createdAt": 1234567890,
      "updatedAt": 1234567890
    }
  },
  "zones": {
    "zoneId": {
      "id": "zoneId",
      "name": "VIP Zone",
      "order": 1,
      "createdAt": 1234567890
    }
  },
  "tables": {
    "tableId": {
      "id": "tableId",
      "name": "Table 1",
      "zoneId": "zone_A",
      "zoneName": "VIP Zone",
      "capacity": 10,
      "x": 100,
      "y": 200,
      "order": 1,
      "createdAt": 1234567890
    }
  },
  "config": {
    "weddingCard": {
      "groomFirstName": "John",
      "groomLastName": "Doe",
      "brideFirstName": "Jane",
      "brideLastName": "Smith",
      "weddingDate": "2025-12-31",
      "ceremonyTime": "14:00",
      "location": "Grand Hotel",
      "mapUrl": "https://maps.google.com/..."
    }
  },
  "admins": {
    "admin_uid": true
  },
  "guestProfiles": {
    "user_uid": {
      "uid": "user_uid",
      "phoneNumber": "+66812345678",
      "displayName": "John Doe",
      "role": "guest",
      "createdAt": 1234567890,
      "lastLoginAt": 1234567890
    }
  },
  "auditLogs": {
    "logId": {
      "uid": "user_uid",
      "action": "rsvp_created",
      "details": {...},
      "createdAt": 1234567890
    }
  },
  "userSessions": {
    "user_uid": {
      "sessionId": {...}
    }
  },
  "adminSessions": {
    "admin_uid": {
      "sessionId": {...}
    }
  },
  "userAppState": {
    "user_uid": {...}
  },
  "adminAppState": {
    "admin_uid": {
      "currentView": "dashboard"
    }
  }
}
```

## 🧩 Key Components

### Service Layer (`src/services/firebase`)
Encapsulates Firebase operations using the Singleton pattern. All services are class-based and maintain a single instance throughout the app lifecycle.

- **AuthService**: Authentication management
    - Login/Logout (Email/Password for admins, Phone/OTP for guests)
    - Session management
    - Admin privilege checking
    - WebView detection for in-app browsers
- **RSVPService**: RSVP operations
    - Create/Update/Delete RSVPs
    - Subscribe to real-time RSVP changes
    - Link RSVPs to guest records
- **GuestService**: Guest management
    - CRUD operations for guests
    - Auto-create guests from RSVP data
    - Sync RSVP updates to guest records
    - Check-in management
- **GuestProfileService**: Guest profile management
    - Create/Update guest profiles (separate from identity)
    - Link profiles to Firebase Auth UIDs
- **TableService / ZoneService**: Seating arrangement
    - CRUD operations for tables and zones
    - Real-time subscription to layout changes
- **ConfigService**: Wedding configuration
    - Manage wedding card details
    - Update ceremony information
- **AuditLogService**: Event logging
    - Log important actions (login, RSVP changes)
    - Admin-only access to logs
- **appState.ts**: User session state
    - Persist admin panel view state
    - Sync state across devices
- **sessions.ts**: Session management
    - Track user sessions
    - Separate admin and guest sessions

### Managers (`src/managers`)
Orchestrate complex business logic involving multiple services:

- **RSVPManager**: RSVP and Guest synchronization
    - Auto-sync RSVP data to Guest records
    - Handle RSVP updates and propagate to guests
- **SeatingManager**: Seating assignment logic
    - Assign/Unassign guests to tables
    - Validate table capacity
    - Bulk operations
- **CheckInManager**: Check-in workflow
    - Individual guest check-in
    - Group check-in with RSVP validation
    - Update check-in timestamps

### Hooks (`src/hooks`)
Custom React hooks for state management and real-time data subscriptions:

- **useAdminAuth**: Admin authentication state
- **useGuests**: Real-time guest data subscription
- **useRSVPs**: Real-time RSVP data subscription
- **useZones / useTables**: Real-time seating data
- **useConfig**: Wedding configuration data
- **useRSVPSync**: Auto-sync RSVP to Guest records (runs in admin mode)
- **useGuestGroups**: Organize guests by groups with memoization
- **useCountdown**: Wedding countdown timer

## 🔄 Data Flow

### Guest Flow (RSVP Submission)
1. Guest visits invitation link (`/`)
2. Clicks "Login with Phone" → redirected to OTP Login Page
3. Enters phone number → receives SMS OTP
4. Enters OTP → authenticated
5. Fills RSVP form (name, guests count, relationship)
6. Submits RSVP → `RSVPService.createRSVP()`
7. `useRSVPSync` hook detects new RSVP
8. Auto-creates Guest record via `GuestService.createFromRSVP()`
9. Real-time sync to Admin Panel

### Admin Flow (Guest Management)
1. Admin logs in at `/admin` with Email/Password
2. Navigates to Guests page
3. Views real-time guest list (tree structure with groups)
4. Can:
    - Add/Edit/Delete guests manually
    - Check-in individual guests
    - Group check-in with checkbox selection
    - View RSVP status and timestamps
5. All changes sync in real-time to Firebase

### Seating Assignment Flow
1. Admin navigates to Seating page
2. Creates Zones and Tables
3. Two assignment methods:
    - **Drag-and-drop**: Drag guest from sidebar to table
    - **Click-based**: Select guest → click target table
4. `SeatingManager.assignGuestToTable()` validates capacity
5. Updates `guests/{guestId}/tableId` and `guests/{guestId}/zoneId`
6. Real-time update to canvas and guest list

## 🛡️ Security Model

- **Database Rules**: Firebase Security Rules ensure:
    - Guests can only read/write their own RSVP data.
    - Admins have full read/write access.
    - Public data (like config) is read-only for unauthenticated users.
- **Validation**: Input validation on both client-side (Zod/Yup) and server-side (Security Rules).
