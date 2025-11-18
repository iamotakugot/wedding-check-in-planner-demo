-- PostgreSQL schema (baseline)

CREATE TABLE IF NOT EXISTS zones (
  id TEXT PRIMARY KEY,
  zone_id TEXT UNIQUE NOT NULL,
  zone_name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  "order" INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_zones_order ON zones("order");

CREATE TABLE IF NOT EXISTS tables (
  id TEXT PRIMARY KEY,
  table_id TEXT UNIQUE NOT NULL,
  zone_id TEXT NOT NULL REFERENCES zones(zone_id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  capacity INT NOT NULL,
  note TEXT,
  "order" INT DEFAULT 0,
  x REAL NOT NULL,
  y REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tables_zone_order ON tables(zone_id, "order");

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guests (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  nickname TEXT,
  age INT,
  gender TEXT CHECK (gender IN ('male','female','other')),
  relation_to_couple TEXT,
  side TEXT CHECK (side IN ('groom','bride','both')) NOT NULL,
  note TEXT,
  zone_id TEXT REFERENCES zones(zone_id) ON DELETE SET NULL,
  table_id TEXT REFERENCES tables(table_id) ON DELETE SET NULL,
  seat_number INT,
  group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,
  group_name TEXT,
  checked_in_at TIMESTAMPTZ,
  check_in_method TEXT CHECK (check_in_method IN ('manual','qr')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guests_zone ON guests(zone_id);
CREATE INDEX IF NOT EXISTS idx_guests_table ON guests(table_id);
CREATE INDEX IF NOT EXISTS idx_guests_group ON guests(group_id);
CREATE INDEX IF NOT EXISTS idx_guests_checked ON guests(checked_in_at);

CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY,
  guest_id TEXT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  at TIMESTAMPTZ NOT NULL DEFAULT now(),
  method TEXT CHECK (method IN ('manual','qr')),
  actor TEXT
);

CREATE TABLE IF NOT EXISTS rsvps (
  id UUID PRIMARY KEY,
  guest_id TEXT REFERENCES guests(id) ON DELETE SET NULL,
  is_coming BOOLEAN,
  side TEXT CHECK (side IN ('groom','bride')),
  note TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
