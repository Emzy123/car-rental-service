import { pool } from '../db/pool.js';
import { AppError } from '../utils/errors.js';
import { getAvailableVehicles } from '../services/availability.js';
import { validateBookingDates } from '../utils/booking.js';

export async function listVehicles(req, res, next) {
  try {
    const {
      start_date,
      end_date,
      fuel_type,
      transmission,
      category,
      min_price,
      max_price,
      seats,
      features,
      sort,
      page,
      limit,
    } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        error: true,
        message: 'start_date and end_date query parameters are required',
      });
    }

    validateBookingDates(start_date, end_date);

    const result = await getAvailableVehicles({
      startDate: start_date,
      endDate: end_date,
      fuelType: fuel_type,
      transmission,
      category,
      minPrice: min_price,
      maxPrice: max_price,
      seats,
      features,
      sort: sort || 'recommended',
      page: parseInt(page || '1', 10),
      limit: Math.min(parseInt(limit || '12', 10), 50),
    });

    res.json(result);
  } catch (err) {
    if (err.message?.includes('date')) {
      return res.status(400).json({ error: true, message: err.message });
    }
    next(err);
  }
}

export async function getVehicle(req, res, next) {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    const result = await pool.query(`SELECT * FROM vehicles WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      throw new AppError('Vehicle not found', 404);
    }

    const vehicle = result.rows[0];
    if (['maintenance', 'retired'].includes(vehicle.status)) {
      throw new AppError('Vehicle is not available for booking', 400);
    }

    let available = true;
    let similar_vehicles = [];

    if (start_date && end_date) {
      validateBookingDates(start_date, end_date);
      const availableList = await getAvailableVehicles({
        startDate: start_date,
        endDate: end_date,
        limit: 100,
      });
      available = availableList.vehicles.some((v) => v.id === vehicle.id);

      similar_vehicles = availableList.vehicles
        .filter((v) => v.id !== vehicle.id && v.category === vehicle.category)
        .slice(0, 5);
    }

    res.json({ vehicle, available_for_dates: available, similar_vehicles });
  } catch (err) {
    next(err);
  }
}
