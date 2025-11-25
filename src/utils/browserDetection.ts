/**
 * Browser Detection Utilities
 * ฟังก์ชันสำหรับตรวจสอบ in-app browser และระบบปฏิบัติการ
 */

/**
 * Interface สำหรับ Navigator ที่มี standalone property (iOS specific)
 */
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

/**
 * ตรวจสอบว่าระบบปฏิบัติการเป็น iOS หรือไม่
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
  const navigatorWithStandalone = window.navigator as NavigatorWithStandalone;
  const isStandalone = navigatorWithStandalone.standalone === true;
  
  return isIOSDevice || isStandalone;
}

/**
 * ตรวจสอบว่าระบบปฏิบัติการเป็น Android หรือไม่
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android/.test(userAgent);
}

/**
 * ตรวจสอบระบบปฏิบัติการ (iOS/Android/Other)
 */
export function detectOS(): 'ios' | 'android' | 'other' {
  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  return 'other';
}

/**
 * ตรวจสอบว่าเป็น in-app browser หรือไม่
 * รองรับ: Messenger, LINE, Instagram, X (Twitter)
 */
export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  const ua = userAgent.toLowerCase();
  
  // ตรวจสอบ Messenger
  const isMessenger = 
    ua.includes('fban') || 
    ua.includes('fbav') || 
    ua.includes('messenger') ||
    userAgent.includes('FBAN') ||
    userAgent.includes('FBAV');
  
  // ตรวจสอบ LINE
  const isLine = 
    ua.includes('line') || 
    userAgent.includes('Line');
  
  // ตรวจสอบ Instagram
  const isInstagram = 
    ua.includes('instagram') || 
    userAgent.includes('Instagram');
  
  // ตรวจสอบ X (Twitter)
  const isTwitter = 
    ua.includes('twitter') || 
    ua.includes('tweetdeck') ||
    userAgent.includes('Twitter');
  
  // ตรวจสอบ iOS standalone mode (PWA)
  const navigatorWithStandalone = window.navigator as NavigatorWithStandalone;
  const isStandalone = navigatorWithStandalone.standalone === true;
  
  // ถ้าเป็น standalone mode (PWA) ไม่นับว่าเป็น in-app browser
  if (isStandalone) return false;
  
  // ตรวจสอบ window features (in-app browser มักไม่มี window features บางอย่าง)
  const hasWindowFeatures = 
    window.screenX !== undefined || 
    window.screenY !== undefined ||
    window.outerWidth !== undefined ||
    window.outerHeight !== undefined;
  
  // ถ้าไม่มี window features และอยู่ในแอปแชต อาจเป็น in-app browser
  const suspiciousFeatures = !hasWindowFeatures && (isMessenger || isLine || isInstagram || isTwitter);
  
  return isMessenger || isLine || isInstagram || isTwitter || suspiciousFeatures;
}

/**
 * รับข้อความช่วยเหลือตามระบบปฏิบัติการ
 */
export function getBrowserHelpText(): {
  title: string;
  description: string;
  iosHint: string;
  androidHint: string;
} {
  return {
    title: 'เบราว์เซอร์ในแอปนี้อาจไม่รองรับการเข้าสู่ระบบด้วย Facebook / Google',
    description: 'หากล็อกอินไม่สำเร็จ แนะนำให้คัดลอกลิงก์แล้วเปิดในเบราว์เซอร์ภายนอก (Safari / Chrome)',
    iosHint: 'บน iPhone/iPad: แตะปุ่ม **…** มุมล่างขวา → เลือก "เปิดในเบราว์เซอร์ภายนอก / Open in Safari"',
    androidHint: 'บน Android: แตะปุ่ม **⋮** มุมขวาบน → เลือก "เปิดใน Chrome" หรือ "เปิดใน Samsung Internet"',
  };
}

