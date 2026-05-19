import pg from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

// Enhanced pool configuration with retry logic
const poolConfig = {
  connectionString: config.databaseUrl,
  ssl:
    config.nodeEnv === 'production'
      ? { rejectUnauthorized: false }
      : undefined,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  min: 5,  // Minimum number of clients to maintain
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection not established
  // Application name for monitoring
  application_name: 'rental_service_api',
};

export const pool = new Pool(poolConfig);

// Connection error handling with reconnection logic
pool.on('error', (err, client) => {
  console.error('Unexpected database pool error', err);
  // Log additional context for debugging
  if (client) {
    console.error('Error occurred on client', client.processID);
  }
});

pool.on('connect', () => {
  if (config.nodeEnv !== 'test') {
    console.log('[db] New client connected to database');
  }
});

pool.on('acquire', () => {
  // Can be used for metrics/monitoring
});

pool.on('remove', () => {
  if (config.nodeEnv !== 'test') {
    console.log('[db] Client removed from pool');
  }
});

// Database health check function
export async function checkDatabaseHealth() {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT NOW() as time, version() as version');
        return {
          healthy: true,
          timestamp: result.rows[0].time,
          version: result.rows[0].version,
          retries: retries,
        };
      } finally {
        client.release();
      }
    } catch (err) {
      retries++;
      console.error(`[db] Health check failed (attempt ${retries}/${MAX_RETRIES}):`, err.message);
      
      if (retries < MAX_RETRIES) {
        console.log(`[db] Retrying in ${RETRY_DELAY_MS}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        return {
          healthy: false,
          error: err.message,
          retries: retries,
        };
      }
    }
  }
}

// Graceful shutdown helper
export async function closeDatabase() {
  console.log('[db] Closing database pool...');
  await pool.end();
  console.log('[db] Database pool closed');
}

// Query wrapper with automatic retry for transient errors
export async function queryWithRetry(text, params, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (err) {
      lastError = err;
      
      // Only retry on connection-related errors
      const isRetryable = err.code === 'ECONNRESET' || 
                         err.code === 'ETIMEDOUT' || 
                         err.code === '08000' || // connection_exception
                         err.code === '08003' || // connection_does_not_exist
                         err.code === '08006';   // connection_failure
      
      if (!isRetryable || attempt === maxRetries - 1) {
        throw err;
      }
      
      console.log(`[db] Query failed with ${err.code}, retrying (${attempt + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
    }
  }
  
  throw lastError;
}
