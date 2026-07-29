/**
 * seed-admin.js — Creates (or updates) the admin user.
 *
 * Usage:  npm run db:seed-admin
 *
 * Reads credentials from env:
 *   ADMIN_EMAIL     (default: admin@driverent.com)
 *   ADMIN_PASSWORD  (default: Admin@12345  — change immediately after first login)
 *   ADMIN_NAME      (default: System Admin)
 */

import 'dotenv/config';
import bcrypt from 'bcrypt';
import { pool } from '../db/pool.js';

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@driverent.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345';
const ADMIN_NAME     = process.env.ADMIN_NAME     || 'System Admin';
const BCRYPT_ROUNDS  = 10;

async function seedAdmin() {
  console.log('🌱 Seeding admin user...');

  const existing = await pool.query(
    `SELECT id, email, role FROM users WHERE email = $1`,
    [ADMIN_EMAIL.toLowerCase()]
  );

  if (existing.rows.length > 0) {
    const user = existing.rows[0];
    if (user.role !== 'admin') {
      // Promote existing account to admin
      await pool.query(
        `UPDATE users SET role = 'admin', is_active = true WHERE id = $1`,
        [user.id]
      );
      console.log(`✅ Promoted existing user ${ADMIN_EMAIL} to admin (id: ${user.id})`);
    } else {
      console.log(`ℹ️  Admin already exists: ${ADMIN_EMAIL} (id: ${user.id}) — skipping`);
    }
    return;
  }

  const password_hash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role, is_active)
     VALUES ($1, $2, $3, 'admin', true)
     RETURNING id, email, full_name, role`,
    [ADMIN_EMAIL.toLowerCase(), password_hash, ADMIN_NAME]
  );

  const admin = result.rows[0];
  console.log('✅ Admin user created:');
  console.log(`   ID:       ${admin.id}`);
  console.log(`   Email:    ${admin.email}`);
  console.log(`   Name:     ${admin.full_name}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log('');
  console.log('⚠️  Change the admin password after your first login!');
}

seedAdmin()
  .catch((err) => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
