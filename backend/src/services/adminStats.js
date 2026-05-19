import { pool } from '../db/pool.js';
import { getOrSet } from './cache.js';
import { config } from '../config/index.js';

export async function getDashboardStats() {
  return getOrSet('dashboard:stats', async () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [revenue, fleet, activeBookings, utilization] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(amount), 0)::float AS total
         FROM payments
         WHERE status = 'completed' AND type = 'deposit'
         AND created_at >= $1`,
        [monthStart]
      ),
      pool.query(`SELECT COUNT(*)::int AS c FROM vehicles WHERE status NOT IN ('retired')`),
      pool.query(
        `SELECT COUNT(*)::int AS c FROM bookings WHERE status IN ('confirmed', 'active')`
      ),
      pool.query(
        `SELECT
           COUNT(DISTINCT b.vehicle_id)::float AS booked,
           (SELECT COUNT(*) FROM vehicles WHERE status = 'available')::float AS available
         FROM bookings b
         WHERE b.status IN ('confirmed', 'active')
           AND b.start_date <= CURRENT_DATE AND b.end_date >= CURRENT_DATE`
      ),
    ]);

    const fleetSize = fleet.rows[0].c;
    const booked = utilization.rows[0].booked || 0;
    const available = utilization.rows[0].available || 1;
    const utilizationRate = Math.round((booked / Math.max(available, 1)) * 100);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const lastRevenue = await pool.query(
      `SELECT COALESCE(SUM(amount), 0)::float AS total
       FROM payments WHERE status = 'completed' AND type = 'deposit'
       AND created_at >= $1 AND created_at <= $2`,
      [lastMonthStart, lastMonthEnd]
    );

    const currentRev = revenue.rows[0].total;
    const prevRev = lastRevenue.rows[0].total || 1;
    const revenueTrend = Math.round(((currentRev - prevRev) / prevRev) * 100);

    return {
      revenue_mtd: currentRev,
      revenue_trend_percent: revenueTrend,
      utilization_rate: utilizationRate,
      active_bookings: activeBookings.rows[0].c,
      fleet_size: fleetSize,
    };
  }, config.redis.ttl.dashboard);
}

export async function getDashboardCharts() {
  return getOrSet('dashboard:charts', async () => {
    const revenueTrend = await pool.query(
      `SELECT to_char(date_trunc('month', created_at), 'Mon') AS month,
              COALESCE(SUM(amount), 0)::float AS revenue
       FROM payments
       WHERE status = 'completed' AND type = 'deposit'
         AND created_at >= date_trunc('month', NOW()) - interval '11 months'
       GROUP BY date_trunc('month', created_at)
       ORDER BY date_trunc('month', created_at)`
    );

    const utilizationByCategory = await pool.query(
      `SELECT COALESCE(v.category, 'other') AS category, COUNT(b.id)::int AS bookings
       FROM bookings b
       JOIN vehicles v ON v.id = b.vehicle_id
       WHERE b.created_at >= NOW() - interval '30 days'
       GROUP BY v.category`
    );

    const topLocations = await pool.query(
      `SELECT COALESCE(l.name, 'Unknown') AS name, COUNT(b.id)::int AS count
       FROM bookings b
       LEFT JOIN locations l ON l.id = b.pickup_location_id
       GROUP BY l.name
       ORDER BY count DESC
       LIMIT 5`
    );

    const cancellation = await pool.query(
      `SELECT status, COUNT(*)::int AS count FROM bookings GROUP BY status`
    );

    const total = cancellation.rows.reduce((s, r) => s + r.count, 0);
    const cancelled = cancellation.rows.find((r) => r.status === 'cancelled')?.count || 0;

    return {
      revenue_trend: revenueTrend.rows,
      utilization_by_category: utilizationByCategory.rows,
      top_locations: topLocations.rows,
      cancellation_rate: total ? Math.round((cancelled / total) * 100) : 0,
    };
  }, config.redis.ttl.dashboard);
}

export async function getRecentActivity() {
  const result = await pool.query(
    `SELECT 'booking' AS type,
            u.full_name || ' booked ' || v.make || ' ' || v.model AS message,
            b.created_at AS at
     FROM bookings b
     JOIN users u ON u.id = b.client_id
     JOIN vehicles v ON v.id = b.vehicle_id
     ORDER BY b.created_at DESC
     LIMIT 15`
  );
  return result.rows;
}
