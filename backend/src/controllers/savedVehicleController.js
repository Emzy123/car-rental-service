import { pool } from '../db/pool.js';
import { AppError } from '../utils/errors.js';

export async function listSaved(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT v.* FROM saved_vehicles sv
       JOIN vehicles v ON v.id = sv.vehicle_id
       WHERE sv.user_id = $1
       ORDER BY sv.created_at DESC`,
      [req.user.id]
    );
    res.json({ vehicles: result.rows });
  } catch (err) {
    next(err);
  }
}

export async function saveVehicle(req, res, next) {
  try {
    const { vehicle_id } = req.body;
    if (!vehicle_id) throw new AppError('vehicle_id is required', 400);

    const v = await pool.query('SELECT id FROM vehicles WHERE id = $1', [vehicle_id]);
    if (v.rows.length === 0) throw new AppError('Vehicle not found', 404);

    await pool.query(
      `INSERT INTO saved_vehicles (user_id, vehicle_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [req.user.id, vehicle_id]
    );
    res.status(201).json({ saved: true, vehicle_id });
  } catch (err) {
    next(err);
  }
}

export async function unsaveVehicle(req, res, next) {
  try {
    await pool.query(
      'DELETE FROM saved_vehicles WHERE user_id = $1 AND vehicle_id = $2',
      [req.user.id, req.params.vehicleId]
    );
    res.json({ saved: false });
  } catch (err) {
    next(err);
  }
}
