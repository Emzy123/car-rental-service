-- Migration 002: locations, enriched vehicles/bookings, saved vehicles

CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  type VARCHAR(50) DEFAULT 'city',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'economy';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS seats INTEGER DEFAULT 5;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS luggage_capacity INTEGER DEFAULT 2;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_location_id INTEGER REFERENCES locations(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS return_location_id INTEGER REFERENCES locations(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_time TIME DEFAULT '10:00';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS return_time TIME DEFAULT '10:00';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_requests TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS flight_number VARCHAR(50);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS extras JSONB DEFAULT '{}';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS extras_total DECIMAL(10,2) DEFAULT 0;

ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;

CREATE TABLE IF NOT EXISTS saved_vehicles (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, vehicle_id)
);

CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category);
CREATE INDEX IF NOT EXISTS idx_vehicles_daily_rate ON vehicles(daily_rate);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active);
