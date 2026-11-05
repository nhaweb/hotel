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

-- ==========================================
-- ADMIN & OPERATIONS EXTENSIONS
-- ==========================================

-- Physical Room Units per branch and floor
CREATE TABLE IF NOT EXISTS room_units (
  id VARCHAR(64) PRIMARY KEY,
  branch_id VARCHAR(64) NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  room_type_id VARCHAR(64) NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  room_number VARCHAR(32) NOT NULL,
  floor INT NOT NULL DEFAULT 1,
  status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_branch_room_number UNIQUE (branch_id, room_number)
);

CREATE INDEX IF NOT EXISTS idx_room_units_branch ON room_units(branch_id);
CREATE INDEX IF NOT EXISTS idx_room_units_status ON room_units(status);
CREATE INDEX IF NOT EXISTS idx_room_units_type ON room_units(room_type_id);

-- Alter bookings table to support PMS Room Assignment & Payment details
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assigned_room_unit_id VARCHAR(64) REFERENCES room_units(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(32) NOT NULL DEFAULT 'UNPAID';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_amount_vnd NUMERIC(12, 0) NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actual_check_in_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actual_check_out_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_bookings_assigned_unit ON bookings(assigned_room_unit_id);

-- Real-time FAQs table for AI Concierge & Hotel Helpdesk
CREATE TABLE IF NOT EXISTS faqs (
  id VARCHAR(64) PRIMARY KEY,
  category VARCHAR(64) NOT NULL,
  question TEXT NOT NULL,
  question_en TEXT,
  answer TEXT NOT NULL,
  answer_en TEXT,
  keywords TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active);

-- Services and Experiences Catalog
CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(64) PRIMARY KEY,
  branch_id VARCHAR(64) REFERENCES branches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  category VARCHAR(64) NOT NULL,
  price_vnd NUMERIC(12, 0),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin Activity Audit Logs
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_name VARCHAR(128) NOT NULL DEFAULT 'Admin Staff',
  action VARCHAR(64) NOT NULL,
  entity_type VARCHAR(32) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_created_at ON admin_activity_logs(created_at DESC);

-- ==========================================
-- ADMIN AUTHENTICATION & SESSIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(64) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  salt VARCHAR(64) NOT NULL,
  full_name VARCHAR(128) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'RECEPTIONIST', -- 'SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING'
  branch_id VARCHAR(64) REFERENCES branches(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token VARCHAR(128) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address VARCHAR(64),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);


-- ==========================================
-- MINI-CRM LEADS & INTERACTIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  email VARCHAR(255),
  source VARCHAR(64) NOT NULL DEFAULT 'WEBSITE',
  stage VARCHAR(32) NOT NULL DEFAULT 'NEW',
  priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
  branch_id VARCHAR(64) REFERENCES branches(id) ON DELETE SET NULL,
  room_type_id VARCHAR(64) REFERENCES room_types(id) ON DELETE SET NULL,
  estimated_check_in DATE,
  estimated_check_out DATE,
  num_guests INT DEFAULT 2,
  budget_vnd NUMERIC(12, 0),
  interest_notes TEXT,
  internal_notes TEXT,
  assigned_staff VARCHAR(128),
  tags TEXT[] DEFAULT '{}',
  converted_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_branch ON leads(branch_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

CREATE TABLE IF NOT EXISTS lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  staff_name VARCHAR(128) NOT NULL DEFAULT 'Sales Staff',
  type VARCHAR(32) NOT NULL, -- 'CALL', 'ZALO', 'EMAIL', 'NOTE', 'MEETING', 'STAGE_CHANGE'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_created_at ON lead_interactions(created_at DESC);

-- ==========================================
-- PAYMENTS & TRANSACTIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  transaction_code VARCHAR(64) NOT NULL UNIQUE,
  payment_method VARCHAR(32) NOT NULL,
  payment_type VARCHAR(32) NOT NULL DEFAULT 'DEPOSIT',
  amount_vnd NUMERIC(12, 2) NOT NULL,
  fee_vnd NUMERIC(12, 2) DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  provider_ref VARCHAR(128),
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_code ON payments(transaction_code);

-- ==========================================
-- ROOM HOLDS (Anti-Overbooking TTL Lock)
-- ==========================================

CREATE TABLE IF NOT EXISTS room_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id VARCHAR(64) NOT NULL REFERENCES room_types(id),
  branch_id VARCHAR(64) NOT NULL REFERENCES branches(id),
  session_id VARCHAR(128) NOT NULL,
  num_rooms INT NOT NULL DEFAULT 1,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_released BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_holds_lookup ON room_holds(room_type_id, check_in_date, check_out_date, expires_at);



