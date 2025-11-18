# DATA FLOW

## Overview
- Single-page Admin app holds central state in App.tsx: `guests`, `zones`, `tables` (mock now, DB later)
- Pages read/write via props; state updates propagate to all pages
- Guest RSVP Preview is a separate UI flow (guest mode) that currently writes to a simulated client-side database only; can integrate later

## Admin Flows

### 1) Guest Management
- GuestListPage
  - Create/Update/Delete guests (client state now)
  - Optional zone/table assignment

### 2) Seating Management
- SeatingManagementPage
  - Zones CRUD, Tables CRUD (client state)
  - Drag & drop tables; position saved in `tables` state
  - Unassign/reassign guests from table detail modal

### 3) Check-in
- CheckInPage
  - Search, filter (side/zone/table)
  - Group view using `groupId/groupName`
  - Actions:
    - Check-in group: set `checkedInAt` for all members to ISO timestamp, `checkInMethod='manual'`
    - Check-in individual: toggle per guest
  - Dashboard/GuestList reflect checked-in status via shared `guests` state

### 4) Link Manager
- Displays invitation link and RSVP status mock metrics
- Opens Guest RSVP Preview (guest mode)

## Guest RSVP Preview (guest mode)
- Auth gate (mock) -> form -> ticket
- Stores submission in a simulated in-memory object
- Future integration option:
  - POST `/api/rsvps` to backend
  - Link to `guests` via identity (phone/email/auth provider id)

## Future Backend Integration
- Replace mock state with backend API
- Sync strategy:
  - On app load: GET `guests/zones/tables`
  - On change: optimistic update + POST/PATCH
  - Websocket/SSE for real-time check-in metrics (optional)
