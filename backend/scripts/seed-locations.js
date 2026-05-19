import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const locations = [
  { name: 'Kotoka International Airport', city: 'Accra', type: 'airport' },
  { name: 'Accra City Center', city: 'Accra', type: 'city' },
  { name: 'Kumasi Airport', city: 'Kumasi', type: 'airport' },
  { name: 'Lagos Airport Terminal', city: 'Lagos', type: 'airport' },
  { name: 'Victoria Island Branch', city: 'Lagos', type: 'city' },
];

async function seed() {
  for (const loc of locations) {
    await pool.query(
      `INSERT INTO locations (name, city, type, is_active)
       VALUES ($1, $2, $3, true)
       ON CONFLICT DO NOTHING`,
      [loc.name, loc.city, loc.type]
    );
  }
  const count = await pool.query('SELECT COUNT(*)::int AS c FROM locations');
  console.log(`Locations in database: ${count.rows[0].c}`);
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
