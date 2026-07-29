/**
 * seed-vehicles.js — Seeds initial fleet of vehicles for DriveRent.
 *
 * Usage:  npm run db:seed-vehicles
 *
 * Checks existing license plates so it can be re-run safely without duplicates.
 */

import 'dotenv/config';
import { pool } from '../db/pool.js';

const VEHICLES = [
  {
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    license_plate: 'LAG-123-AA',
    fuel_type: 'petrol',
    transmission: 'automatic',
    daily_rate: 35000.00,
    category: 'economy',
    seats: 5,
    luggage_capacity: 3,
    features: ['Bluetooth', 'Cruise Control', 'Reverse Camera', 'Air Conditioning'],
    photo_urls: [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80',
    ],
    status: 'available',
    current_odometer: 15400,
  },
  {
    make: 'Honda',
    model: 'Accord',
    year: 2023,
    license_plate: 'LAG-456-BB',
    fuel_type: 'petrol',
    transmission: 'automatic',
    daily_rate: 40000.00,
    category: 'economy',
    seats: 5,
    luggage_capacity: 3,
    features: ['Apple CarPlay', 'Leather Seats', 'Lane Assist', 'Sunroof'],
    photo_urls: [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80',
    ],
    status: 'available',
    current_odometer: 8200,
  },
  {
    make: 'Toyota',
    model: 'Prado TX-L',
    year: 2022,
    license_plate: 'ABJ-789-CC',
    fuel_type: 'diesel',
    transmission: 'automatic',
    daily_rate: 95000.00,
    category: 'suv',
    seats: 7,
    luggage_capacity: 5,
    features: ['4WD / AWD', 'Leather Interior', 'Navigation', 'Cooler Box', 'Rear Entertainment'],
    photo_urls: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
    ],
    status: 'available',
    current_odometer: 24000,
  },
  {
    make: 'Mercedes-Benz',
    model: 'GLE 450',
    year: 2023,
    license_plate: 'LAG-999-VIP',
    fuel_type: 'petrol',
    transmission: 'automatic',
    daily_rate: 150000.00,
    category: 'luxury',
    seats: 5,
    luggage_capacity: 4,
    features: ['Burmester Sound System', 'Panoramic Sunroof', '360 Camera', 'Heated & Cooled Seats', 'Ambient Lighting'],
    photo_urls: [
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80',
    ],
    status: 'available',
    current_odometer: 5100,
  },
  {
    make: 'Tesla',
    model: 'Model Y',
    year: 2023,
    license_plate: 'LAG-001-EV',
    fuel_type: 'electric',
    transmission: 'automatic',
    daily_rate: 110000.00,
    category: 'electric',
    seats: 5,
    luggage_capacity: 4,
    features: ['Autopilot', 'Glass Roof', '15-inch Touchscreen', 'Supercharging Enabled', 'Premium Audio'],
    photo_urls: [
      'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80',
    ],
    status: 'available',
    current_odometer: 12000,
  },
  {
    make: 'Range Rover',
    model: 'Autobiography',
    year: 2023,
    license_plate: 'ABJ-007-RR',
    fuel_type: 'petrol',
    transmission: 'automatic',
    daily_rate: 250000.00,
    category: 'luxury',
    seats: 5,
    luggage_capacity: 4,
    features: ['Executive Rear Seating', 'Meridian Signature Sound', 'Air Suspension', 'Massage Seats', 'Deployable Steps'],
    photo_urls: [
      'https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?auto=format&fit=crop&w=1200&q=80',
    ],
    status: 'available',
    current_odometer: 4300,
  },
  {
    make: 'Toyota',
    model: 'HiAce Executive',
    year: 2021,
    license_plate: 'PHC-555-BUS',
    fuel_type: 'diesel',
    transmission: 'manual',
    daily_rate: 70000.00,
    category: 'van',
    seats: 14,
    luggage_capacity: 8,
    features: ['Reclining Seats', 'Dual AC', 'PA System', 'Tinted Windows'],
    photo_urls: [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    ],
    status: 'available',
    current_odometer: 45000,
  },
  {
    make: 'Ford',
    model: 'Mustang GT',
    year: 2022,
    license_plate: 'LAG-500-GT',
    fuel_type: 'petrol',
    transmission: 'automatic',
    daily_rate: 130000.00,
    category: 'sports',
    seats: 4,
    luggage_capacity: 2,
    features: ['V8 Engine', 'Active Exhaust', 'Brembo Brakes', 'Digital Dash', 'Launch Control'],
    photo_urls: [
      'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80',
    ],
    status: 'available',
    current_odometer: 11200,
  },
];

async function seedVehicles() {
  console.log('🌱 Seeding vehicles...');

  // Fetch locations to assign a default location if available
  const locationsRes = await pool.query('SELECT id FROM locations LIMIT 1');
  const defaultLocationId = locationsRes.rows.length > 0 ? locationsRes.rows[0].id : null;

  let inserted = 0;
  let skipped = 0;

  for (const v of VEHICLES) {
    const existing = await pool.query(
      `SELECT id FROM vehicles WHERE license_plate = $1`,
      [v.license_plate]
    );

    if (existing.rows.length > 0) {
      console.log(`  ↩  Skipped (already exists): ${v.make} ${v.model} (${v.license_plate})`);
      skipped++;
      continue;
    }

    const result = await pool.query(
      `INSERT INTO vehicles (
        make, model, year, license_plate, fuel_type, transmission, daily_rate,
        category, seats, luggage_capacity, features, photo_urls, status,
        current_odometer, location_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id`,
      [
        v.make,
        v.model,
        v.year,
        v.license_plate,
        v.fuel_type,
        v.transmission,
        v.daily_rate,
        v.category,
        v.seats,
        v.luggage_capacity,
        v.features,
        v.photo_urls,
        v.status,
        v.current_odometer,
        defaultLocationId,
      ]
    );

    console.log(`  ✅ Inserted [${result.rows[0].id}]: ${v.make} ${v.model} (${v.license_plate})`);
    inserted++;
  }

  console.log('');
  console.log(`✅ Vehicles done — ${inserted} inserted, ${skipped} skipped`);
}

seedVehicles()
  .catch((err) => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
