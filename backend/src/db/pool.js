import pg from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl:
    config.nodeEnv === 'production'
      ? { rejectUnauthorized: false }
      : undefined,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error', err);
});
