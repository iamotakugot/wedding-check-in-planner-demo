/**
 * Browser Helper Utilities
 * ฟังก์ชันช่วยเหลือสำหรับการทำงานกับเบราว์เซอร์
 */

import { detectOS } from './browserDetection';

/**
 * คัดลอก URL ไปยัง clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback สำหรับเบราว์เซอร์ที่ไม่มี Clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
}

/**
 * เปิด URL ในเบราว์เซอร์ภายนอก
 * iOS: ใช้ window.open() และแสดงคำแนะนำ
 * Android: ใช้ Intent URL scheme
 */
export function openInExternalBrowser(url: string): void {
  const os = detectOS();
  
  if (os === 'android') {
    // Android: ใช้ Intent URL scheme เพื่อเปิดใน Chrome
    try {
      // ลบ protocol prefix ออก
      const cleanUrl = url.replace(/^https?:\/\//, '');
      
      // สร้าง Intent URL สำหรับ Chrome
      const intentUrl = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
      
      // พยายามเปิดใน Chrome
      window.location.href = intentUrl;
      
      // Fallback: ถ้า Intent ไม่ทำงาน ให้เปิดแท็บใหม่ในแอป
      setTimeout(() => {
        window.open(url, '_blank');
      }, 800);
    } catch (error) {
      console.error('Error opening external browser on Android:', error);
      // Fallback: เปิดแท็บใหม่
      window.open(url, '_blank');
    }
  } else {
    // iOS หรืออื่นๆ: ใช้ window.open()
    try {
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening external browser:', error);
    }
  }
}

