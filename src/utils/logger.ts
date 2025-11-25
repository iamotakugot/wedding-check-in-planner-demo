/**
 * Logger Utility
 * จัดการ console statements สำหรับ development และ production
 */

// ตรวจสอบว่าเป็น development mode หรือไม่
// ใน Vite: import.meta.env.MODE === 'development'
// ใน Node: process.env.NODE_ENV === 'development'
const isDevelopment = 
  (typeof import.meta !== 'undefined' && (import.meta as { env?: { MODE?: string; DEV?: boolean } }).env?.MODE === 'development') ||
  (typeof import.meta !== 'undefined' && (import.meta as { env?: { MODE?: string; DEV?: boolean } }).env?.DEV === true) ||
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');

/**
 * Logger object สำหรับจัดการ logging
 */
export const logger = {
  /**
   * Log messages (แสดงเฉพาะใน development)
   */
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Error messages (แสดงเสมอ - สำหรับ error tracking)
   */
  error: (...args: unknown[]): void => {
    console.error(...args);
    // TODO: Integrate with error tracking service (เช่น Sentry) ในอนาคต
  },

  /**
   * Warning messages (แสดงเฉพาะใน development)
   */
  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Info messages (แสดงเฉพาะใน development)
   */
  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Debug messages (แสดงเฉพาะใน development)
   */
  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};

