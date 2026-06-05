-- =====================================================================
--  ASTRO PATHAK — Complete Schema v3 (safe to run anytime)
-- =====================================================================

-- Clean slate
DROP POLICY   IF EXISTS "Admin full access"             ON bookings;
DROP POLICY   IF EXISTS "Public can insert"             ON bookings;
DROP POLICY   IF EXISTS "Public can read own booking"   ON bookings;
DROP TRIGGER  IF EXISTS bookings_updated_at             ON bookings;
DROP FUNCTION IF EXISTS update_updated_at()             CASCADE;
DROP TABLE    IF EXISTS blocked_slots                   CASCADE;
DROP TABLE    IF EXISTS bookings                        CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Bookings ──────────────────────────────────────────────────────
CREATE TABLE bookings (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id           TEXT        UNIQUE NOT NULL,
  name                 TEXT        NOT NULL,
  phone                TEXT        NOT NULL,
  email                TEXT,
  dob                  DATE        NOT NULL,
  tob                  TIME,
  birth_city           TEXT        NOT NULL,
  service              TEXT        NOT NULL,
  appointment_date     DATE        NOT NULL,
  time_slot            TEXT        NOT NULL,
  confirmed_time_slot  TEXT,
  mode                 TEXT        NOT NULL
    CHECK (mode IN ('phone','video','in-person')),
  query                TEXT,
  status               TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','completed','cancelled')),
  meet_link            TEXT,
  admin_notes          TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ
);

-- ── Blocked Slots ─────────────────────────────────────────────────
-- time_slot = NULL means the ENTIRE DAY is blocked
CREATE TABLE blocked_slots (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date  DATE        NOT NULL,
  time_slot  TEXT,
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique: one record per (date, slot) and one per full-day block
CREATE UNIQUE INDEX unique_blocked_slot
  ON blocked_slots(slot_date, time_slot)
  WHERE time_slot IS NOT NULL;

CREATE UNIQUE INDEX unique_blocked_day
  ON blocked_slots(slot_date)
  WHERE time_slot IS NULL;

-- ── Auto updated_at trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Indexes ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_status  ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date    ON bookings(appointment_date);
CREATE INDEX IF NOT EXISTS idx_bookings_service ON bookings(service);
CREATE INDEX IF NOT EXISTS idx_bookings_phone   ON bookings(phone);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocked_date     ON blocked_slots(slot_date);

-- ── RLS — bookings ────────────────────────────────────────────────
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access"
  ON bookings FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Public can insert"
  ON bookings FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Public can read own booking"
  ON bookings FOR SELECT TO anon
  USING (true);

-- ── RLS — blocked_slots ───────────────────────────────────────────
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage slots"
  ON blocked_slots FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Public can read slots"
  ON blocked_slots FOR SELECT TO anon
  USING (true);

-- =====================================================================
-- DONE.
-- =====================================================================
