import { readFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE_MIGRATION = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  driver_license_number VARCHAR(100),
  address TEXT,
  role VARCHAR(20) DEFAULT 'client',
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  license_plate VARCHAR(50) UNIQUE NOT NULL,
  fuel_type VARCHAR(50),
  transmission VARCHAR(50),
  daily_rate DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'available',
  current_odometer INTEGER,
  photo_urls TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES users(id),
  vehicle_id INTEGER REFERENCES vehicles(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  pickup_odometer INTEGER,
  return_odometer INTEGER,
  damage_charge DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR(50),
  paystack_reference VARCHAR(255),
  paystack_transaction_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_dates ON bookings(vehicle_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_paystack_ref ON payments(paystack_reference);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(100) PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT NOW()
);
`;

async function runMigration(client, filename) {
  const version = filename.replace('.sql', '');
  const check = await client.query(
    'SELECT 1 FROM schema_migrations WHERE version = $1',
    [version]
  );
  if (check.rows.length > 0) {
    console.log(`Skip ${version} (already applied)`);
    return;
  }

  const sql = readFileSync(join(__dirname, 'migrations', filename), 'utf8');
  await client.query(sql);
  await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
  console.log(`Applied ${version}`);
}

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(BASE_MIGRATION);

    const migrationsDir = join(__dirname, 'migrations');
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      await runMigration(client, file);
    }

    console.log('Database migrations completed successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
