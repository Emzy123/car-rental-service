import { pool } from '../db/pool.js';
import { AppError } from '../utils/errors.js';
import {
  validateBookingDates,
  calculatePricing,
  calculateRefundPercent,
  roundMoney,
  toKobo,
  validateAge,
} from '../utils/booking.js';
import { isVehicleAvailable } from '../services/availability.js';
import { createRefund } from '../services/paystack.js';
import { sendCancellationEmail } from '../services/email.js';
import { config } from '../config/index.js';

const BOOKING_SELECT = `
  SELECT b.*,
    json_build_object(
      'id', v.id, 'make', v.make, 'model', v.model, 'year', v.year,
      'license_plate', v.license_plate, 'fuel_type', v.fuel_type,
      'transmission', v.transmission, 'daily_rate', v.daily_rate,
      'photo_urls', v.photo_urls, 'category', v.category, 'seats', v.seats
    ) AS vehicle
  FROM bookings b
  JOIN vehicles v ON v.id = b.vehicle_id
`;

function formatBooking(row, pricing = null) {
  const { vehicle, ...booking } = row;
  return {
    ...booking,
    total_price: Number(booking.total_price),
    extras_total: Number(booking.extras_total || 0),
    damage_charge: Number(booking.damage_charge),
    extras: booking.extras || {},
    vehicle,
    pricing,
  };
}

async function getBookingForClient(bookingId, clientId) {
  const result = await pool.query(
    `${BOOKING_SELECT} WHERE b.id = $1 AND b.client_id = $2`,
    [bookingId, clientId]
  );
  if (result.rows.length === 0) throw new AppError('Booking not found', 404);
  return result.rows[0];
}

export async function previewPricing(req, res, next) {
  try {
    const { vehicle_id, start_date, end_date, extras } = req.body;
    if (!vehicle_id || !start_date || !end_date) {
      throw new AppError('vehicle_id, start_date, and end_date are required', 400);
    }
    const { days } = validateBookingDates(start_date, end_date);
    const v = await pool.query('SELECT daily_rate FROM vehicles WHERE id = $1', [vehicle_id]);
    if (v.rows.length === 0) throw new AppError('Vehicle not found', 404);
    const pricing = calculatePricing(v.rows[0].daily_rate, days, extras || {});
    res.json({ pricing });
  } catch (err) {
    if (err.message?.match(/date|Rental|past/i)) {
      return next(new AppError(err.message, 400));
    }
    next(err);
  }
}

