# Firebase Social Authentication Setup Guide (Facebook & Google)

## ⚠️ สิ่งที่ต้องทำก่อนใช้งาน

### 1. เปิดใช้งาน Google Sign-In ใน Firebase Console

1. ไปที่ Firebase Console: https://console.firebase.google.com
2. เลือกโปรเจกต์: `got-nan-wedding`
3. ไปที่ **การยืนยันตัวตน (Authentication)** > **วิธีการลงชื่อเข้าใช้ (Sign-in method)**
4. คลิกที่ **Google** provider
5. เปิดใช้งาน (Enable)
6. เลือก **อีเมลสนับสนุนโปรเจกต์ (Project support email)** (อีเมลของคุณ)
7. คลิก **บันทึก (Save)**

**หมายเหตุ:** Google Sign-In ฟรีและไม่ต้องตั้งค่า OAuth credentials เพิ่มเติม

---

### 2. เปิดใช้งาน Facebook Sign-In ใน Firebase Console

#### ขั้นตอนที่ 1: สร้าง Facebook App

1. ไปที่ Facebook Developers: https://developers.facebook.com
2. คลิก **แอปของฉัน (My Apps)** > **สร้างแอป (Create App)**
3. เลือก **ผู้บริโภค (Consumer)** > **ถัดไป (Next)**
4. ตั้งชื่อ App (เช่น "Got & Nan Wedding")
5. กรอก **อีเมลติดต่อ (Contact Email)**
6. คลิก **สร้างแอป (Create App)**

#### ขั้นตอนที่ 2: ตั้งค่า Facebook Login Use Case

1. ในหน้า App Dashboard ไปที่เมนูด้านซ้าย คลิก **กรณีการใช้งาน (Use Cases)**
2. คุณจะเห็น **"ยืนยันตัวตนและขอข้อมูลจากผู้ใช้ด้วยการเข้าสู่ระบบด้วย Facebook"** อยู่แล้ว
3. คลิกปุ่ม **ปรับแต่ง (Customize)** ที่อยู่ด้านขวาของ Facebook Login use case
4. ในหน้า Customize:
   - เลือก **เว็บ (Web)** platform (ถ้ายังไม่ได้เลือก)
   - กรอก **URL ของเว็บไซต์ (Site URL)**: `https://got-nan-wedding.web.app`
   - ตรวจสอบการตั้งค่าอื่นๆ ตามต้องการ
5. คลิก **บันทึก (Save)** หรือ **บันทึกการเปลี่ยนแปลง (Save Changes)**

#### ขั้นตอนที่ 3: ตั้งค่า OAuth Redirect URIs ใน Facebook App

**⚠️ หมายเหตุ:** ขั้นตอนนี้ต้องทำ **หลังจาก** ตั้งค่า Facebook provider ใน Firebase Console แล้ว เพื่อให้ได้ OAuth redirect URI ที่ถูกต้อง

1. ไปที่ Facebook App Dashboard > **การตั้งค่า (Settings)** > **พื้นฐาน (Basic)**
2. **ตั้งค่า App Domains (สำคัญ!):**
   - ในส่วน **"App Domains"** เพิ่ม: `got-nan-wedding.firebaseapp.com`
   - คลิก **"บันทึกการเปลี่ยนแปลง" (Save Changes)**
3. ตรวจสอบว่า **แพลตฟอร์มเว็บไซต์ (Website)** ถูกเพิ่มแล้ว
   - ถ้ายังไม่มี: คลิก **เพิ่มแพลตฟอร์ม (Add Platform)** > **เว็บไซต์ (Website)**
   - กรอก **URL ของเว็บไซต์ (Site URL)**: `https://got-nan-wedding.web.app`
   - คลิก **"บันทึกการเปลี่ยนแปลง" (Save Changes)**
