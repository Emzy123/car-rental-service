// Test setup and utilities
import { pool, closeDatabase } from '../src/db/pool.js';
import { config } from '../src/config/index.js';

// Test database configuration
export const TEST_DB_NAME = 'rental_service_test';

// Initialize test database
export async function setupTestDB() {
  // Create test database if it doesn't exist
  const adminPool = new (await import('pg')).Pool({
    connectionString: config.databaseUrl.replace(/\/[^/]+$/, '/postgres'),
  });
  
  try {
    await adminPool.query(`CREATE DATABASE ${TEST_DB_NAME}`);
  } catch (err) {
    if (!err.message.includes('already exists')) {
      throw err;
    }
  }
  
  await adminPool.end();
}

// Clean up test data
export async function cleanupTestData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE payments, bookings, saved_vehicles, vehicles, locations, users CASCADE');
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Create test user
export async function createTestUser({ email, password, full_name, role = 'client' }) {
  const bcrypt = await import('bcrypt');
  const password_hash = await bcrypt.hash(password, 10);
  
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [email, password_hash, full_name, role]
  );
  
  return result.rows[0];
}

// Create test vehicle
export async function createTestVehicle(vehicleData) {
  const {
    make = 'Toyota',
    model = 'Camry',
    year = 2023,
    license_plate = `TEST-${Date.now()}`,
    daily_rate = 100,
    status = 'available',
  } = vehicleData;
  
  const result = await pool.query(
    `INSERT INTO vehicles (make, model, year, license_plate, daily_rate, status)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [make, model, year, license_plate, daily_rate, status]
  );
  
  return result.rows[0];
}

// Create test booking
export async function createTestBooking({ client_id, vehicle_id, start_date, end_date, total_price }) {
  const result = await pool.query(
    `INSERT INTO bookings (client_id, vehicle_id, start_date, end_date, total_price, status)
     VALUES ($1, $2, $3, $4, $5, 'confirmed') RETURNING *`,
    [client_id, vehicle_id, start_date, end_date, total_price]
  );
  
  return result.rows[0];
}

// Generate auth token for testing
export async function generateAuthToken(user) {
  const jwt = await import('jsonwebtoken');
  return jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: '1h' });
}

// Request helper for tests
export async function makeRequest(app, method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const res = await fetch(`http://localhost:${config.port}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

// Global teardown
export async function teardownTests() {
  await closeDatabase();
}
