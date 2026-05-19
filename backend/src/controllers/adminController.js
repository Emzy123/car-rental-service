import { pool } from '../db/pool.js';
import { Parser } from '@json2csv/plainjs';
import { AppError } from '../utils/errors.js';
import {
  getDashboardStats,
  getDashboardCharts,
  getRecentActivity,
} from '../services/adminStats.js';

export async function dashboardStats(req, res, next) {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

export async function dashboardCharts(req, res, next) {
  try {
    const charts = await getDashboardCharts();
    res.json(charts);
  } catch (err) {
    next(err);
  }
}

export async function activityFeed(req, res, next) {
  try {
    const activity = await getRecentActivity();
    res.json({ activity });
  } catch (err) {
    next(err);
  }
}

export async function listVehicles(req, res, next) {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const params = [];
    const filters = ['1=1'];
    let i = 1;

    if (search) {
      filters.push(`(make ILIKE $${i} OR model ILIKE $${i} OR license_plate ILIKE $${i})`);
      params.push(`%${search}%`);
      i++;
    }
    if (status) {
      filters.push(`status = $${i++}`);
      params.push(status);
    }

    const offset = (Math.max(1, page) - 1) * limit;
    const count = await pool.query(
      `SELECT COUNT(*)::int AS total FROM vehicles WHERE ${filters.join(' AND ')}`,
      params
    );

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT * FROM vehicles WHERE ${filters.join(' AND ')}
       ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i}`,
      params
    );

    const total = count.rows[0].total;
    res.json({
      vehicles: result.rows,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
}

export async function createVehicle(req, res, next) {
  try {
    const {
      make,
      model,
      year,
      license_plate,
      fuel_type,
      transmission,
      daily_rate,
      category,
      seats,
      luggage_capacity,
      features,
      photo_urls,
      status,
      location_id,
    } = req.body;

    if (!make || !model || !year || !license_plate || !daily_rate) {
      throw new AppError('make, model, year, license_plate, daily_rate are required', 400);
    }

    const result = await pool.query(
      `INSERT INTO vehicles (
        make, model, year, license_plate, fuel_type, transmission, daily_rate,
        category, seats, luggage_capacity, features, photo_urls, status, location_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *`,
      [
        make,
        model,
        year,
        license_plate,
        fuel_type || 'petrol',
        transmission || 'automatic',
        daily_rate,
        category || 'economy',
        seats || 5,
        luggage_capacity || 2,
        features || [],
        photo_urls || [],
        status || 'available',
        location_id || null,
      ]
    );
    res.status(201).json({ vehicle: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return next(new AppError('License plate already exists', 400));
    }
    next(err);
  }
}

export async function updateVehicle(req, res, next) {
  try {
    const allowed = [
      'make',
      'model',
      'year',
      'license_plate',
      'fuel_type',
      'transmission',
      'daily_rate',
      'category',
      'seats',
      'luggage_capacity',
      'features',
      'photo_urls',
      'status',
      'location_id',
      'current_odometer',
    ];
    const fields = [];
    const values = [];
    let i = 1;

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = $${i++}`);
        values.push(req.body[key]);
      }
    }

    if (fields.length === 0) throw new AppError('No fields to update', 400);

    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE vehicles SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    if (result.rows.length === 0) throw new AppError('Vehicle not found', 404);
    res.json({ vehicle: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function deleteVehicle(req, res, next) {
  try {
    const result = await pool.query(
      `UPDATE vehicles SET status = 'retired' WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('Vehicle not found', 404);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function listBookings(req, res, next) {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const params = [];
    const filters = ['1=1'];
    let i = 1;

    if (status) {
      filters.push(`b.status = $${i++}`);
      params.push(status);
    }
    if (search) {
      filters.push(`(u.full_name ILIKE $${i} OR u.email ILIKE $${i} OR v.make ILIKE $${i})`);
      params.push(`%${search}%`);
      i++;
    }

    const offset = (Math.max(1, page) - 1) * limit;
    const count = await pool.query(
      `SELECT COUNT(*)::int AS total FROM bookings b
       JOIN users u ON u.id = b.client_id
       JOIN vehicles v ON v.id = b.vehicle_id
       WHERE ${filters.join(' AND ')}`,
      params
    );

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT b.*, u.full_name AS client_name, u.email AS client_email,
              v.make AS vehicle_make, v.model AS vehicle_model, v.license_plate
       FROM bookings b
       JOIN users u ON u.id = b.client_id
       JOIN vehicles v ON v.id = b.vehicle_id
       WHERE ${filters.join(' AND ')}
       ORDER BY b.created_at DESC
       LIMIT $${i++} OFFSET $${i}`,
      params
    );

    const total = count.rows[0].total;
    res.json({ bookings: result.rows, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

export async function patchBooking(req, res, next) {
  try {
    const { status, pickup_odometer, return_odometer, damage_charge } = req.body;
    const fields = [];
    const values = [];
    let i = 1;

    if (status) {
      fields.push(`status = $${i++}`);
      values.push(status);
    }
    if (pickup_odometer !== undefined) {
      fields.push(`pickup_odometer = $${i++}`);
      values.push(pickup_odometer);
    }
    if (return_odometer !== undefined) {
      fields.push(`return_odometer = $${i++}`);
      values.push(return_odometer);
    }
    if (damage_charge !== undefined) {
      fields.push(`damage_charge = $${i++}`);
      values.push(damage_charge);
    }

    if (fields.length === 0) throw new AppError('No fields to update', 400);

    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE bookings SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    if (result.rows.length === 0) throw new AppError('Booking not found', 404);
    res.json({ booking: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function listClients(req, res, next) {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const params = ['client'];
    const filters = [`role = $1`];
    let i = 2;

    if (search) {
      filters.push(`(full_name ILIKE $${i} OR email ILIKE $${i})`);
      params.push(`%${search}%`);
      i++;
    }

    const offset = (Math.max(1, page) - 1) * limit;
    const count = await pool.query(
      `SELECT COUNT(*)::int AS total FROM users WHERE ${filters.join(' AND ')}`,
      params
    );

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.driver_license_number,
              u.created_at, u.is_active,
              (SELECT COUNT(*)::int FROM bookings b WHERE b.client_id = u.id) AS booking_count
       FROM users u WHERE ${filters.join(' AND ')}
       ORDER BY u.created_at DESC LIMIT $${i++} OFFSET $${i}`,
      params
    );

    const total = count.rows[0].total;
    res.json({ clients: result.rows, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

// CSV Export Functions

export async function exportBookingsCSV(req, res, next) {
  try {
    const { status, search, start_date, end_date } = req.query;
    const params = [];
    const filters = ['1=1'];
    let i = 1;

    if (status) {
      filters.push(`b.status = $${i++}`);
      params.push(status);
    }
    if (search) {
      filters.push(`(u.full_name ILIKE $${i} OR u.email ILIKE $${i} OR v.make ILIKE $${i})`);
      params.push(`%${search}%`);
      i++;
    }
    if (start_date) {
      filters.push(`b.start_date >= $${i++}`);
      params.push(start_date);
    }
    if (end_date) {
      filters.push(`b.end_date <= $${i++}`);
      params.push(end_date);
    }

    const result = await pool.query(
      `SELECT b.id, b.status, b.start_date, b.end_date, b.total_price,
              b.pickup_time, b.return_time, b.special_requests, b.created_at,
              u.full_name AS client_name, u.email AS client_email, u.phone AS client_phone,
              v.make AS vehicle_make, v.model AS vehicle_model, v.year AS vehicle_year,
              v.license_plate, v.category AS vehicle_category,
              COALESCE(l.name, 'Unknown') AS pickup_location
       FROM bookings b
       JOIN users u ON u.id = b.client_id
       JOIN vehicles v ON v.id = b.vehicle_id
       LEFT JOIN locations l ON l.id = b.pickup_location_id
       WHERE ${filters.join(' AND ')}
       ORDER BY b.created_at DESC`,
      params
    );

    const fields = [
      { label: 'Booking ID', value: 'id' },
      { label: 'Status', value: 'status' },
      { label: 'Client Name', value: 'client_name' },
      { label: 'Client Email', value: 'client_email' },
      { label: 'Client Phone', value: 'client_phone' },
      { label: 'Vehicle', value: (row) => `${row.vehicle_make} ${row.vehicle_model} (${row.vehicle_year})` },
      { label: 'License Plate', value: 'license_plate' },
      { label: 'Category', value: 'vehicle_category' },
      { label: 'Pickup Location', value: 'pickup_location' },
      { label: 'Start Date', value: 'start_date' },
      { label: 'End Date', value: 'end_date' },
      { label: 'Pickup Time', value: 'pickup_time' },
      { label: 'Return Time', value: 'return_time' },
      { label: 'Total Price', value: 'total_price' },
      { label: 'Special Requests', value: 'special_requests' },
      { label: 'Created At', value: 'created_at' },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(result.rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="bookings-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

export async function exportClientsCSV(req, res, next) {
  try {
    const { search } = req.query;
    const params = ['client'];
    const filters = [`role = $1`];
    let i = 2;

    if (search) {
      filters.push(`(full_name ILIKE $${i} OR email ILIKE $${i})`);
      params.push(`%${search}%`);
      i++;
    }

    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.driver_license_number,
              u.address, u.created_at, u.is_active,
              (SELECT COUNT(*) FROM bookings b WHERE b.client_id = u.id) AS total_bookings,
              (SELECT COALESCE(SUM(total_price), 0) FROM bookings b WHERE b.client_id = u.id) AS total_spent
       FROM users u WHERE ${filters.join(' AND ')}
       ORDER BY u.created_at DESC`,
      params
    );

    const fields = [
      { label: 'Client ID', value: 'id' },
      { label: 'Full Name', value: 'full_name' },
      { label: 'Email', value: 'email' },
      { label: 'Phone', value: 'phone' },
      { label: 'Driver License', value: 'driver_license_number' },
      { label: 'Address', value: 'address' },
      { label: 'Status', value: (row) => row.is_active ? 'Active' : 'Suspended' },
      { label: 'Total Bookings', value: 'total_bookings' },
      { label: 'Total Spent', value: 'total_spent' },
      { label: 'Joined Date', value: 'created_at' },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(result.rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="clients-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
}