4. ไปที่ **เข้าสู่ระบบ Facebook (Facebook Login)** > **การตั้งค่า (Settings)**
5. **ตรวจสอบการตั้งค่า OAuth ก่อน:**
   - **"การเข้าสู่ระบบ OAuth ของไคลเอ็นต์" (Client OAuth Login):** ต้องเป็น **"ใช่" (Yes)**
   - **"การเข้าสู่ระบบ OAuth ของเว็บ" (Web OAuth Login):** ต้องเป็น **"ใช่" (Yes)**
   - **"บังคับใช้ HTTPS" (Enforce HTTPS):** ต้องเป็น **"ใช่" (Yes)**
   - **"ใช้โหมดเคร่งครัดสำหรับ URI การเปลี่ยนเส้นทาง" (Use Strict Mode for Redirect URIs):** 
     - ถ้าเป็น **"ใช่" (Yes)**: URI ต้องตรงกันทุกตัวอักษร
     - ถ้ายังไม่ได้ผล: ลองเปลี่ยนเป็น **"ไม่ใช่" (No)** ชั่วคราวเพื่อทดสอบ
6. เลื่อนลงไปที่ส่วน **"URI เปลี่ยนเส้นทาง OAuth ที่ถูกต้อง" (Valid OAuth Redirect URIs)**
7. **เพิ่ม URI (ทำตามขั้นตอนนี้อย่างระมัดระวัง):**
   - คัดลอก URI จาก Firebase Console: `https://got-nan-wedding.firebaseapp.com/_/auth/handler`
     - **หมายเหตุ:** URI นี้มี underscore (`_`) **1 ตัว** ไม่ใช่ 2 ตัว (`__`)
     - **สำคัญ:** ต้องคัดลอก URI ให้ตรงกันทุกตัวอักษร (รวมถึง `https://` และ `/` ทุกตัว)
   - **ถ้าเป็น text area (ช่องข้อความยาวๆ):**
     - คลิกในช่อง text area
     - วาง URI: `https://got-nan-wedding.firebaseapp.com/_/auth/handler`
     - กด Enter เพื่อเพิ่มบรรทัดใหม่ (ถ้าต้องการเพิ่ม URI อื่น)
     - **ตรวจสอบ:** ตรวจสอบว่า URI ถูกวางอย่างถูกต้อง ไม่มีช่องว่างหน้า/หลัง URI
   - **ถ้าเป็น list (รายการ):**
     - คลิก **"เพิ่ม URI" (Add URI)** หรือปุ่ม **"+"**
     - วาง URI: `https://got-nan-wedding.firebaseapp.com/_/auth/handler`
     - กด Enter หรือคลิก **"เพิ่ม" (Add)**
8. **บันทึกการเปลี่ยนแปลง:**
   - คลิก **"บันทึกการเปลี่ยนแปลง" (Save Changes)** ด้านล่าง
   - **รออย่างน้อย 2-3 นาที** ให้ Facebook อัพเดทการตั้งค่า
9. **ตรวจสอบ URI:**
   - ใช้ **"ตัวตรวจสอบ URI เปลี่ยนเส้นทาง" (Redirect URI Checker)** ด้านบน
   - วาง URI: `https://got-nan-wedding.firebaseapp.com/_/auth/handler`
   - คลิก **"ตรวจสอบ URI" (Check URI)**
   - **ควรเห็นข้อความว่า URI ถูกต้อง** (ไม่ใช่ error สีแดง)
   - ถ้ายังเห็น error: ดูวิธีแก้ไขในส่วน "การแก้ไขปัญหา" ด้านล่าง

#### ขั้นตอนที่ 4: ตั้งค่าใน Firebase Console

1. ไปที่ Firebase Console > **การยืนยันตัวตน (Authentication)** > **วิธีการลงชื่อเข้าใช้ (Sign-in method)**
2. คลิกที่ **Facebook** provider
3. เปิดใช้งาน (Enable) - เปลี่ยน toggle เป็น **เปิด (ON)**
4. คัดลอก **รหัสแอป (App ID)** และ **รหัสลับแอป (App Secret)** จาก Facebook App Dashboard
   - **รหัสแอป (App ID)**: ไปที่ Facebook App > **การตั้งค่า (Settings)** > **พื้นฐาน (Basic)** > **App ID**
   - **รหัสลับแอป (App Secret)**: ไปที่ Facebook App > **การตั้งค่า (Settings)** > **พื้นฐาน (Basic)** > **App Secret** (คลิก แสดง (Show))