export async function createBooking(req, res, next) {
  const client = await pool.connect();
  try {
    const {
      vehicle_id,
      start_date,
      end_date,
      pickup_location_id,
      return_location_id,
      pickup_time,
      return_time,
      special_requests,
      flight_number,
      extras,
    } = req.body;

    if (!vehicle_id || !start_date || !end_date) {
      throw new AppError('vehicle_id, start_date, and end_date are required');
    }

    const { days } = validateBookingDates(start_date, end_date);

    const userRow = await pool.query(
      'SELECT date_of_birth, driver_license_number FROM users WHERE id = $1',
      [req.user.id]
    );
    const ageCheck = validateAge(userRow.rows[0]?.date_of_birth);
    if (!ageCheck.valid) {
      throw new AppError(ageCheck.message, 400);
    }

    await client.query('BEGIN');

    const { available, reason, vehicle } = await isVehicleAvailable(
      client,
      vehicle_id,
      start_date,
      end_date
    );

    if (!available) {
      throw new AppError(reason, 400);
    }

    const pricing = calculatePricing(vehicle.daily_rate, days, extras || {});

    const insert = await client.query(
      `INSERT INTO bookings (
        client_id, vehicle_id, start_date, end_date, total_price, status,
        pickup_location_id, return_location_id, pickup_time, return_time,
        special_requests, flight_number, extras, extras_total
      )
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        req.user.id,
        vehicle_id,
        start_date,
        end_date,
        pricing.total_price,
        pickup_location_id || null,
        return_location_id || null,
        pickup_time || '10:00',
        return_time || '10:00',
        special_requests || null,
        flight_number || null,
        JSON.stringify(extras || {}),
        pricing.extras_total,
      ]
    );

    await client.query('COMMIT');

    const row = await pool.query(`${BOOKING_SELECT} WHERE b.id = $1`, [insert.rows[0].id]);

    res.status(201).json({
      booking: formatBooking(row.rows[0], pricing),
      booking_id: insert.rows[0].id,
      total_amount: pricing.total_price,
      deposit_amount: pricing.deposit_amount,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err instanceof AppError) return next(err);
    if (err.message?.match(/date|Rental|past/i)) {
      return next(new AppError(err.message, 400));
    }
    next(err);
  } finally {
    client.release();
  }
}

export async function getMyBookings(req, res, next) {
  try {
    const { status } = req.query;
    const params = [req.user.id];
    let sql = `${BOOKING_SELECT} WHERE b.client_id = $1`;

    if (status) {
      params.push(status);
      sql += ` AND b.status = $${params.length}`;
    }

    sql += ' ORDER BY b.start_date DESC';

    const result = await pool.query(sql, params);
    const bookings = result.rows.map((r) => formatBooking(r));

    const now = new Date();
    const upcoming = bookings.filter(
      (b) => ['pending', 'confirmed', 'active'].includes(b.status) && new Date(b.end_date) >= now
    );
    const past = bookings.filter((b) => !upcoming.some((u) => u.id === b.id));

    res.json({ bookings, upcoming, past });
  } catch (err) {
    next(err);
  }
}

export async function getBooking(req, res, next) {
  try {
    const row = await getBookingForClient(req.params.id, req.user.id);

    const payments = await pool.query(
      `SELECT id, amount, type, status, paystack_reference, created_at
       FROM payments WHERE booking_id = $1 ORDER BY created_at`,
      [req.params.id]
    );

    const refundPercent = calculateRefundPercent(row.start_date);
    const depositPayment = payments.rows.find(
      (p) => p.type === 'deposit' && p.status === 'completed'
    );
    const depositAmount = depositPayment ? Number(depositPayment.amount) : 0;

    const bookingFormatted = formatBooking(row);
    const depositPercent = config.pricing.depositPercent / 100;

    res.json({
      booking: {
        ...bookingFormatted,
        deposit_amount: roundMoney(bookingFormatted.total_price * depositPercent),
      },
      payments: payments.rows.map((p) => ({ ...p, amount: Number(p.amount) })),
      cancellation: {
        refund_percent: refundPercent,
        estimated_refund: roundMoney(depositAmount * refundPercent),
        deposit_paid: depositAmount,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelBooking(req, res, next) {
  const dbClient = await pool.connect();
  try {
    const bookingId = req.params.id;
    const row = await getBookingForClient(bookingId, req.user.id);

    if (['cancelled', 'completed'].includes(row.status)) {
      throw new AppError(`Cannot cancel a ${row.status} booking`, 400);
    }

    const refundPercent = calculateRefundPercent(row.start_date);

    const depositResult = await dbClient.query(
      `SELECT * FROM payments
       WHERE booking_id = $1 AND type = 'deposit' AND status = 'completed'
       ORDER BY id DESC LIMIT 1`,
      [bookingId]
    );

    const deposit = depositResult.rows[0];
    let refundAmount = 0;
    let refundRecord = null;

    await dbClient.query('BEGIN');

    if (deposit && refundPercent > 0) {
      refundAmount = roundMoney(Number(deposit.amount) * refundPercent);
      const refundKobo = toKobo(refundAmount);

      if (refundKobo > 0 && deposit.paystack_transaction_id) {
        const refundData = await createRefund({
          transactionId: deposit.paystack_transaction_id,
          amountKobo: refundKobo,
          reason: 'Booking cancellation',
        });

        const refResult = await dbClient.query(
          `INSERT INTO payments (booking_id, amount, type, paystack_reference, paystack_transaction_id, status)
           VALUES ($1, $2, 'refund', $3, $4, 'completed')
           RETURNING *`,
          [bookingId, refundAmount, refundData.id || `refund_${bookingId}`, refundData.id]
        );
        refundRecord = refResult.rows[0];
      } else if (config.paystack.devMode && deposit) {
        const refResult = await dbClient.query(
          `INSERT INTO payments (booking_id, amount, type, paystack_reference, status)
           VALUES ($1, $2, 'refund', $3, 'completed')
           RETURNING *`,
          [bookingId, refundAmount, `dev_refund_${bookingId}`]
        );
        refundRecord = refResult.rows[0];
      }
    }

    await dbClient.query(`UPDATE bookings SET status = 'cancelled' WHERE id = $1`, [bookingId]);

    await dbClient.query('COMMIT');

    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
    await sendCancellationEmail({
      to: userResult.rows[0].email,
      booking: row,
      refundAmount,
    });

    res.json({
      booking_id: bookingId,
      status: 'cancelled',
      refund_amount: refundAmount,
      refund_percent: refundPercent,
      refund: refundRecord,
    });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    next(err);
  } finally {
    dbClient.release();
  }
}
