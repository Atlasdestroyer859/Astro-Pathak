-- Astro Pathak: Vedic Jyotish Consultation Platform
-- Run this in Supabase SQL Editor

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  dob DATE NOT NULL,
  tob TIME,
  birth_city TEXT NOT NULL,
  service TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('online', 'in_person')),
  query TEXT,
  payment_status TEXT NOT NULL DEFAULT 'na' CHECK (payment_status IN ('pending', 'paid', 'na')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  meet_link TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can INSERT (create a booking)
CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Only authenticated (admin) can SELECT / UPDATE / DELETE
CREATE POLICY "Admins can read all bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admins can delete bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING (true);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_service ON bookings(service);
CREATE INDEX IF NOT EXISTS idx_bookings_appointment_date ON bookings(appointment_date);
