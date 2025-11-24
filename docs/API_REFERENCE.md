# API Reference

## Service Classes

### RSVPService
```typescript
RSVPService.getInstance()
  .create(rsvp: Omit<RSVPData, 'id'>): Promise<string>
  .update(id: string, updates: Partial<RSVPData>): Promise<void>
  .getById(id: string): Promise<RSVPData | null>
  .getByUid(uid?: string): Promise<RSVPData | null>
  .getAll(): Promise<RSVPData[]>
  .subscribe(callback: (rsvps: RSVPData[]) => void): () => void
```

### GuestService
```typescript
GuestService.getInstance()
  .getAll(): Promise<Guest[]>
  .getById(id: string): Promise<Guest | null>
  .getByRsvpUid(rsvpUid: string): Promise<Guest | null>
  .create(guest: Guest): Promise<void>
  .update(id: string, updates: Partial<Guest>): Promise<void>
  .delete(id: string): Promise<void>
  .createFromRSVP(guest: Guest, rsvpUid: string): Promise<void>
  .subscribe(callback: (guests: Guest[]) => void): () => void
```

### ZoneService
```typescript
ZoneService.getInstance()
  .getAll(): Promise<Zone[]>
  .create(zone: Zone): Promise<void>
  .update(id: string, updates: Partial<Zone>): Promise<void>
  .delete(id: string): Promise<void>
  .subscribe(callback: (zones: Zone[]) => void): () => void
```

### TableService
```typescript
TableService.getInstance()
  .getAll(): Promise<TableData[]>
  .create(table: TableData): Promise<void>
  .update(id: string, updates: Partial<TableData>): Promise<void>
  .delete(id: string): Promise<void>
  .subscribe(callback: (tables: TableData[]) => void): () => void
```

### ConfigService
```typescript
ConfigService.getInstance()
  .getConfig(): Promise<WeddingConfig | null>
  .updateConfig(config: Partial<WeddingConfig>): Promise<void>
  .getWeddingCardConfig(): Promise<WeddingCardConfigFirebase | null>
  .updateWeddingCardConfig(config: Partial<WeddingCardConfigFirebase>): Promise<void>
  .subscribeWeddingCardConfig(callback: (config: WeddingCardConfigFirebase | null) => void): () => void
```

### AuthService
```typescript
AuthService.getInstance()
  .loginWithEmail(email: string, password: string): Promise<User>
  .logout(): Promise<void>
  .getCurrentUser(): User | null
  .onAuthStateChange(callback: (user: User | null) => void): () => void
  .signInWithGoogle(): Promise<void>
  .signInWithFacebook(): Promise<void>
  .checkRedirectResult(): Promise<User | null>
  .checkIsAdmin(uid: string): Promise<boolean>
```

## Manager Classes

### RSVPManager
```typescript
new RSVPManager()
  .createRSVPWithGuests(rsvpData: Omit<RSVPData, 'id'>): Promise<string>
  .syncRSVPToGuest(rsvpId: string): Promise<void>
```

### SeatingManager
```typescript
new SeatingManager()
  .calculateZoneCapacity(zoneId: string): Promise<number>
  .validateSeatingAssignment(guestId: string, tableId: string): Promise<{valid: boolean, error?: string}>
  .assignGuestToTable(guestId: string, tableId: string, zoneId: string): Promise<void>
  .unassignGuestFromTable(guestId: string): Promise<void>
  .getGuestsByTable(tableId: string): Promise<Guest[]>
  .getTablesByZone(zoneId: string): Promise<TableData[]>
  .deleteZoneWithTables(zoneId: string): Promise<void>
```

### CheckInManager
```typescript
new CheckInManager()
  .checkInGuest(guestId: string, method: 'manual' | 'qr'): Promise<void>
  .checkOutGuest(guestId: string): Promise<void>
  .checkInGroup(groupId: string, method: 'manual' | 'qr'): Promise<void>
  .checkOutGroup(groupId: string): Promise<void>
  .getCheckedInCount(): Promise<number>
  .getGuestsByGroup(groupId: string): Promise<Guest[]>
```

