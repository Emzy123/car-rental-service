import Redis from 'ioredis';
import { config } from '../config/index.js';

let redis = null;

if (config.redis.enabled) {
  redis = new Redis(config.redis.url, {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      console.log(`[redis] Reconnecting in ${delay}ms...`);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });

  redis.on('connect', () => {
    console.log('[redis] Connected to Redis');
  });

  redis.on('error', (err) => {
    console.error('[redis] Error:', err.message);
  });
} else {
  console.log('[cache] Redis not configured - using in-memory cache fallback');
}

// In-memory fallback cache
const memoryCache = new Map();

/**
 * Get cached data or execute fetcher function
 * @param {string} key - Cache key
 * @param {Function} fetcher - Function to fetch data if not cached
 * @param {number} ttlSeconds - Time to live in seconds
 * @returns {Promise<any>} Cached or fetched data
 */
export async function getOrSet(key, fetcher, ttlSeconds = 300) {
  try {
    // Try Redis first
    if (redis) {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }

      const data = await fetcher();
      await redis.setex(key, ttlSeconds, JSON.stringify(data));
      return data;
    }

    // Fall back to memory cache
    const cached = memoryCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    const data = await fetcher();
    memoryCache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });
    return data;
  } catch (err) {
    console.error('[cache] Error:', err.message);
    // On cache error, just execute fetcher
    return fetcher();
  }
}

/**
 * Invalidate cache by key or pattern
 * @param {string} key - Cache key or pattern
 * @param {boolean} isPattern - Whether key is a pattern
 */
export async function invalidate(key, isPattern = false) {
  try {
    if (redis) {
      if (isPattern) {
        const keys = await redis.keys(key);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else {
        await redis.del(key);
      }
    } else {
      // Memory cache - simple prefix match for patterns
      if (isPattern) {
        const prefix = key.replace('*', '');
        for (const k of memoryCache.keys()) {
          if (k.startsWith(prefix)) {
            memoryCache.delete(k);
          }
        }
      } else {
        memoryCache.delete(key);
      }
    }
  } catch (err) {
    console.error('[cache] Invalidation error:', err.message);
  }
}

/**
 * Clear all cache
 */
export async function clear() {
  try {
    if (redis) {
      await redis.flushall();
    } else {
      memoryCache.clear();
    }
    console.log('[cache] Cache cleared');
  } catch (err) {
    console.error('[cache] Clear error:', err.message);
  }
}

/**
 * Generate cache key from parameters
 * @param {string} prefix - Key prefix
 * @param {Object} params - Parameters to include in key
 * @returns {string} Cache key
 */
export function generateKey(prefix, params = {}) {
  const sorted = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(':');
  return sorted ? `${prefix}:${sorted}` : prefix;
}

/**
 * Check if cache is healthy
 * @returns {Promise<boolean>}
 */
export async function isHealthy() {
  if (!redis) return true; // Memory cache is always "healthy"
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}

export { redis };
