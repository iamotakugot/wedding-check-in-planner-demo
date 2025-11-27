/**
 * Audit Log Service Class
 * Singleton pattern สำหรับจัดการ Audit Log operations
 */

import { ref, push, set, get, query, orderByChild, limitToLast, onValue, DataSnapshot } from 'firebase/database';
import { database } from '@/firebase/config';
import { AuditLog } from '@/types';
import { AuthService } from './AuthService';
import { logger } from '@/utils/logger';

export class AuditLogService {
  private static instance: AuditLogService;
  private subscriptions: Map<string, () => void> = new Map();

  private constructor() {}

  static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  private auditLogsRef() {
    return ref(database, 'auditLogs');
  }

  /**
   * สร้าง Audit Log ใหม่
   * @param action - ประเภทการกระทำ (เช่น 'login_with_phone', 'rsvp_created')
   * @param metadata - ข้อมูลเพิ่มเติม (optional)
   */
  async create(action: string, metadata?: Record<string, any>): Promise<string> {
    try {
      const user = AuthService.getInstance().getCurrentUser();
      if (!user) {
        throw new Error('ต้องเข้าสู่ระบบก่อนบันทึก Audit Log');
      }

      const now = new Date().toISOString();
      const logData: Omit<AuditLog, 'logId'> = {
        uid: user.uid,
        action,
        metadata: metadata || {},
        createdAt: now,
      };

      const newRef = push(this.auditLogsRef());
      if (!newRef.key) {
        throw new Error('ไม่สามารถสร้าง Audit Log ได้');
      }

      const auditLog: AuditLog = {
        logId: newRef.key,
        ...logData,
      };

      await set(newRef, auditLog);
      logger.log(`[AuditLog] Created: ${action}`, { uid: user.uid, logId: newRef.key });
      return newRef.key;
    } catch (error) {
      logger.error('Error creating audit log:', error);
      throw error;
    }
  }

  /**
   * ดึง Audit Logs โดย UID
   * @param uid - Firebase Auth UID
   * @param limit - จำนวน logs ที่ต้องการ (default: 50)
   */
  async getByUid(uid: string, limit: number = 50): Promise<AuditLog[]> {
    try {
      const uidQuery = query(
        this.auditLogsRef(),
        orderByChild('uid'),
        limitToLast(limit)
      );
      const snapshot = await get(uidQuery);
      
      if (!snapshot.exists()) return [];
      
      const data = snapshot.val();
      const logs: AuditLog[] = Object.keys(data)
        .map(key => ({ logId: key, ...data[key] }))
        .filter((log: AuditLog) => log.uid === uid)
        .sort((a: AuditLog, b: AuditLog) => {
          const aTime = new Date(a.createdAt).getTime();
          const bTime = new Date(b.createdAt).getTime();
          return bTime - aTime; // เรียงจากใหม่ไปเก่า
        });
      
      return logs;
    } catch (error) {
      logger.error('Error getting audit logs by UID:', error);
      return [];
    }
  }

  /**
   * ดึง Audit Logs ล่าสุด (สำหรับ Admin)
   * @param limit - จำนวน logs ที่ต้องการ (default: 100)
   */
  async getRecent(limit: number = 100): Promise<AuditLog[]> {
    try {
      const user = AuthService.getInstance().getCurrentUser();
      if (!user) {
        throw new Error('ต้องเข้าสู่ระบบก่อน');
      }

      const isAdmin = await AuthService.getInstance().checkIsAdmin(user.uid);
      if (!isAdmin) {
        throw new Error('ไม่มีสิทธิ์เข้าถึง - เฉพาะ Admin เท่านั้น');
      }

      const recentQuery = query(
        this.auditLogsRef(),
        orderByChild('createdAt'),
        limitToLast(limit)
      );
      const snapshot = await get(recentQuery);
      
      if (!snapshot.exists()) return [];
      
      const data = snapshot.val();
      const logs: AuditLog[] = Object.keys(data)
        .map(key => ({ logId: key, ...data[key] }))
        .sort((a: AuditLog, b: AuditLog) => {
          const aTime = new Date(a.createdAt).getTime();
          const bTime = new Date(b.createdAt).getTime();
          return bTime - aTime; // เรียงจากใหม่ไปเก่า
        });
      
      return logs;
    } catch (error) {
      logger.error('Error getting recent audit logs:', error);
      throw error;
    }
  }

  /**
   * Subscribe to audit logs โดย UID
   * @param uid - Firebase Auth UID
   * @param callback - callback function
   * @param limit - จำนวน logs ที่ต้องการ (default: 50)
   */
  subscribeByUid(
    uid: string,
    callback: (logs: AuditLog[]) => void,
    limit: number = 50
  ): () => void {
    const subscriptionId = `auditLog_${uid}_${Date.now()}_${Math.random()}`;
    
    const uidQuery = query(
      this.auditLogsRef(),
      orderByChild('uid'),
      limitToLast(limit)
    );
    
    const unsubscribe = onValue(uidQuery, (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      
      const data = snapshot.val();
      const logs: AuditLog[] = Object.keys(data)
        .map(key => ({ logId: key, ...data[key] }))
        .filter((log: AuditLog) => log.uid === uid)
        .sort((a: AuditLog, b: AuditLog) => {
          const aTime = new Date(a.createdAt).getTime();
          const bTime = new Date(b.createdAt).getTime();
          return bTime - aTime; // เรียงจากใหม่ไปเก่า
        });
      
      callback(logs);
    });
    
    this.subscriptions.set(subscriptionId, unsubscribe);
    
    return () => {
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
    };
  }

  cleanup(): void {
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    this.subscriptions.clear();
  }
}
