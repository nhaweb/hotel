-- PML Hotel Database Schema
-- Lakebase Postgres on Neon

CREATE TABLE IF NOT EXISTS branches (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(128) NOT NULL UNIQUE,
  tagline VARCHAR(255),
  address VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL DEFAULT '0789 780 167',
  email VARCHAR(128) NOT NULL DEFAULT 'contact@pmlhotel.com',
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_types (
  id VARCHAR(64) PRIMARY KEY,
  branch_id VARCHAR(64) NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(128) NOT NULL,
  size_sqm INT NOT NULL,
  max_guests INT NOT NULL DEFAULT 2,
  total_inventory INT NOT NULL DEFAULT 5,
  base_price_vnd NUMERIC(12, 0) NOT NULL,
  description TEXT,
  features TEXT[] DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  email VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code VARCHAR(32) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  branch_id VARCHAR(64) NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  room_type_id VARCHAR(64) NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  num_guests INT NOT NULL DEFAULT 2,
  num_rooms INT NOT NULL DEFAULT 1,
  total_amount_vnd NUMERIC(12, 0) NOT NULL DEFAULT 0,
  payment_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  booking_status VARCHAR(32) NOT NULL DEFAULT 'confirmed',
  special_requests TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_code ON bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_branch ON bookings(branch_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);

CREATE TABLE IF NOT EXISTS amenity_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(64) NOT NULL,
  branch_id VARCHAR(64) NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  service_type VARCHAR(64) NOT NULL,
  reservation_date DATE NOT NULL,
  time_slot VARCHAR(32) NOT NULL,
  party_size INT NOT NULL DEFAULT 2,
  status VARCHAR(32) NOT NULL DEFAULT 'confirmed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_amenity_date ON amenity_reservations(reservation_date, service_type);

