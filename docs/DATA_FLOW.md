# DATA FLOW

## Overview
- Single-page Admin app holds central state in App.tsx: `guests`, `zones`, `tables`
- Pages read/write via props; state updates propagate to all pages
- Guest RSVP App writes to Firebase Realtime Database (`rsvps` collection)
- RSVP data is used in Link Management page for statistics

## Admin Flows

### 1) Guest Management
- GuestListPage
  - Create/Update/Delete guests (Firebase Realtime Database)
  - Optional zone/table assignment
  - Data stored in: `guests` collection

### 2) Seating Management
- SeatingManagementPage
  - Zones CRUD, Tables CRUD (Firebase Realtime Database)
  - Drag & drop tables; position saved in `tables` state
  - Unassign/reassign guests from table detail modal
  - Data stored in: `zones` and `tables` collections

### 3) Check-in
- CheckInPage
  - Search, filter (side/zone/table)
  - Group view using `groupId/groupName`
  - Actions:
    - Check-in group: set `checkedInAt` for all members to ISO timestamp, `checkInMethod='manual'`
    - Check-in individual: toggle per guest
  - Dashboard/GuestList reflect checked-in status via shared `guests` state
  - Data stored in: `guests` collection (updated `checkedInAt` and `checkInMethod`)

### 4) Link Management
- LinkManagementPage
  - Displays invitation link and QR Code
  - Shows RSVP statistics from Firebase:
    - Total RSVPs
    - Coming count
    - Not coming count
    - Total attendees (including accompanying guests)
  - Data read from: `rsvps` collection

## Guest RSVP Flow (Guest Mode)

### Flow:
1. **Guest opens invitation link**: `/` (root path)
2. **Login required**: Guest must login with Facebook or Google (Firebase Authentication)
3. **Fill RSVP form**: 
   - Choose coming/not coming
   - Fill personal information (name, nickname, side, relation)
   - Add accompanying guests (if coming)
   - Add note (optional)
4. **Submit**: Data saved to Firebase Realtime Database
5. **View confirmation**: Guest sees confirmation message

### Data Stored:
- **Collection**: `rsvps` in Firebase Realtime Database
- **Fields**:
  - `uid`: Firebase Authentication UID (from Facebook/Google login)
  - `isComing`: 'yes' | 'no'
  - `firstName`, `lastName`, `nickname`
  - `side`: 'groom' | 'bride' | 'both'
  - `relation`: string
  - `note`: string
  - `accompanyingGuests`: array of { name, relationToMain }
  - `accompanyingGuestsCount`: number
  - `guestId`: null (for future mapping to Guest)
  - `createdAt`, `updatedAt`: ISO timestamps

### Data Usage:
- **LinkManagementPage**: Displays RSVP statistics
  - Total RSVPs count
  - Coming/Not coming counts
  - Total attendees calculation
- **RSVPListPage**: แสดงรายละเอียด RSVP ทั้งหมด
  - ดูรายละเอียดการตอบรับ
  - นำเข้าข้อมูลไปยังรายชื่อแขก (Import to Guests)
- **Future**: Can be used to:
  - Map RSVPs to existing Guests (via `uid` or email matching)
  - Update Guest records with RSVP status
  - Generate reports and analytics

## Real-time Updates

### Firebase Realtime Database Subscriptions:
- `guests`: Real-time updates when guests are added/updated/deleted
- `zones`: Real-time updates when zones are modified
- `tables`: Real-time updates when tables are modified
- `rsvps`: Real-time updates when RSVPs are submitted (used in LinkManagementPage)

### State Management:
- App.tsx subscribes to Firebase collections
- State updates propagate to all pages via props
- All pages reflect latest data automatically

## Data Relationships

### Current:
- Guest → Zone (via `zoneId`)
- Guest → Table (via `tableId`)
- Guest → Group (via `groupId`)

### Future (RSVP Integration):
- RSVP → Guest (via `uid` or email matching)
- RSVP → Guest (via `guestId` when mapped)

## Notes
- RSVP data is stored separately from Guest data
- RSVP uses Firebase Authentication UID (`uid`) to identify users
- Guest data uses custom IDs
- Future integration: Map RSVPs to Guests by matching `uid`/email or manual mapping
- Admin Panel requires login (AdminLoginPage) - Username: `admin`, Password: `1150`
- Guest RSVP uses Firebase Authentication (Google/Facebook) - ไม่ต้องใช้เบอร์โทร
