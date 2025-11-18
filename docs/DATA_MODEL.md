# DATA MODEL (Logical)

## Entities

### Guest
- id: string (pk)
- firstName, lastName, nickname
- age: number | null
- gender: enum('male','female','other')
- relationToCouple: string
- side: enum('groom','bride','both')
- note: string
- zoneId: string | null (fk -> Zone.zoneId)
- tableId: string | null (fk -> Table.tableId)
- seatNumber?: number | null
- groupId?: string | null (fk -> Group.id)
- groupName?: string | null (denormalized for convenience)
- checkedInAt?: datetime | null
- checkInMethod?: enum('manual','qr') | null
- createdAt, updatedAt: datetime

### Zone
- id: string (internal id)
- zoneId: string (public id, pk alternative)
- zoneName: string
- description: string
- capacity: number (computed from tables)
- color: string
- order: number

### Table
- id: string
- tableId: string (pk alternative)
- tableName: string
- zoneId: string (fk -> Zone.zoneId)
- capacity: number
- note: string
- order: number
- x, y: number (0-100, canvas positioning)

### Group
- id: string (pk)
- name: string
- note?: string
- createdAt, updatedAt

### CheckIn (optional separate audit)
- id: uuid
- guestId: string (fk -> Guest)
- at: datetime
- method: enum('manual','qr')
- actor: string (admin user id)

### RSVP (optional separate)
- id
- guestId (nullable if not mapped)
- isComing
- side
- accompanyingGuests (json)
- note
- createdAt

## Relationships
- Zone 1..N Table
- Table 0..N Guest
- Group 0..N Guest
- Guest 0..N CheckIn

## Notes
- We keep `zoneId`/`tableId` as public keys to align with existing FE state.
- `groupName` denormalized to speed up search in UI; backend is source of truth.
