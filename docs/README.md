# Wedding Planner

ระบบจัดการงานแต่งงานแบบ Real-time ที่ใช้ Firebase Realtime Database และ React เพื่อช่วยคู่บ่าวสาวและผู้จัดงานจัดการแขก ที่นั่ง และการตอบรับได้อย่างมีประสิทธิภาพ

A real-time wedding management system built with React, TypeScript, and Firebase. This application helps couples and organizers manage guest lists, seating arrangements, and RSVPs efficiently with live updates across all devices.

## ✨ Key Features

### Guest-Facing Features
- **Digital Invitation Card**: Beautiful, mobile-first invitation card with music player
- **OTP Authentication**: Secure phone number login with SMS OTP verification
- **RSVP Form**: Easy-to-use form for guests to confirm attendance
- **Guest Profile Management**: Automatic profile creation for returning guests

### Admin Panel Features
- **Dashboard**: Real-time statistics and overview of all wedding data
- **Guest Management**:
    - Add, edit, and delete guests
    - Expandable tree view with group organization
    - Individual and group check-in support
    - Track RSVP status and check-in times
- **Seating Arrangement**:
    - Visual canvas-based seating layout
    - Zone and table management
    - Drag-and-drop guest assignment
    - Click-based assignment mode
    - Cascader filter by relationship (Friends, Family, etc.)
    - Bulk unassign functionality
- **RSVP Management**: Real-time tracking of guest responses with timestamps
- **Settings**: Configure wedding card details and invitation URLs

### Technical Features
- **Real-time Sync**: All data updates instantly across all devices
- **Responsive Design**: Fully optimized for Mobile, Tablet, and Desktop
- **Audit Logging**: Track important events (login, RSVP changes)
- **Secure Authentication**:
    - **Guests**: Firebase Phone Authentication (OTP)
    - **Admins**: Email/Password authentication

## 🛠️ Tech Stack

- **Frontend**: [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **UI Framework**: [Ant Design](https://ant.design/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: [Firebase Realtime Database](https://firebase.google.com/docs/database)
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Deployment**: [Firebase Hosting](https://firebase.google.com/docs/hosting)

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Firebase project with:
    - Realtime Database enabled
    - Authentication enabled (Phone + Email/Password)

### Installation

1. **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd wedding-planner
    ```

2. **Install dependencies**:
    ```bash
    npm install
    ```

3. **Set up environment variables**:
    Create a `.env.local` file in the root directory:
    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
    VITE_FIREBASE_DATABASE_URL=your_database_url
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```

4. **Configure Firebase**:
    - Upload `database.rules.json` to Firebase Console
    - Set up admin users in Realtime Database under `/admins/{uid}: true`
    - Enable Phone Authentication and Email/Password in Firebase Console

5. **Start the development server**:
    ```bash
    npm run dev
    ```
    Access at `http://localhost:5173`

## 📖 Documentation

- **[Architecture](./docs/ARCHITECTURE.md)**: System design, authentication flows, and database schema
- **[Development Guide](./docs/DEVELOPMENT.md)**: Detailed setup, project structure, and deployment

## 🌐 Routes

- `/` - Guest invitation card and RSVP form (requires OTP login)
- `/admin` - Admin panel (requires admin credentials)
    - `/admin` (Dashboard view)
    - `/admin` (Guests view)
    - `/admin` (Seating view)
    - `/admin` (RSVPs view)
    - `/admin` (Settings view)

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run validate` - Run typecheck + build
- `npm run preview` - Preview production build

## 📄 License

MIT
