# คู่มือการ Deploy
## Wedding Planner – Real-time Guest & Admin Panel

---

## 📋 Prerequisites

ก่อน deploy ต้องตรวจสอบว่า:

1. ✅ Build สำเร็จ (`npm run build`)
2. ✅ TypeScript typecheck ผ่าน (`npm run typecheck`)
3. ✅ Linter ไม่มี errors (`npm run lint`)
4. ✅ Firebase Rules ถูกต้อง (`database.rules.json`)
5. ✅ Environment variables ตั้งค่าแล้ว (`.env.local`)

---

## 🚀 ขั้นตอนการ Deploy

### 1. Build Production

```bash
npm run build
```

**ตรวจสอบ:**
- Build สำเร็จไม่มี errors
- Bundle files ถูกสร้างใน `dist/` folder
- ไม่มี warnings ที่สำคัญ

### 2. Deploy Firebase Rules

```bash
firebase deploy --only database
```

**ตรวจสอบ:**
- Rules ถูก deploy สำเร็จ
- `.indexOn` rules ถูก deploy แล้ว
- Security rules ถูกต้อง

### 3. Deploy Application

```bash
firebase deploy
```

หรือ deploy เฉพาะ hosting:

```bash
firebase deploy --only hosting
```

**ตรวจสอบ:**
- Deploy สำเร็จ
- URL ของ application ถูกต้อง
- Application ทำงานได้ปกติ

---

## 🔍 Post-Deployment Checklist

### 1. ตรวจสอบ Application

- [ ] หน้า Card ทำงานได้ปกติ
- [ ] Admin Panel ทำงานได้ปกติ
- [ ] Authentication ทำงานได้ปกติ
- [ ] Realtime sync ทำงานได้ปกติ
- [ ] Mobile compatibility ทำงานได้ปกติ (Facebook Messenger browser)

### 2. ตรวจสอบ Firebase

- [ ] Database Rules ถูก deploy แล้ว
- [ ] Security rules ทำงานถูกต้อง
- [ ] `.indexOn` rules ทำงานถูกต้อง
- [ ] Authentication providers ตั้งค่าแล้ว (Email/Password, Google, Facebook)

### 3. ตรวจสอบ Performance

- [ ] Bundle size อยู่ในเกณฑ์ที่ยอมรับได้
- [ ] Code splitting ทำงานถูกต้อง
- [ ] Lazy loading ทำงานถูกต้อง
- [ ] Firebase queries มี `.indexOn` rules

### 4. ตรวจสอบ Security

- [ ] Admin-only access ทำงานถูกต้อง
- [ ] User authentication ทำงานถูกต้อง
- [ ] Database rules ถูกต้อง
- [ ] ไม่มี sensitive data ใน client-side code

---

## 🔧 Troubleshooting

### Build Errors

**ปัญหา:** Build ไม่สำเร็จ

**แก้ไข:**
1. ตรวจสอบ TypeScript errors: `npm run typecheck`
2. ตรวจสอบ Linter errors: `npm run lint`
3. ตรวจสอบ dependencies: `npm install`
4. ลบ cache: `rm -rf node_modules/.vite dist`

### Firebase Deploy Errors

**ปัญหา:** Deploy ไม่สำเร็จ

**แก้ไข:**
1. ตรวจสอบ Firebase login: `firebase login`
2. ตรวจสอบ Firebase project: `firebase use <project-id>`
3. ตรวจสอบ `firebase.json` configuration
4. ตรวจสอบ Firebase Rules syntax

### Runtime Errors

**ปัญหา:** Application ไม่ทำงานหลัง deploy

**แก้ไข:**
1. ตรวจสอบ Browser Console สำหรับ errors
2. ตรวจสอบ Firebase Console สำหรับ errors
3. ตรวจสอบ Network tab สำหรับ failed requests
4. ตรวจสอบ Firebase Rules ว่าอนุญาตการเข้าถึงถูกต้อง

---

## 📊 Monitoring

### Firebase Console

- **Authentication:** ตรวจสอบ user login/logout
- **Realtime Database:** ตรวจสอบ data reads/writes
- **Hosting:** ตรวจสอบ deployment history

### Application Monitoring

- **Error Tracking:** ตรวจสอบ Browser Console
- **Performance:** ตรวจสอบ Network tab
- **User Analytics:** ตรวจสอบ Firebase Analytics (ถ้ามี)

---

## 🔄 Rollback

ถ้าต้องการ rollback ไปยัง version ก่อนหน้า:

```bash
# ดู deployment history
firebase hosting:channel:list

# Rollback ไปยัง version ก่อนหน้า
firebase hosting:rollback
```

---

## 📝 Notes

- **Bundle Size Warning:** Ant Design bundle มีขนาดใหญ่กว่า 600 kB (ปกติสำหรับ Ant Design)
- **Console Logs:** มี console.log/error/warn ใน production code (ควรลบหรือใช้ environment variable)
- **Firebase Rules:** ต้อง deploy rules ทุกครั้งที่มีการเปลี่ยนแปลง

---

## 🎯 Best Practices

1. **Always test locally first:** `npm run dev`
2. **Build before deploy:** `npm run build`
3. **Deploy rules separately:** `firebase deploy --only database`
4. **Monitor after deploy:** ตรวจสอบ Firebase Console และ Browser Console
5. **Keep documentation updated:** อัปเดต docs เมื่อมีการเปลี่ยนแปลง

---

**หมายเหตุ:** คู่มือนี้สรุปขั้นตอนการ deploy สำหรับ Wedding Planner application

