// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type Side = 'groom' | 'bride' | 'both';

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string;
  age: number | null;
  gender: 'male' | 'female' | 'other';
  relationToCouple: string;
  side: Side;
  zoneId: string | null;
  tableId: string | null;
  note: string;
  seatNumber?: number | null;
  isComing?: boolean;
  accompanyingGuestsCount?: number;
  phoneNumber?: string; // For RSVP mapping
  // Check-in & grouping
  groupId?: string | null;
  groupName?: string | null;
  checkedInAt?: string | null;
  checkInMethod?: 'manual' | 'qr' | null;
  createdAt: string;
  updatedAt: string;
}

export interface Zone {
  id: string;
  zoneId: string;
  zoneName: string;
  description: string;
  capacity: number; // Computed: Sum of table capacities
  color: string;
  order: number;
}

export interface TableData {
  id: string;
  tableId: string;
  zoneId: string;
  tableName: string;
  capacity: number; // Max seats on this table
  note: string;
  order: number;
  x: number; // Percent from left (0-100)
  y: number; // Percent from top (0-100)
}

