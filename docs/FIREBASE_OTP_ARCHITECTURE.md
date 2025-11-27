# Firebase OTP Architecture

เอกสารนี้อธิบายระบบ OTP Authentication ด้วย Firebase Phone Authentication สำหรับ Wedding Web App

## ภาพรวม

ระบบใช้ Firebase Phone Authentication สำหรับ Guest users โดย:
- ใช้ SMS OTP สำหรับยืนยันตัวตน
- แยก Identity (Firebase Auth) ออกจาก Business Data (GuestProfile, RSVP)
- ใช้ Full-Stack OOP Architecture
- รองรับ Mobile-First Responsive Design

---

## Architecture Layers

### 1. Presentation Layer
- `src/pages/IntroPage.tsx` - หน้า Intro/การ์ดเชิญ
- `src/pages/OTPLoginPage.tsx` - หน้ากรอกเบอร์โทรและ OTP
- `src/card/GuestRSVPApp.tsx` - หน้า RSVP หลัก

### 2. Application/Service Layer
- `src/services/firebase/AuthService.ts` - จัดการ OTP authentication
- `src/services/firebase/GuestProfileService.ts` - จัดการ Guest Profile
- `src/services/firebase/RSVPService.ts` - จัดการ RSVP
- `src/services/firebase/AuditLogService.ts` - จัดการ Audit Logs

### 3. Domain Layer
- `src/types.ts` - Type definitions (GuestProfile, AuditLog, RSVPData)
- `src/models/*` - Entity classes (optional)

### 4. Infrastructure Layer
- `src/firebase/config.ts` - Firebase configuration
- `database.rules.json` - Database security rules

---

## Data Model

### Identity Layer (Firebase Auth)
ข้อมูลจาก Firebase Authentication:
- `uid`: Firebase Auth UID
- `phoneNumber`: เบอร์โทร (format: +66XXXXXXXXX)
- `provider`: `"phone"`
- Metadata: `createdAt`, `lastLoginAt` (from Firebase Auth)

### GuestProfile
**Path:** `guestProfiles/{uid}`

```typescript
{
  uid: string;              // Firebase Auth UID (primary key)
  phoneNumber: string;      // เบอร์โทร (+66XXXXXXXXX)
  displayName?: string;     // ชื่อที่แสดง (optional)
  role: 'guest';            // ชนิดผู้ใช้
  weddingId?: string;       // ID งานแต่ง (optional)
  createdAt: string;        // ISO timestamp
  updatedAt: string;        // ISO timestamp
}
```

### RSVP Data
**Path:** `rsvps/{rsvpId}`

```typescript
{
  id?: string;
  uid?: string;             // Firebase Auth UID
  phoneNumber?: string;     // เบอร์โทร (denormalized)
  firstName: string;
  lastName: string;
  fullName?: string;
  nickname: string;
  isComing: 'yes' | 'no';
  side: 'groom' | 'bride';
  relation: string;
  note: string;
  accompanyingGuestsCount: number;
  accompanyingGuests: { name: string; relationToMain: string }[];
  guestId?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### AuditLog
**Path:** `auditLogs/{logId}`

```typescript
{
  logId: string;            // Auto-generated key
  uid: string;              // Firebase Auth UID
  action: string;           // 'login_with_phone', 'rsvp_created', 'rsvp_updated', etc.
  metadata?: Record<string, any>;
  createdAt: string;        // ISO timestamp
}
```

---

## OTP Flow

### Authentication Flow Diagram

```
1. IntroPage
   ↓ (คลิก "เข้าสู่ระบบด้วยเบอร์โทร")
2. OTPLoginPage (กรอกเบอร์โทร)
   ↓ (ส่ง OTP)
3. Firebase Phone Auth (reCAPTCHA + SMS)
   ↓ (กรอก OTP)
4. OTP Verification
   ↓ (สำเร็จ)
5. GuestProfile Creation/Update
   ↓
6. Audit Log (login_with_phone)
   ↓
