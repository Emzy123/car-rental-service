/**
 * seed-locations.js — Seeds pickup and return locations.
 *
 * Usage:  npm run db:seed-locations
 *
 * Locations are idempotent — existing ones are left untouched.
 * New ones are inserted only if no location with the same name+city exists.
 */

import 'dotenv/config';
import { pool } from '../db/pool.js';

const LOCATIONS = [
  // Lagos
  { name: 'Murtala Muhammed International Airport', city: 'Lagos',   type: 'airport' },
  { name: 'Victoria Island Office',                 city: 'Lagos',   type: 'city'    },
  { name: 'Ikeja Branch',                           city: 'Lagos',   type: 'city'    },
  { name: 'Lekki Phase 1 Office',                   city: 'Lagos',   type: 'city'    },

  // Abuja
  { name: 'Nnamdi Azikiwe International Airport',   city: 'Abuja',   type: 'airport' },
  { name: 'Central Business District Office',       city: 'Abuja',   type: 'city'    },
  { name: 'Wuse II Branch',                         city: 'Abuja',   type: 'city'    },

  // Port Harcourt
  { name: 'Port Harcourt International Airport',    city: 'Port Harcourt', type: 'airport' },
  { name: 'GRA Phase II Office',                    city: 'Port Harcourt', type: 'city'    },

  // Kano
  { name: 'Mallam Aminu Kano International Airport', city: 'Kano',   type: 'airport' },
  { name: 'Kano City Centre Branch',                 city: 'Kano',   type: 'city'    },
];

async function seedLocations() {
  console.log('🌱 Seeding locations...');

  let inserted = 0;
  let skipped  = 0;

  for (const loc of LOCATIONS) {
    const existing = await pool.query(
      `SELECT id FROM locations WHERE name = $1 AND city = $2`,
      [loc.name, loc.city]
    );

    if (existing.rows.length > 0) {
      console.log(`  ↩  Skipped (already exists): ${loc.name}, ${loc.city}`);
      skipped++;
      continue;
    }

    const result = await pool.query(
      `INSERT INTO locations (name, city, type, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING id`,
      [loc.name, loc.city, loc.type]
    );
    console.log(`  ✅ Inserted [${result.rows[0].id}]: ${loc.name}, ${loc.city} (${loc.type})`);
    inserted++;
  }

  console.log('');
  console.log(`✅ Locations done — ${inserted} inserted, ${skipped} skipped`);
}

seedLocations()
  .catch((err) => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
