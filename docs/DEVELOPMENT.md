# Development Guide

This guide covers how to set up the development environment, run the project, and deploy changes.

## 📂 Project Structure

```
src/
├── card/                  # Guest-facing components (Invitation Card)
│   ├── GuestRSVPApp.tsx   # Main RSVP application
│   └── MusicPlayer.tsx    # Background music player
├── components/            # Shared UI components
│   ├── admin/             # Admin-specific components (10 files)
│   └── common/            # Common shared components (2 files)
├── constants/             # Application constants (3 files)
├── data/                  # Static data files (1 file)
├── firebase/              # Firebase configuration (1 file)
├── hooks/                 # Custom React hooks (9 files)
│   ├── useAdminAuth.ts
│   ├── useConfig.ts
│   ├── useCountdown.ts
│   ├── useGuestGroups.ts
│   ├── useGuests.ts
│   ├── useRSVPs.ts
│   ├── useRSVPSync.ts
│   ├── useTables.ts
│   └── useZones.ts
├── managers/              # Business logic managers (3 files)
│   ├── CheckInManager.ts
│   ├── RSVPManager.ts
│   └── SeatingManager.ts
├── pages/                 # Page components
│   ├── admin/             # Admin Panel pages (6 files)
│   │   ├── AdminLayout.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── GuestsPage.tsx
│   │   ├── RSVPsPage.tsx
│   │   ├── SeatingPage.tsx
│   │   └── SettingsPage.tsx
│   ├── AdminLoginPage.tsx # Admin login (Email/Password)
│   ├── IntroPage.tsx      # Guest intro/invitation card
│   └── OTPLoginPage.tsx   # Guest OTP login
├── services/              # Firebase services (10 files)
│   └── firebase/
│       ├── AuditLogService.ts
│       ├── AuthService.ts
│       ├── ConfigService.ts
│       ├── GuestProfileService.ts
│       ├── GuestService.ts
│       ├── RSVPService.ts
│       ├── TableService.ts
│       ├── ZoneService.ts
│       ├── appState.ts
│       └── sessions.ts
├── styles/                # Global styles & Tailwind config (1 file)
├── utils/                 # Helper functions (7 files)
├── types.ts               # TypeScript type definitions
├── App.tsx                # Main application entry point
└── main.tsx               # React DOM rendering
```

## 🛠️ Setup & Installation

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Copy `.env.example` (if available) or create `.env.local`:
    ```env
    VITE_FIREBASE_API_KEY=...
    VITE_FIREBASE_AUTH_DOMAIN=...
    VITE_FIREBASE_DATABASE_URL=...
    VITE_FIREBASE_PROJECT_ID=...
    VITE_FIREBASE_STORAGE_BUCKET=...
    VITE_FIREBASE_MESSAGING_SENDER_ID=...
    VITE_FIREBASE_APP_ID=...
    ```

## 🏃‍♂️ Running Locally

Start the Vite development server:
```bash
npm run dev
```
Access the app at `http://localhost:5173`.

## 🧪 Testing & Linting

- **Linting**:
    ```bash
    npm run lint
    ```
- **Type Checking**:
    ```bash
    npm run typecheck
    ```
- **Validate (Lint + Typecheck + Build)**:
    ```bash
    npm run validate
    ```

## 🚀 Deployment

The application is deployed to Firebase Hosting.

1.  **Build the project**:
    ```bash
    npm run build
    ```
    This generates the production assets in the `dist/` directory.

2.  **Deploy to Firebase**:
    ```bash
    firebase deploy
    ```
    *Note: You need the Firebase CLI installed and logged in (`npm install -g firebase-tools` && `firebase login`).*

## 📦 Dependencies

### Core Dependencies
- **React** (v18.2.0): UI library
- **TypeScript** (v5.2.2): Type safety
- **Vite** (v5.0.8): Build tool and dev server
- **Firebase** (v12.6.0): Backend services (Auth, Realtime Database)

### UI Libraries
- **Ant Design** (v5.12.8): Admin Panel UI components
- **@ant-design/icons** (v5.2.6): Icon library
- **Tailwind CSS** (v3.4.18): Utility-first CSS framework
- **PostCSS** (v8.5.6) + **Autoprefixer** (v10.4.22): CSS processing

### Development Tools
- **ESLint** (v8.55.0): Linting
    - `@typescript-eslint/eslint-plugin` & `@typescript-eslint/parser`
    - `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
    - `eslint-plugin-security`: Security linting
- **Testing Libraries**:
    - `@testing-library/react` (v16.3.0)
    - `@testing-library/jest-dom` (v6.9.1)
    - `vitest` (v4.0.10): Test runner
    - `jsdom` (v27.0.1): DOM implementation for testing

## 🔧 Troubleshooting

### Common Issues

**1. Vite EPERM Error on Windows**
```
Error: EPERM: operation not permitted, remove '.vite/deps'
```
**Solution**: 
- Close all running dev servers
- Delete `.vite` folder manually
- Run `npm run dev` again

**2. Firebase Auth Errors**
```
Firebase: Error (auth/configuration-not-found)
```
**Solution**: 
- Verify all environment variables in `.env.local` are correct
- Ensure Firebase project has Phone Authentication and Email/Password enabled

**3. Real-time Database Permission Denied**
```
PERMISSION_DENIED: Permission denied
```
**Solution**:
- Upload `database.rules.json` to Firebase Console
- Verify admin UID is added to `/admins/{uid}: true` in Realtime Database

**4. Type Errors**
```
Cannot find module '@/...' or its corresponding type declarations
```
**Solution**:
- Verify `tsconfig.json` has correct path aliases
- Run `npm install` to ensure all types are installed

## 🤝 Contributing

1. Follow the existing code structure (Services → Managers → Hooks)
2. Use TypeScript for all new files
3. Run `npm run validate` before committing
4. Follow Ant Design guidelines for UI components
5. Use Tailwind utilities for custom styling