7. GuestRSVPApp (แสดงหน้า RSVP)
```

### Step-by-Step Process

1. **Intro Page**
   - ผู้ใช้เปิดหน้าแรก
   - แสดงการ์ดเชิญแต่งงาน
   - คลิก "เข้าสู่ระบบด้วยเบอร์โทร"

2. **Phone Input**
   - แสดงฟอร์มกรอกเบอร์โทร
   - ระบบ format เบอร์เป็น E.164 (+66XXXXXXXXX)

3. **OTP Request**
   - ระบบเรียก `AuthService.signInWithPhoneNumber()`
   - Firebase ส่ง SMS พร้อม reCAPTCHA (invisible)
   - แสดง countdown timer (60 วินาที)

4. **OTP Verification**
   - ผู้ใช้กรอก OTP (6 หลัก)
   - ระบบเรียก `AuthService.verifyOTP()`
   - Firebase ตรวจสอบ OTP

5. **Profile Creation/Update**
   - หลัง login สำเร็จ
   - เช็คว่ามี `guestProfiles/{uid}` หรือไม่
   - ถ้าไม่มี → สร้างใหม่
   - ถ้ามี → อัปเดต `phoneNumber` และ `updatedAt`

6. **Audit Log**
   - บันทึก `action: "login_with_phone"` ใน `auditLogs`

7. **Redirect**
   - นำไปยังหน้า GuestRSVPApp

---

## API Reference

### AuthService

#### `setupRecaptchaVerifier(containerId?: string): RecaptchaVerifier`
Setup reCAPTCHA verifier สำหรับ phone authentication
- `containerId`: DOM element ID (optional, ใช้ invisible reCAPTCHA ถ้าไม่ระบุ)

#### `signInWithPhoneNumber(phoneNumber: string): Promise<ConfirmationResult>`
ส่ง OTP ไปยังเบอร์โทร
- `phoneNumber`: เบอร์โทร (format: 0812345678 หรือ +66812345678)
- Returns: `ConfirmationResult` สำหรับ verify OTP

#### `verifyOTP(otp: string): Promise<User>`
ตรวจสอบรหัส OTP
- `otp`: รหัส OTP 6 หลัก
- Returns: Firebase `User` object

#### `resetOTPFlow(): void`
Reset OTP flow (clear confirmation result และ verifier)

### GuestProfileService

#### `createOrUpdateProfile(user: User, phoneNumber?: string): Promise<GuestProfile>`
สร้างหรืออัปเดต Guest Profile
- `user`: Firebase User object
- `phoneNumber`: เบอร์โทร (optional, ใช้จาก user.phoneNumber ถ้าไม่ระบุ)

#### `getByUid(uid: string): Promise<GuestProfile | null>`
ดึง Guest Profile โดย UID

#### `updateDisplayName(uid: string, displayName: string): Promise<void>`
อัปเดตชื่อที่แสดง

### AuditLogService

#### `create(action: string, metadata?: Record<string, any>): Promise<string>`
สร้าง Audit Log
- `action`: ประเภทการกระทำ (เช่น 'login_with_phone', 'rsvp_created')
- `metadata`: ข้อมูลเพิ่มเติม (optional)

---

## Security Features

1. **reCAPTCHA**: ใช้ invisible reCAPTCHA v3 เพื่อป้องกัน bot
2. **Rate Limiting**: Firebase จัดการ rate limiting สำหรับ OTP requests
3. **Phone Number Validation**: ตรวจสอบรูปแบบเบอร์โทรก่อนส่ง OTP
4. **OTP Expiry**: OTP หมดอายุภายในเวลาที่กำหนด (Firebase จัดการให้)
5. **Database Rules**: ใช้ Firebase Realtime Database Rules เพื่อควบคุมการเข้าถึงข้อมูล

---

## Database Rules

```json
{
  "guestProfiles": {
    "$uid": {
      ".read": "auth != null && (auth.uid === $uid || root.child('admins').child(auth.uid).exists())",
      ".write": "auth != null && (auth.uid === $uid || root.child('admins').child(auth.uid).exists())"
    }
  },
  "auditLogs": {
    ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
    "$logId": {
      ".write": "auth != null"
    }
  }
}
```

---

## Error Handling

### Common Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| `auth/invalid-phone-number` | เบอร์โทรไม่ถูกต้อง | ตรวจสอบรูปแบบเบอร์โทร |
| `auth/too-many-requests` | ขอ OTP มากเกินไป | รอสักครู่แล้วลองใหม่ |
| `auth/invalid-verification-code` | รหัส OTP ไม่ถูกต้อง | ตรวจสอบรหัส OTP อีกครั้ง |
| `auth/code-expired` | รหัส OTP หมดอายุ | ขอรหัส OTP ใหม่ |
| `auth/captcha-check-failed` | reCAPTCHA verification failed | รอสักครู่แล้วลองใหม่ |

---

## Deployment Guide

### Prerequisites
1. Firebase Project พร้อม Phone Authentication enabled
2. Authorized domains configured ใน Firebase Console
3. Firebase Realtime Database Rules updated

### Steps

1. **Enable Phone Authentication**
   - ไปที่ Firebase Console → Authentication → Sign-in method
   - Enable "Phone" provider

2. **Configure reCAPTCHA**
   - Firebase จัดการ reCAPTCHA อัตโนมัติ
   - ไม่ต้องตั้งค่าอะไรเพิ่มเติม

3. **Update Database Rules**
   - Deploy `database.rules.json` ไปยัง Firebase

4. **Test OTP Flow**
   - ทดสอบบน production domain
   - ตรวจสอบว่า SMS ส่งถึง

---

## Troubleshooting

### OTP ไม่ถึง
- ตรวจสอบว่าเบอร์โทรถูกต้อง
- ตรวจสอบว่า Phone Authentication enabled ใน Firebase Console
- ตรวจสอบว่า Authorized domains ถูกต้อง

### reCAPTCHA ไม่ทำงาน
- ตรวจสอบว่า domain ถูกเพิ่มใน Authorized domains
- ตรวจสอบ console สำหรับ errors

### Database Permission Denied
- ตรวจสอบ Database Rules
- ตรวจสอบว่า user มีสิทธิ์เข้าถึงข้อมูล

---

## Performance Optimization

1. **Lazy Loading**: Lazy load IntroPage และ OTPLoginPage
2. **Code Splitting**: แยก bundle สำหรับ Guest และ Admin
3. **Caching**: Cache GuestProfile ใน memory
4. **Debouncing**: Debounce OTP input สำหรับการ validate

---

## Future Enhancements

1. **Multi-language Support**: รองรับหลายภาษา
2. **WhatsApp OTP**: เพิ่มตัวเลือกส่ง OTP ผ่าน WhatsApp
3. **Voice OTP**: เพิ่มตัวเลือกส่ง OTP ผ่านเสียง
4. **Biometric Auth**: รองรับ Face ID / Touch ID สำหรับ login ครั้งถัดไป

---

## References

- [Firebase Phone Authentication](https://firebase.google.com/docs/auth/web/phone-auth)
- [Firebase Realtime Database Rules](https://firebase.google.com/docs/database/security)
- [reCAPTCHA Documentation](https://developers.google.com/recaptcha/docs/display)

