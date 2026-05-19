import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@rental.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';
const ADMIN_NAME = process.env.ADMIN_NAME || 'System Admin';

async function seed() {
  const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const result = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       full_name = EXCLUDED.full_name,
       role = 'admin',
       is_active = true
     RETURNING id, email, full_name, role`,
    [ADMIN_EMAIL.toLowerCase(), password_hash, ADMIN_NAME]
  );

  console.log('Admin user ready:');
  console.log(result.rows[0]);
  console.log(`Login with email: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
