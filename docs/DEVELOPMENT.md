# Development Guide

## Code Review Checklist
- [ ] ตรวจสอบ infinite loops (useEffect dependencies)
- [ ] ตรวจสอบ memory leaks (cleanup functions)
- [ ] ตรวจสอบ type safety
- [ ] ตรวจสอบ error handling
- [ ] ตรวจสอบ performance (debounce, memoization)

## Testing Guidelines
- Manual testing สำหรับ critical flows
- Test mobile compatibility (Facebook Messenger browser)
- Test realtime sync (Card ↔ Admin)
- Test error scenarios

## Test Cases

### Group Check-in
- [ ] เลือกแขกจาก checkbox ใน Group Check-in Modal → เช็คอินสำเร็จ
- [ ] แขกที่ไม่มาร่วมงาน (`isComing === 'no'`) → ปุ่มเช็คอิน disabled
- [ ] แขกที่เช็คอินแล้ว → checkbox disabled
- [ ] เช็คอินหลายคนพร้อมกัน → Real-time sync ไปยัง Admin Panel

### Seating Click-based Assignment
- [ ] คลิกแขกจาก Sidebar → ระบบเข้าสู่ Assign Mode
- [ ] คลิกโต๊ะ → จัดที่นั่งสำเร็จ
- [ ] Drag & drop ถูก disable เมื่ออยู่ใน Assign Mode
- [ ] Visual indicator (border highlight) แสดงเมื่ออยู่ใน Assign Mode

### RSVP Status Integration
- [ ] แสดงสถานะตอบรับใน GuestsPage table
- [ ] เช็คอิน disabled สำหรับแขกที่ไม่มาร่วมงาน
- [ ] Real-time sync เมื่อ RSVP status เปลี่ยน

### Auth Testing

#### Normal Browser (Chrome/Safari)
- [ ] Facebook login ทำงานปกติ (ใช้ popup)
- [ ] Google login ทำงานปกติ (ใช้ popup)
- [ ] Redirect result ถูก handle ถูกต้องหลัง redirect
- [ ] Auth state persist หลัง refresh
- [ ] Logout ทำงานถูกต้อง

#### Messenger WebView
- [ ] เปิดลิงค์จาก Messenger → ไม่มี modal บังการ์ดหน้าแรก
- [ ] Flip ไปหน้า "ลงทะเบียน" → เห็น inline banner เตือน
- [ ] Banner มีปุ่ม "คัดลอกลิงก์" และ "เปิดในเบราว์เซอร์"
- [ ] ปุ่ม Facebook login ยังทำงานได้ (ไม่ถูก block)
- [ ] ปุ่ม "คัดลอกลิงก์" ทำงานถูกต้อง (แสดง toast เมื่อสำเร็จ)
- [ ] ปุ่ม "เปิดในเบราว์เซอร์" ทำงานถูกต้อง (เปิด external browser)
- [ ] Google login ยังทำงานได้ (ไม่ถูก block)
- [ ] ผู้ใช้สามารถกลับมาดูการ์ดและสลับไปมาระหว่างการ์ด ↔ ฟอร์มได้ตามปกติ

#### Instagram WebView
- [ ] เปิดลิงค์จาก Instagram → ไม่มี modal บังการ์ดหน้าแรก
- [ ] Flip ไปหน้า "ลงทะเบียน" → เห็น inline banner เตือน
- [ ] Banner มีปุ่ม "คัดลอกลิงก์" และ "เปิดในเบราว์เซอร์"
- [ ] Facebook login ยังทำงานได้ (ไม่ถูก block แต่ banner เตือน)

#### Facebook App WebView
- [ ] เปิดลิงค์จาก Facebook App → ไม่มี modal บังการ์ดหน้าแรก
- [ ] Flip ไปหน้า "ลงทะเบียน" → เห็น inline banner เตือน
- [ ] Banner มีปุ่ม "คัดลอกลิงก์" และ "เปิดในเบราว์เซอร์"
- [ ] Facebook login ยังทำงานได้ (ไม่ถูก block แต่ banner เตือน)

#### Redirect Flow
- [ ] Redirect result ถูก handle ถูกต้องใน normal browser
- [ ] Redirect result ไม่สำเร็จใน WebView → แสดง warning (ถ้ามี redirect params)
- [ ] SessionStorage error ไม่แสดง error message (log warning เท่านั้น)
- [ ] Auth state sync ถูกต้องหลัง redirect

## Pre-Deploy Checklist

1. **Type Checking**: `npm run typecheck`
   - ตรวจสอบว่าไม่มี type errors
   - ตรวจสอบว่าไม่มี unused variables/imports

2. **Build**: `npm run build`
   - ตรวจสอบว่าไม่มี build errors
   - ตรวจสอบ warnings (chunk size, etc.)
   - ตรวจสอบ bundle size

3. **Test in Development**:
   - Test critical flows (login, RSVP, check-in, seating)
   - Test mobile compatibility
   - Test realtime sync

4. **Deploy Firebase Rules**: `firebase deploy --only database`
   - ตรวจสอบว่า rules ถูก deploy แล้ว
   - ตรวจสอบว่า `.indexOn` rules ครบถ้วน

5. **Deploy Application**: `firebase deploy --only hosting`
   - ตรวจสอบว่า deploy สำเร็จ
   - ตรวจสอบ URL และ test production

6. **Post-Deploy Verification**:
   - Test production environment
   - Monitor errors และ performance
   - ตรวจสอบ realtime sync

## Deployment Process
1. `npm run typecheck && npm run build`
2. ตรวจสอบ build errors และ warnings
3. `firebase deploy --only database`
4. `firebase deploy --only hosting`
5. Monitor errors และ performance

## Troubleshooting

### Infinite Loops
- ตรวจสอบ useEffect dependencies
- ใช้ useRef สำหรับ values ที่ไม่ต้องการ trigger re-render
- ใช้ functional updates สำหรับ state

### Memory Leaks
- ตรวจสอบ cleanup functions ใน useEffect
- Unsubscribe Firebase listeners
- Remove event listeners

### Performance Issues
- ใช้ React DevTools Profiler
- ตรวจสอบ bundle size
- ใช้ code splitting
- Optimize Firebase queries

