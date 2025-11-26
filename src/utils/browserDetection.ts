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
 * ตรวจสอบว่าเป็น mobile device หรือไม่ (iOS หรือ Android)
 */
export function isMobileDevice(): boolean {
  return isIOS() || isAndroid();
}

/**
 * ตรวจสอบว่าเป็น in-app browser หรือไม่
 * รองรับ: Messenger, LINE, Instagram, X (Twitter)
 */
export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  
  // ตรวจสอบ iOS standalone mode (PWA) - ถ้าเป็น PWA ไม่นับว่าเป็น in-app browser
  const navigatorWithStandalone = window.navigator as NavigatorWithStandalone;
  const isStandalone = navigatorWithStandalone.standalone === true;
  if (isStandalone) return false;
  
  // ตรวจสอบ Messenger - เพิ่ม patterns ที่ละเอียดขึ้น
  const isMessenger = 
    /fban/i.test(userAgent) ||
    /fbav/i.test(userAgent) ||
    /fb_iab/i.test(userAgent) ||
    /fb4a/i.test(userAgent) ||
    /fbmd/i.test(userAgent) ||
    /fbsv/i.test(userAgent) ||
    /messenger/i.test(userAgent) ||
    /FBAN\/Messenger/i.test(userAgent) ||
    /Messenger\/\d+/i.test(userAgent) ||
    /FB_IAB.*Messenger/i.test(userAgent);
  
  // ตรวจสอบ LINE - เพิ่มการตรวจสอบ Line/ prefix
  const isLine = 
    /line/i.test(userAgent) ||
    /Line\/\d+/i.test(userAgent) ||
    /LineAndroid/i.test(userAgent) ||
    /LineiOS/i.test(userAgent);
  
  // ตรวจสอบ Instagram - เพิ่มการตรวจสอบ FB_IAB.*Instagram
  const isInstagram = 
    /instagram/i.test(userAgent) ||
    /FB_IAB.*Instagram/i.test(userAgent) ||
    /FBAN\/Instagram/i.test(userAgent);
  
  // ตรวจสอบ X (Twitter) - เพิ่มการตรวจสอบ TwitterAndroid, TwitteriOS
  const isTwitter = 
    /twitter/i.test(userAgent) ||
    /tweetdeck/i.test(userAgent) ||
    /TwitterAndroid/i.test(userAgent) ||
    /TwitteriOS/i.test(userAgent) ||
    /Twitter/i.test(userAgent);
  
  // ตรวจสอบ window features (in-app browser มักไม่มี window features บางอย่าง)
  const hasWindowFeatures = 
    window.screenX !== undefined || 
    window.screenY !== undefined ||
    window.outerWidth !== undefined ||
    window.outerHeight !== undefined;
  
  // ตรวจสอบ document.referrer - in-app browser มักมี referrer เป็น empty หรือไม่ใช่ external domain
  const referrer = typeof document !== 'undefined' ? document.referrer : '';
  const hasEmptyReferrer = referrer === '';
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const referrerIsSameOrigin = referrer.startsWith(currentOrigin);
  
  // ถ้าไม่มี window features และอยู่ในแอปแชต อาจเป็น in-app browser
  const suspiciousFeatures = !hasWindowFeatures && (isMessenger || isLine || isInstagram || isTwitter);
  
  // ถ้ามี referrer ที่ว่างเปล่าหรือเป็น same origin และอยู่ในแอปแชต อาจเป็น in-app browser
  const suspiciousReferrer = (hasEmptyReferrer || referrerIsSameOrigin) && (isMessenger || isLine || isInstagram || isTwitter);
  
  const result = isMessenger || isLine || isInstagram || isTwitter || suspiciousFeatures || suspiciousReferrer;
  
  // Debug logging (สามารถ disable ได้ด้วย flag)
  if (typeof window !== 'undefined' && (window as unknown as { __DEBUG_BROWSER_DETECTION__?: boolean }).__DEBUG_BROWSER_DETECTION__) {
    console.log('[Browser Detection]', {
      userAgent,
      isMessenger,
      isLine,
      isInstagram,
      isTwitter,
      hasWindowFeatures,
      referrer,
      hasEmptyReferrer,
      referrerIsSameOrigin,
      suspiciousFeatures,
      suspiciousReferrer,
      result
    });
  }
  
  return result;
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

