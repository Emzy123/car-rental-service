import { pool } from '../db/pool.js';

const BLOCKING_STATUSES = ['pending', 'confirmed', 'active'];

export async function isVehicleAvailable(client, vehicleId, startDate, endDate, excludeBookingId = null) {
  const vehicleResult = await client.query(
    `SELECT id, status, daily_rate FROM vehicles WHERE id = $1 FOR UPDATE`,
    [vehicleId]
  );

  if (vehicleResult.rows.length === 0) {
    return { available: false, reason: 'Vehicle not found', vehicle: null };
  }

  const vehicle = vehicleResult.rows[0];
  if (['maintenance', 'retired'].includes(vehicle.status)) {
    return { available: false, reason: `Vehicle is ${vehicle.status}`, vehicle };
  }

  const params = [vehicleId, endDate, startDate, BLOCKING_STATUSES];
  let overlapSql = `
    SELECT id FROM bookings
    WHERE vehicle_id = $1
      AND status = ANY($4)
      AND start_date < $2
      AND end_date > $3
  `;

  if (excludeBookingId) {
    params.push(excludeBookingId);
    overlapSql += ` AND id != $${params.length}`;
  }

  const overlap = await client.query(overlapSql, params);
  if (overlap.rows.length > 0) {
    return { available: false, reason: 'Vehicle is already booked for these dates', vehicle };
  }

  return { available: true, vehicle };
}

export async function searchVehicles({
  query,
  startDate,
  endDate,
  limit = 20,
}) {
  const params = [];
  let paramIndex = 1;
  
  // Build the search query
  const searchConditions = [];
  
  if (query && query.trim()) {
    params.push(query.trim());
    searchConditions.push(`v.search_vector @@ plainto_tsquery('english', $${paramIndex++})`);
  }
  
  if (startDate && endDate) {
    params.push(endDate, startDate, BLOCKING_STATUSES);
    searchConditions.push(`NOT EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.vehicle_id = v.id
        AND b.status = ANY($${paramIndex + 2})
        AND b.start_date < $${paramIndex}
        AND b.end_date > $${paramIndex + 1}
    )`);
    paramIndex += 3;
  }
  
  // Always filter out unavailable vehicles
  searchConditions.push(`v.status NOT IN ('maintenance', 'retired')`);
  
  const whereClause = searchConditions.join(' AND ');
  
  const searchSql = `
    SELECT v.*,
      ts_rank(v.search_vector, plainto_tsquery('english', $1)) as rank
    FROM vehicles v
    WHERE ${whereClause}
    ORDER BY ${query ? 'rank DESC, ' : ''}v.daily_rate ASC
    LIMIT $${paramIndex++}
  `;
  
  params.push(limit);
  
  const result = await pool.query(searchSql, params);
  return result.rows;
}

export async function getAvailableVehicles({
  startDate,
  endDate,
  fuelType,
  transmission,
  category,
  minPrice,
  maxPrice,
  seats,
  features,
  searchQuery,
  sort = 'recommended',
  page = 1,
  limit = 12,
}) {
  const params = [endDate, startDate, BLOCKING_STATUSES];
  let paramIndex = 4;
  const filters = [`v.status NOT IN ('maintenance', 'retired')`];

  if (fuelType) {
    filters.push(`v.fuel_type = $${paramIndex++}`);
    params.push(fuelType);
  }
  if (transmission) {
    filters.push(`v.transmission = $${paramIndex++}`);
    params.push(transmission);
  }
  if (category) {
    filters.push(`v.category = $${paramIndex++}`);
    params.push(category);
  }
  if (minPrice != null && minPrice !== '') {
    filters.push(`v.daily_rate >= $${paramIndex++}`);
    params.push(Number(minPrice));
  }
  if (maxPrice != null && maxPrice !== '') {
    filters.push(`v.daily_rate <= $${paramIndex++}`);
    params.push(Number(maxPrice));
  }
  if (seats) {
    filters.push(`v.seats >= $${paramIndex++}`);
    params.push(Number(seats));
  }
  if (features) {
    const featureList = String(features).split(',').map((f) => f.trim()).filter(Boolean);
    if (featureList.length > 0) {
      filters.push(`v.features @> $${paramIndex++}::text[]`);
      params.push(featureList);
    }
  }
  
  // Add full-text search if provided
  if (searchQuery && searchQuery.trim()) {
    filters.push(`v.search_vector @@ plainto_tsquery('english', $${paramIndex++})`);
    params.push(searchQuery.trim());
  }

  const orderMap = {
    recommended: 'v.daily_rate ASC, v.make ASC',
    price_asc: 'v.daily_rate ASC',
    price_desc: 'v.daily_rate DESC',
    newest: 'v.created_at DESC',
  };
  const orderBy = orderMap[sort] || orderMap.recommended;

  const offset = (Math.max(1, page) - 1) * limit;

  const baseWhere = `
    FROM vehicles v
    WHERE ${filters.join(' AND ')}
      AND NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.vehicle_id = v.id
          AND b.status = ANY($3)
          AND b.start_date < $1
          AND b.end_date > $2
      )
  `;

  const countSql = `SELECT COUNT(*)::int AS total ${baseWhere}`;
  const countResult = await pool.query(countSql, params);
  const total = countResult.rows[0].total;

  const dataSql = `
    SELECT v.* ${baseWhere}
    ORDER BY ${orderBy}
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  params.push(limit, offset);

  const result = await pool.query(dataSql, params);

  return {
    vehicles: result.rows,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit) || 1,
  };
}
