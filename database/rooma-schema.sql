-- =====================================================================
-- ROOMA — PostgreSQL Schema
-- eLPi.dev | Elpyron Ltd.
--
-- Covers: users & auth, universities, multi-vertical listings
-- (hostels, hotels, rentals, sales), room types, media, bookings,
-- payments, ratings, saved listings, SMS MFA, and ownership verification.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- fuzzy text search on listing titles

-- ---------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------
CREATE TYPE user_role AS ENUM (
  'seeker',          -- students, travellers, home buyers/renters
  'landlord',
  'agent',
  'hotel_manager',
  'admin'
);

CREATE TYPE listing_type AS ENUM (
  'hostel',
  'hotel',
  'rental',
  'sale'
);

CREATE TYPE listing_status AS ENUM (
  'draft',
  'pending_review',
  'active',
  'inactive',
  'archived'
);

CREATE TYPE media_type AS ENUM ('image', 'video');

CREATE TYPE booking_status AS ENUM (
  'pending',         -- awaiting manager/landlord confirmation
  'confirmed',
  'rejected',
  'cancelled',
  'completed'
);

CREATE TYPE payment_provider AS ENUM (
  'mtn_momo',
  'telecel_cash',
  'paypal',
  'bank',
  'stripe'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'successful',
  'failed',
  'refunded'
);

CREATE TYPE document_type AS ENUM (
  'ownership_deed',
  'land_title',
  'id_verification',
  'other'
);

-- ---------------------------------------------------------------------
-- USERS & AUTH
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         VARCHAR(150) NOT NULL,
  email             VARCHAR(255) UNIQUE,
  phone_number      VARCHAR(20) UNIQUE NOT NULL,
  password_hash     TEXT NOT NULL,
  role              user_role NOT NULL DEFAULT 'seeker',
  phone_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  profile_photo_url TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role ON users(role);

-- SMS MFA codes issued at signup / login
CREATE TABLE sms_verifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code         VARCHAR(10) NOT NULL,
  purpose      VARCHAR(30) NOT NULL DEFAULT 'signup', -- signup | login | reset_password
  expires_at   TIMESTAMPTZ NOT NULL,
  verified_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sms_verifications_user ON sms_verifications(user_id);

-- ---------------------------------------------------------------------
-- UNIVERSITIES (for hostel/student housing search)
-- ---------------------------------------------------------------------
CREATE TABLE universities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(200) NOT NULL,
  city        VARCHAR(100),
  region      VARCHAR(100),
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- LISTINGS (base table for all four verticals)
-- ---------------------------------------------------------------------
CREATE TABLE listings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type              listing_type NOT NULL,
  title             VARCHAR(200) NOT NULL,
  description       TEXT,
  price             NUMERIC(12,2) NOT NULL,
  currency          VARCHAR(10) NOT NULL DEFAULT 'GHS',
  price_negotiable  BOOLEAN NOT NULL DEFAULT FALSE,
  status            listing_status NOT NULL DEFAULT 'draft',
  address           TEXT,
  latitude          DOUBLE PRECISION,
  longitude         DOUBLE PRECISION,
  average_rating    NUMERIC(3,2) DEFAULT 0,
  rating_count      INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listings_type ON listings(type);
