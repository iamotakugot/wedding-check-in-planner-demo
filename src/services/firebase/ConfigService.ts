/**
 * Config Service Class
 * Singleton pattern สำหรับจัดการ Config operations
 */

import { ref, get, update, onValue, DataSnapshot } from 'firebase/database';
import { database } from '@/firebase/config';
import { AuthService } from './AuthService';

export interface WeddingConfig {
  inviteLink?: string;
  weddingDate?: string;
  groomName?: string;
  brideName?: string;
  venue?: string;
  venueMapLink?: string;
}

export interface WeddingCardConfigFirebase {
  groom: {
    firstName: string;
    lastName: string;
    nickname: string;
    fullNameThai: string;
  };
  bride: {
    firstName: string;
    lastName: string;
    nickname: string;
    fullNameThai: string;
  };
  parents: {
    groom: {
      father: string;
      mother: string;
    };
    bride: {
      father: string;
      mother: string;
    };
  };
  nameOrder: 'bride-first' | 'groom-first';
  showParentsAtTop: boolean;
  dressCode?: {
    colors: string[];
    label?: string;
  };
}

export class ConfigService {
  private static instance: ConfigService;
  private subscriptions: Map<string, () => void> = new Map();

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private configRef() {
    return ref(database, 'config');
  }

  private weddingCardConfigRef() {
    return ref(database, 'config/weddingCard');
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

  async getConfig(): Promise<WeddingConfig | null> {
    const snapshot = await get(this.configRef());
    if (!snapshot.exists()) return null;
    return snapshot.val();
  }

  async updateConfig(config: Partial<WeddingConfig>): Promise<void> {
    await this.requireAdmin();
    await update(this.configRef(), config);
  }

  async getWeddingCardConfig(): Promise<WeddingCardConfigFirebase | null> {
    const snapshot = await get(this.weddingCardConfigRef());
    if (!snapshot.exists()) return null;
    return snapshot.val();
  }

  async updateWeddingCardConfig(config: Partial<WeddingCardConfigFirebase>): Promise<void> {
    await this.requireAdmin();
    await update(this.weddingCardConfigRef(), config);
  }

  subscribeWeddingCardConfig(callback: (config: WeddingCardConfigFirebase | null) => void): () => void {
    const subscriptionId = `config_${Date.now()}_${Math.random()}`;
    
    const unsubscribe = onValue(this.weddingCardConfigRef(), (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      callback(snapshot.val());
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