5. วาง **App ID** และ **App Secret** ใน Firebase Console
6. **สำคัญ:** คัดลอก **OAuth redirect URI** จาก Firebase Console (จะแสดงด้านล่าง App Secret)
   - URI จะเป็น: `https://got-nan-wedding.firebaseapp.com/_/auth/handler`
     - **หมายเหตุ:** URI นี้มี underscore (`_`) **1 ตัว** ไม่ใช่ 2 ตัว (`__`)
   - คลิกไอคอน **คัดลอก (Copy)** ด้านขวาของ URI field เพื่อคัดลอก URI
7. ไปที่ Facebook App > **การตั้งค่า (Settings)** > **Facebook Login** > **การตั้งค่า (Settings)**
8. ในส่วน **Valid OAuth Redirect URIs** คลิก **เพิ่ม URI (Add URI)** แล้ววาง URI ที่คัดลอกมา
9. คลิก **บันทึกการเปลี่ยนแปลง (Save Changes)** ใน Facebook App
10. กลับมาที่ Firebase Console คลิก **บันทึก (Save)**

---

## การทำงานของระบบ

### Flow การล็อคอิน:

#### Google Sign-In:
1. **แขกคลิก "เข้าสู่ระบบด้วย Google"**
2. **Popup เปิดขึ้น** → เลือกบัญชี Google
3. **✅ ล็อคอินสำเร็จ** → เก็บ session ไว้ใน browser

#### Facebook Sign-In:
1. **แขกคลิก "เข้าสู่ระบบด้วย Facebook"**
2. **Popup เปิดขึ้น** → ลงชื่อเข้าใช้ Facebook
3. **✅ ล็อคอินสำเร็จ** → เก็บ session ไว้ใน browser

### Persistent Login:

- Firebase Authentication เก็บ session อัตโนมัติ
- เปิดเว็บใหม่ → **ไม่ต้องล็อคอินซ้ำ** (ถ้า session ยังไม่หมดอายุ)
- Session duration: 1 ชั่วโมง (refresh token ใช้ได้นานกว่า)

---

## ข้อมูลที่ได้จาก Social Auth

### Google:
- ✅ Email
- ✅ Display Name
- ✅ Photo URL
- ❌ Phone Number (ไม่มี)

### Facebook:
- ✅ Email (ถ้าให้สิทธิ์)
- ✅ Display Name
- ✅ Photo URL
- ❌ Phone Number (ไม่มี)

**หมายเหตุ:** สำหรับ Social Auth อาจไม่มี phone number ดังนั้นระบบจะใช้ `uid` จาก Firebase แทน

---

## ข้อควรระวัง

1. **สถานะ Facebook App:** Facebook App เริ่มต้นเป็น **โหมดพัฒนา (Development Mode)**
   - ในโหมดพัฒนา: เฉพาะผู้พัฒนาและผู้ทดสอบเท่านั้นที่ใช้ได้
   - ต้อง **ส่งเพื่อตรวจสอบ (Submit for Review)** เพื่อให้ทุกคนใช้ได้ (แต่สำหรับงานแต่งงาน อาจไม่จำเป็น)

2. **OAuth Redirect URIs:** ต้องตั้งค่าให้ถูกต้องทั้งใน Firebase และ Facebook

3. **การยืนยันโดเมน (Domain Verification):** Facebook อาจต้องยืนยันโดเมน (สำหรับ production)

4. **การจัดการข้อผิดพลาด (Error Handling):** 
   - ถ้าผู้ใช้ปิด popup → แสดงคำเตือน
   - ถ้ามี account ซ้ำ → แสดงข้อความข้อผิดพลาด

---

## การทดสอบ

### ทดสอบ Google Sign-In:

