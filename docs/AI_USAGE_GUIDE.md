# AI Usage Guide & Testing Manual for Wedding Planner

This document serves as a guide for AI agents and developers to understand, use, and test the Wedding Planner application. It covers the core workflows, key components, and known behaviors.

## 1. Project Overview
- **Name**: Wedding Planner (Guest RSVP & Admin Panel)
- **Stack**: React, TypeScript, Vite, Firebase (Auth, Realtime Database), Ant Design, TailwindCSS.
- **Architecture**: Client-Serverless.
- **Key Features**:
    - **Guest**: Invitation Card (Intro), OTP Login, RSVP Form, Music/Video Player.
    - **Admin**: Dashboard, Guest Management, Seating Arrangement, RSVP List, Settings.

## 2. Authentication & Access

### Admin Panel
- **URL**: `/admin`
- **Credentials**:
    - **Email**: `admin@admin.com`
    - **Password**: `11501150`
- **Behavior**:
    - Supports persistent login.
    - **Manual Login**: If auto-fill occurs, clear fields manually to test full flow.
    - **Security**: Redirects to `/admin/login` if not authenticated.

### Guest Flow
- **URL**: `/` (Root)
- **Method**: Phone Number + OTP.
- **Test Credentials**:
    - **Phone**: `0634168151`
    - **OTP**: `123456` (Fixed for testing)
- **Behavior**:
    - **Intro**: Requires user interaction (Click Heart) to start audio/video.
    - **Login State**: Persists across refreshes. If logged in, skips Intro and goes to Card Back (RSVP Form).

## 3. Core Workflows (Testing Scenarios)

### A. Guest RSVP Flow
1.  **Enter App**: Click Heart icon on Intro Overlay.
2.  **Register/Login**:
    - Click "ลงทะเบียนร่วมงาน".
    - Enter Phone -> Request OTP -> Enter OTP.
    - **Expected**: App stays on Form view (Card Back).
3.  **Submit RSVP**:
    - Fill Name, Side (Bride/Groom), Relation.
    - Add Accompanying Guests (optional).
    - Click "ยืนยัน".
    - **Expected**: Success message/card appears.
4.  **Edit RSVP**:
    - Click "แก้ไขข้อมูล" to update details.

### B. Admin Management Flow
1.  **Dashboard**: Check total stats (RSVP count, Attendees).
2.  **Guests (`/admin/guests`)**:
    - **Search**: Find guests by name or phone number.
    - **View Details**: Phone numbers are visible and clickable (tel: link).
    - **Add Guest**: Click "เพิ่มแขก".
        - **Note**: The "Side" (ฝ่ายที่เกี่ยวข้อง) dropdown is an Ant Design component. For automation, use specific selectors or keyboard navigation (ArrowDown + Enter).
    - **Check-in**: Toggle check-in status.
3.  **RSVPs (`/admin/rsvps`)**:
    - View raw RSVP submissions.
    - Verify data consistency with Guest list.
4.  **Seating (`/admin/seating`)**:
    - **Desktop**: Drag & Drop guests to tables.
    - **Mobile**:
        - Switch to **"List"** view.
        - Open **"รายชื่อแขก"** (Drawer) to select a guest.
        - Tap a **Table Card** to assign the selected guest.
    - Create Zones and Tables if needed.
5.  **Settings (`/admin/settings`)**:
    - Update Wedding Names (Groom/Bride).
    - **Verify**: Changes reflect immediately on the Guest App (Intro/Card).

## 4. Known Issues & Troubleshooting

### Automation Challenges
- **Login Loop**: Automated login might occasionally loop. **Strict Rule**: Always clear Email/Password fields manually before typing credentials to ensure a clean login state.
- **Ant Design Dropdowns**: Dropdowns (Select, DatePicker) render in portals (`document.body`), not inside the parent form.
    - **Fix**: Use global selectors like `.ant-select-dropdown` or keyboard simulation.
- **Card Flip**: The 3D flip effect uses `transform: rotateY(180deg)`.
    - **Fix**: Ensure `pointer-events` are managed (see `GuestRSVPApp.tsx` CSS logic) so the back side is clickable.

### Common Bugs (Fixed)
- **Redirect Loop**: Fixed issue where login redirected back to Intro. Now stays on Form.
- **Duplicate Close Button**: Removed extra 'X' on OTP screen.

## 5. Key File Locations
- **Guest Logic**: `src/card/GuestRSVPApp.tsx` (Monolithic component for Guest flow).
- **Admin Pages**: `src/pages/admin/` (Dashboard, Guests, etc.).
- **Services**: `src/services/` (Firebase interactions).

---
*Last Updated: 2025-11-30*
