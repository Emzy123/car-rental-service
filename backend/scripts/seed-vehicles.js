import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const vehicles = [
  {
    make: 'Toyota',
    model: 'Corolla',
    year: 2023,
    license_plate: 'GR-1234-22',
    fuel_type: 'petrol',
    transmission: 'automatic',
    daily_rate: 45000,
    category: 'economy',
    seats: 5,
    luggage_capacity: 2,
    features: ['GPS', 'Bluetooth', 'Backup Camera'],
    photo_urls: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800'],
  },
  {
    make: 'Honda',
    model: 'CR-V',
    year: 2024,
    license_plate: 'GR-5678-22',
    fuel_type: 'hybrid',
    transmission: 'automatic',
    daily_rate: 75000,
    category: 'suv',
    seats: 5,
    luggage_capacity: 4,
    features: ['GPS', 'Bluetooth', 'Backup Camera', 'Sunroof'],
    photo_urls: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800'],
  },
  {
    make: 'Tesla',
    model: 'Model 3',
    year: 2024,
    license_plate: 'GR-9012-24',
    fuel_type: 'electric',
    transmission: 'automatic',
    daily_rate: 95000,
    category: 'electric',
    seats: 5,
    luggage_capacity: 3,
    features: ['GPS', 'Bluetooth', 'Autopilot'],
    photo_urls: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800'],
  },
  {
    make: 'Ford',
    model: 'Ranger',
    year: 2022,
    license_plate: 'GR-3456-22',
    fuel_type: 'diesel',
    transmission: 'manual',
    daily_rate: 65000,
    category: 'suv',
    seats: 5,
    luggage_capacity: 5,
    features: ['GPS', '4WD'],
    photo_urls: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800'],
  },
  {
    make: 'BMW',
    model: '3 Series',
    year: 2023,
    license_plate: 'GR-7890-23',
    fuel_type: 'petrol',
    transmission: 'automatic',
    daily_rate: 110000,
    category: 'luxury',
    seats: 5,
    luggage_capacity: 3,
    features: ['GPS', 'Bluetooth', 'Leather Seats', 'Premium Audio'],
    photo_urls: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800'],
  },
  {
    make: 'Mercedes-Benz',
    model: 'S-Class',
    year: 2024,
    license_plate: 'GR-1111-24',
    fuel_type: 'petrol',
    transmission: 'automatic',
    daily_rate: 180000,
    category: 'luxury',
    seats: 5,
    luggage_capacity: 4,
    features: ['GPS', 'Bluetooth', 'Massage Seats', 'Night Vision'],
    photo_urls: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800'],
  },
  {
    make: 'Porsche',
    model: '911 Carrera',
    year: 2023,
    license_plate: 'GR-2222-23',
    fuel_type: 'petrol',
    transmission: 'automatic',
    daily_rate: 220000,
    category: 'sports',
    seats: 2,
    luggage_capacity: 1,
    features: ['GPS', 'Bluetooth', 'Sport Exhaust', 'Track Mode'],
    photo_urls: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800'],
  },
  {
    make: 'Lamborghini',
    model: 'Urus',
    year: 2024,
    license_plate: 'GR-3333-24',
    fuel_type: 'petrol',
    transmission: 'automatic',
    daily_rate: 350000,
    category: 'luxury',
    seats: 5,
    luggage_capacity: 4,
    features: ['GPS', 'Bluetooth', 'Leather Seats', 'Sport Mode', '4WD'],
    photo_urls: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800'],
  },
  {
    make: 'Toyota',
    model: 'HiAce',
    year: 2023,
    license_plate: 'GR-4444-23',
    fuel_type: 'diesel',
    transmission: 'manual',
    daily_rate: 55000,
    category: 'van',
    seats: 14,
    luggage_capacity: 8,
    features: ['GPS', 'Bluetooth', 'Backup Camera'],
    photo_urls: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
  },
  {
    make: 'Hyundai',
    model: 'Tucson',
    year: 2023,
    license_plate: 'GR-5555-23',
    fuel_type: 'hybrid',
    transmission: 'automatic',
    daily_rate: 68000,
    category: 'suv',
    seats: 5,
    luggage_capacity: 3,
    features: ['GPS', 'Bluetooth', 'Backup Camera', 'Lane Assist'],
    photo_urls: ['https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?w=800'],
  },
  {
    make: 'Lexus',
    model: 'ES 350',
    year: 2024,
    license_plate: 'GR-6666-24',
    fuel_type: 'petrol',
    transmission: 'automatic',
    daily_rate: 130000,
    category: 'luxury',
    seats: 5,
    luggage_capacity: 3,
    features: ['GPS', 'Bluetooth', 'Leather Seats', 'Sunroof', 'Premium Audio'],
    photo_urls: ['https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800'],
  },
];

async function seed() {
  const loc = await pool.query('SELECT id FROM locations LIMIT 1');
  const locationId = loc.rows[0]?.id || null;

  for (const v of vehicles) {
    await pool.query(
      `INSERT INTO vehicles (
        make, model, year, license_plate, fuel_type, transmission, daily_rate,
        category, seats, luggage_capacity, features, photo_urls, status, location_id
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'available', $13)
       ON CONFLICT (license_plate) DO UPDATE SET
         category = EXCLUDED.category,
         seats = EXCLUDED.seats,
         luggage_capacity = EXCLUDED.luggage_capacity,
         features = EXCLUDED.features,
         daily_rate = EXCLUDED.daily_rate`,
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
        locationId,
      ]
    );
  }
  const count = await pool.query('SELECT COUNT(*)::int AS c FROM vehicles');
  console.log(`Vehicles in database: ${count.rows[0].c}`);
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