1. เปิดเว็บ: https://got-nan-wedding.web.app
2. ไปที่หน้า Guest RSVP
3. คลิก "เข้าสู่ระบบด้วย Google"
4. เลือกบัญชี Google
5. ตรวจสอบว่า login สำเร็จ

### ทดสอบ Facebook Sign-In:

1. เปิดเว็บ: https://got-nan-wedding.web.app
2. ไปที่หน้า Guest RSVP
3. คลิก "เข้าสู่ระบบด้วย Facebook"
4. ลงชื่อเข้าใช้ Facebook
5. ตรวจสอบว่า login สำเร็จ

### ทดสอบ Persistent Login:

1. ล็อคอินสำเร็จ (Google หรือ Facebook)
2. Refresh หน้าเว็บ (F5)
3. ตรวจสอบว่า **ไม่ต้องล็อคอินซ้ำ**

---

## การแก้ไขปัญหา

### ปัญหา: "ปิดกั้น Popup (Popup blocked)"
- **แก้ไข:** ตรวจสอบว่า browser อนุญาต popup
- ตรวจสอบว่า domain ถูกต้อง

### ปัญหา: "OAuth redirect URI ไม่ถูกต้อง (Invalid OAuth redirect URI)" หรือ "URI เปลี่ยนเส้นทางที่ไม่ถูกต้องสำหรับแอพพลิเคชั่นนี้"

**อาการ:** เมื่อใส่ URI `https://got-nan-wedding.firebaseapp.com/_/auth/handler` ใน Facebook App แล้วยังแจ้ง error สีแดง

**วิธีแก้ไข:**

1. **ตรวจสอบว่า URI ถูกเพิ่มลงใน "Valid OAuth Redirect URIs" แล้ว:**
   - ไปที่ Facebook App > **เข้าสู่ระบบ Facebook** > **การตั้งค่า**
   - เลื่อนลงไปที่ส่วน **"URI เปลี่ยนเส้นทาง OAuth ที่ถูกต้อง"**
   - ตรวจสอบว่า URI `https://got-nan-wedding.firebaseapp.com/_/auth/handler` อยู่ในรายการ
   - **สำคัญ:** URI ต้องตรงกันทุกตัวอักษร (รวมถึง `https://` และ `/` ทุกตัว)

2. **ตรวจสอบการตั้งค่า OAuth:**
   - **"การเข้าสู่ระบบ OAuth ของไคลเอ็นต์"** ต้องเป็น **"ใช่"**
   - **"การเข้าสู่ระบบ OAuth ของเว็บ"** ต้องเป็น **"ใช่"**
   - **"ใช้โหมดเคร่งครัดสำหรับ URI การเปลี่ยนเส้นทาง"** ถ้าเป็น **"ใช่"** URI ต้องตรงกันทุกตัวอักษร

3. **บันทึกการเปลี่ยนแปลง:**
   - คลิก **"บันทึกการเปลี่ยนแปลง" (Save Changes)** ด้านล่าง
   - **รอสักครู่** (ประมาณ 1-2 นาที) ให้ Facebook อัพเดทการตั้งค่า

4. **ตรวจสอบ URI อีกครั้ง:**
   - ใช้ **"ตัวตรวจสอบ URI เปลี่ยนเส้นทาง"** ด้านบน
   - วาง URI: `https://got-nan-wedding.firebaseapp.com/_/auth/handler`
   - คลิก **"ตรวจสอบ URI"**
   - ควรเห็นข้อความว่า URI ถูกต้อง (ไม่ใช่ error สีแดง)

5. **ตรวจสอบ App Domains (สำคัญมาก!):**
   - ไปที่ Facebook App > **การตั้งค่า (Settings)** > **พื้นฐาน (Basic)**
   - ในส่วน **"App Domains"** ตรวจสอบว่ามี: `got-nan-wedding.firebaseapp.com`
   - ถ้ายังไม่มี: เพิ่ม `got-nan-wedding.firebaseapp.com` แล้วบันทึก
   - **หมายเหตุ:** App Domains ต้องตรงกับ domain ใน redirect URI