CREATE INDEX idx_listings_owner ON listings(owner_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_location ON listings(latitude, longitude);
-- Speeds up text search on title/description
CREATE INDEX idx_listings_title_trgm ON listings USING GIN (title gin_trgm_ops);

-- ---------------------------------------------------------------------
-- VERTICAL-SPECIFIC DETAIL TABLES (1:1 extension of listings)
-- ---------------------------------------------------------------------

-- Hostels & student housing
CREATE TABLE hostel_details (
  listing_id      UUID PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  university_id   UUID REFERENCES universities(id),
  room_type       VARCHAR(50),          -- single, shared, self-contained
  capacity        INTEGER,
  distance_to_campus_km NUMERIC(5,2)
);

CREATE INDEX idx_hostel_university ON hostel_details(university_id);

-- Hotels & short-stays
CREATE TABLE hotel_details (
  listing_id   UUID PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  star_rating  SMALLINT CHECK (star_rating BETWEEN 1 AND 5),
  amenities    TEXT[]                 -- e.g. {'wifi','pool','parking'}
);

-- Room types within a hotel listing (a hotel can have multiple room categories)
CREATE TABLE room_types (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id        UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  name              VARCHAR(100) NOT NULL,   -- e.g. "Deluxe Double"
  price_per_night   NUMERIC(12,2) NOT NULL,
  capacity          INTEGER NOT NULL DEFAULT 1,
  quantity_available INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_room_types_listing ON room_types(listing_id);

-- Residential rentals
CREATE TABLE rental_details (
  listing_id    UUID PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  bedrooms      SMALLINT,
  bathrooms     SMALLINT,
  lease_term    VARCHAR(30),      -- monthly, 6-months, yearly
  furnished     BOOLEAN DEFAULT FALSE
);

-- Property sales
CREATE TABLE sale_details (
  listing_id        UUID PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  bedrooms          SMALLINT,
  bathrooms         SMALLINT,
  land_size_sqm     NUMERIC(10,2),
  ownership_verified BOOLEAN NOT NULL DEFAULT FALSE
);

-- ---------------------------------------------------------------------
-- OWNERSHIP VERIFICATION DOCUMENTS (property sales)
-- ---------------------------------------------------------------------
CREATE TABLE listing_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  doc_type     document_type NOT NULL,
  file_url     TEXT NOT NULL,         -- AWS S3 URL
  verified     BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by  UUID REFERENCES users(id),  -- admin who verified
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listing_documents_listing ON listing_documents(listing_id);

-- Owner identity capture (camera verification at listing time)
CREATE TABLE owner_verifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  selfie_url    TEXT NOT NULL,        -- AWS S3 URL, camera capture
  verified      BOOLEAN NOT NULL DEFAULT FALSE,
  captured_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- MEDIA (photos & short videos — shared across all listing types)
-- ---------------------------------------------------------------------
CREATE TABLE listing_media (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  media_type   media_type NOT NULL,
  url          TEXT NOT NULL,          -- AWS S3 URL
  display_order SMALLINT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listing_media_listing ON listing_media(listing_id);

-- ---------------------------------------------------------------------
-- SAVED LISTINGS (favorites / wishlist)
-- ---------------------------------------------------------------------
CREATE TABLE saved_listings (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

-- ---------------------------------------------------------------------
-- RATINGS & REVIEWS
-- ---------------------------------------------------------------------
CREATE TABLE ratings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, user_id)   -- one rating per user per listing
);

CREATE INDEX idx_ratings_listing ON ratings(listing_id);

-- ---------------------------------------------------------------------
-- BOOKINGS
-- ---------------------------------------------------------------------
CREATE TABLE bookings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id     UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  room_type_id   UUID REFERENCES room_types(id),   -- nullable, applies to hotel bookings
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in       DATE,
  check_out      DATE,
  status         booking_status NOT NULL DEFAULT 'pending',
  confirmed_by   UUID REFERENCES users(id),         -- manager/landlord who confirmed
  confirmed_at   TIMESTAMPTZ,
  total_amount   NUMERIC(12,2) NOT NULL,
  currency       VARCHAR(10) NOT NULL DEFAULT 'GHS',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (check_out IS NULL OR check_in IS NULL OR check_out >= check_in)
);

CREATE INDEX idx_bookings_listing ON bookings(listing_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- ---------------------------------------------------------------------
-- PAYMENTS
-- ---------------------------------------------------------------------
CREATE TABLE payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount           NUMERIC(12,2) NOT NULL,
  currency         VARCHAR(10) NOT NULL DEFAULT 'GHS',
  provider         payment_provider NOT NULL,
  status           payment_status NOT NULL DEFAULT 'pending',
  provider_reference TEXT,              -- transaction ID from MTN/Telecel/Stripe/etc.
  receipt_url      TEXT,                -- generated receipt, stored in S3
  paid_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ---------------------------------------------------------------------
-- UPDATED_AT AUTO-TOUCH TRIGGER (applied to tables with updated_at)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- END OF SCHEMA
-- =====================================================================
