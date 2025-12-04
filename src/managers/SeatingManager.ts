/**
 * Seating Manager
 * Business logic สำหรับจัดการการจัดที่นั่ง
 */

import { TableData, Guest } from '@/types';
import { ZoneService } from '@/services/firebase/ZoneService';
import { TableService } from '@/services/firebase/TableService';
import { GuestService } from '@/services/firebase/GuestService';

export class SeatingManager {
  private zoneService: ZoneService;
  private tableService: TableService;
  private guestService: GuestService;

  constructor() {
    this.zoneService = ZoneService.getInstance();
    this.tableService = TableService.getInstance();
    this.guestService = GuestService.getInstance();
  }

  /**
   * คำนวณ capacity ของ zone จาก tables
   */
  async calculateZoneCapacity(zoneId: string): Promise<number> {
    const tables = await this.tableService.getAll();
    return tables
      .filter(t => t.zoneId === zoneId)
      .reduce((acc, t) => acc + t.capacity, 0);
  }

  /**
   * Validate seating assignment
   */
  async validateSeatingAssignment(guestId: string, tableId: string): Promise<{ valid: boolean; error?: string }> {
    const guest = await this.guestService.getById(guestId);
    // tableId is now table.tableId (unique identifier), not table.id
    const table = await this.tableService.getAll().then(tables => tables.find(t => t.tableId === tableId));

    if (!guest) {
      return { valid: false, error: 'ไม่พบ Guest' };
    }
    if (!table) {
      return { valid: false, error: 'ไม่พบ Table' };
    }
    if (guest.zoneId && guest.zoneId !== table.zoneId) {
      return { valid: false, error: 'Guest อยู่ใน Zone อื่น' };
    }

    // ตรวจสอบ capacity
    const guests = await this.guestService.getAll();
    const seatedGuests = guests.filter(g => g.tableId === tableId);
    if (seatedGuests.length >= table.capacity) {
      return { valid: false, error: 'โต๊ะเต็มแล้ว' };
    }

    return { valid: true };
  }

  /**
   * Assign guest to table (จัดที่นั่งรายบุคคล)
   */
  async assignGuestToTable(guestId: string, tableId: string, zoneId: string): Promise<void> {
    const validation = await this.validateSeatingAssignment(guestId, tableId);
    if (!validation.valid) {
      throw new Error(validation.error || 'ไม่สามารถจัดที่นั่งได้');
    }

    await this.guestService.update(guestId, { tableId, zoneId });
  }

  /**
   * Unassign guest from table
   */
  async unassignGuestFromTable(guestId: string): Promise<void> {
    await this.guestService.update(guestId, { tableId: null, zoneId: null });
  }

  /**
   * Unassign multiple guests from table
   */
  async unassignGuests(guestIds: string[]): Promise<void> {
    const updates = guestIds.map(id =>
      this.guestService.update(id, { tableId: null, zoneId: null })
    );
    await Promise.all(updates);
  }

  /**
   * Get guests by table
   */
  async getGuestsByTable(tableId: string): Promise<Guest[]> {
    const guests = await this.guestService.getAll();
    return guests.filter(g => g.tableId === tableId);
  }

  /**
   * Get tables by zone
   */
  async getTablesByZone(zoneId: string): Promise<TableData[]> {
    const tables = await this.tableService.getAll();
    return tables.filter(t => t.zoneId === zoneId);
  }

  /**
   * Delete zone and all its tables
   */
  async deleteZoneWithTables(zoneId: string): Promise<void> {
    const tables = await this.getTablesByZone(zoneId);

    // Delete all tables in zone
    for (const table of tables) {
      await this.tableService.delete(table.id);
    }

    // Delete zone
    await this.zoneService.delete(zoneId);
  }
}