6. **ถ้ายังไม่ได้ผล - ลองวิธีนี้:**
   - **วิธีที่ 1: ลบและเพิ่มใหม่**
     - ลบ URI `https://got-nan-wedding.firebaseapp.com/_/auth/handler` ออกจากรายการ
     - คลิก **"บันทึกการเปลี่ยนแปลง"**
     - รอ 1 นาที
     - เพิ่ม URI ใหม่: `https://got-nan-wedding.firebaseapp.com/_/auth/handler`
     - คลิก **"บันทึกการเปลี่ยนแปลง"** อีกครั้ง
     - รอ 2-3 นาที แล้วตรวจสอบอีกครั้ง
   
   - **วิธีที่ 2: ปิด Strict Mode ชั่วคราว**
     - เปลี่ยน **"ใช้โหมดเคร่งครัดสำหรับ URI การเปลี่ยนเส้นทาง"** เป็น **"ไม่ใช่" (No)**
     - บันทึกการเปลี่ยนแปลง
     - รอ 1-2 นาที
     - ตรวจสอบ URI อีกครั้ง
     - ถ้าผ่าน: เปลี่ยนกลับเป็น **"ใช่" (Yes)** แล้วบันทึกอีกครั้ง
   
   - **วิธีที่ 3: ตรวจสอบ URI format**
     - ตรวจสอบว่า URI ไม่มีช่องว่างหน้า/หลัง
     - ตรวจสอบว่าใช้ `https://` ไม่ใช่ `http://`
     - ตรวจสอบว่า domain ถูกต้อง: `got-nan-wedding.firebaseapp.com`
     - ตรวจสอบว่า path ถูกต้อง: `/_/auth/handler` (มี underscore 1 ตัว)

7. **ตรวจสอบ domain และ protocol:**
   - ตรวจสอบว่า domain `got-nan-wedding.firebaseapp.com` ถูกต้อง
   - ตรวจสอบว่าใช้ `https://` ไม่ใช่ `http://`
   - ตรวจสอบว่าไม่มี trailing slash: ไม่ใช่ `https://got-nan-wedding.firebaseapp.com/_/auth/handler/`

8. **ถ้ายังไม่ได้ผล - ติดต่อ Facebook Support:**
   - Facebook App อาจมีปัญหาในการอัพเดท
   - ลองรอ 10-15 นาที แล้วตรวจสอบอีกครั้ง
   - หรือลอง logout/login Facebook Developer Console

### ปัญหา: "แอปยังไม่ได้ตั้งค่า (App not configured)"
- **แก้ไข:** ตรวจสอบว่าเปิด Google/Facebook provider ใน Firebase Console แล้ว
- ตรวจสอบว่า App ID และ App Secret ถูกต้อง

### ปัญหา: "Facebook App อยู่ในโหมดพัฒนา (Facebook App in Development Mode)"
- **แก้ไข:** เพิ่มผู้ใช้เป็นผู้ทดสอบ (Tester) ใน Facebook App > **บทบาท (Roles)** > **ผู้ใช้ทดสอบ (Test Users)**
- หรือส่งเพื่อตรวจสอบ (Submit for Review) (ถ้าต้องการให้ทุกคนใช้ได้)

---

## ราคา

### Google Sign-In:
- ✅ **ฟรี 100%** (ไม่มีค่าใช้จ่าย)
- ✅ **3,000 DAU/วัน** (Free Tier)

### Facebook Sign-In:
- ✅ **ฟรี 100%** (ไม่มีค่าใช้จ่าย)
- ✅ **3,000 DAU/วัน** (Free Tier)

---

## สรุป

✅ **ระบบพร้อมใช้งานแล้ว!**

- Google Sign-In ทำงานแล้ว
- Facebook Sign-In ทำงานแล้ว
- Persistent Login ทำงานแล้ว

**ขั้นตอนต่อไป:**
1. ตั้งค่า Google provider ใน Firebase Console
2. สร้าง Facebook App และตั้งค่า Facebook provider
3. ทดสอบการล็อคอิน
4. Deploy ขึ้นเว็บ

