// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type Side = 'groom' | 'bride' | 'both';

export interface Guest {
  id: string;
  rsvpId?: string | null; // Link back to RSVP (ถ้ามี) - ใช้แทน rsvpUid ในโครงสร้างใหม่
  rsvpUid?: string | null; // Deprecated: เก็บไว้เพื่อ backward compatibility
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

export interface RSVPData {
  id?: string;
  uid?: string; // Firebase Auth UID ของผู้สร้าง RSVP
  firstName: string;
  lastName: string;
  fullName?: string; // Denormalized: ชื่อ-นามสกุลรวมกัน
  photoURL?: string | null; // URL ภาพจาก Facebook/Google
  nickname: string;
  isComing: 'yes' | 'no';
  side: 'groom' | 'bride';
  relation: string;
  note: string;
  accompanyingGuestsCount: number;
  accompanyingGuests: { name: string; relationToMain: string }[];
  guestId?: string | null; // Link to Guest if exists
  createdAt: string;
  updatedAt: string;
}

