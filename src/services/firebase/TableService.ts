/**
 * Table Service Class
 * Singleton pattern สำหรับจัดการ Table operations
 */

import { ref, get, set, update, remove, onValue, DataSnapshot } from 'firebase/database';
import { database } from '@/firebase/config';
import { TableData } from '@/types';
import { AuthService } from './AuthService';

export class TableService {
  private static instance: TableService;
  private subscriptions: Map<string, () => void> = new Map();

  private constructor() {}

  static getInstance(): TableService {
    if (!TableService.instance) {
      TableService.instance = new TableService();
    }
    return TableService.instance;
  }

  private tablesRef() {
    return ref(database, 'tables');
  }

  private async requireAdmin(): Promise<void> {
    const user = AuthService.getInstance().getCurrentUser();
    if (!user) {
      throw new Error('ต้องเข้าสู่ระบบก่อน');
    }
    const isAdmin = await AuthService.getInstance().checkIsAdmin(user.uid);
    if (!isAdmin) {
      throw new Error('ไม่มีสิทธิ์เข้าถึง - เฉพาะ Admin เท่านั้น');
    }
  }

  async getAll(): Promise<TableData[]> {
    const snapshot = await get(this.tablesRef());
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.keys(data).map(key => ({ id: key, ...data[key] }));
  }

  async create(table: TableData): Promise<void> {
    await this.requireAdmin();
    await set(ref(database, `tables/${table.id}`), table);
  }

  async update(id: string, updates: Partial<TableData>): Promise<void> {
    await this.requireAdmin();
    await update(ref(database, `tables/${id}`), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  async delete(id: string): Promise<void> {
    await this.requireAdmin();
    await remove(ref(database, `tables/${id}`));
  }

  subscribe(callback: (tables: TableData[]) => void): () => void {
    const subscriptionId = `table_${Date.now()}_${Math.random()}`;
    
    const unsubscribe = onValue(this.tablesRef(), (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      const data = snapshot.val();
      const tables = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      callback(tables);
    });
    
    this.subscriptions.set(subscriptionId, unsubscribe);
    
    return () => {
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
    };
  }

  unsubscribe(id: string): void {
    const unsubscribe = this.subscriptions.get(id);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(id);
    }
  }

  cleanup(): void {
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    this.subscriptions.clear();
  }
}

