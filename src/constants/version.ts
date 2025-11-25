/**
 * Application Version
 * อ่านจาก package.json ผ่าน Vite define
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Vite define
export const APP_VERSION = (import.meta as any).env?.VITE_APP_VERSION || '0.0.1';

// Build timestamp
export const BUILD_DATE = new Date().toISOString().split('T')[0];

