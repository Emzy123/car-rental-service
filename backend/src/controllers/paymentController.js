import { pool } from '../db/pool.js';
import { AppError } from '../utils/errors.js';
import { config } from '../config/index.js';
import {
  calculatePricing,
  generateReference,
  rentalDays,
  toKobo,
} from '../utils/booking.js';
import {
  initializeTransaction,
  verifyTransaction,
  verifyWebhookSignature,
} from '../services/paystack.js';
import { sendBookingConfirmation } from '../services/email.js';

async function completePayment(bookingId, paymentId, paystackData) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const payResult = await client.query(
      `UPDATE payments SET
         status = 'completed',
         paystack_transaction_id = COALESCE($1, paystack_transaction_id)
       WHERE id = $2 AND status = 'pending'
       RETURNING *`,
      [paystackData?.id || paystackData?.reference || null, paymentId]
    );

    if (payResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { alreadyProcessed: true };
    }

    await client.query(
      `UPDATE bookings SET status = 'confirmed' WHERE id = $1 AND status = 'pending'`,
      [bookingId]
    );

    const bookingResult = await client.query(
      `SELECT b.*, u.email, u.full_name,
        v.make, v.model, v.year
       FROM bookings b
       JOIN users u ON u.id = b.client_id
       JOIN vehicles v ON v.id = b.vehicle_id
       WHERE b.id = $1`,
      [bookingId]
    );

    await client.query('COMMIT');

    const booking = bookingResult.rows[0];
    const payment = payResult.rows[0];

    if (booking) {
      await sendBookingConfirmation({
        to: booking.email,
        booking,
        vehicle: booking,
        payment,
      });
    }

    return { booking, payment };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function initializePayment(req, res, next) {
  try {
    const { booking_id } = req.body;
    if (!booking_id) throw new AppError('booking_id is required');

    const bookingResult = await pool.query(
      `SELECT b.*, u.email FROM bookings b
       JOIN users u ON u.id = b.client_id
       WHERE b.id = $1 AND b.client_id = $2`,
      [booking_id, req.user.id]
    );

    if (bookingResult.rows.length === 0) {
      throw new AppError('Booking not found', 404);
    }

    const booking = bookingResult.rows[0];
    if (booking.status !== 'pending') {
      throw new AppError('Booking is not awaiting payment', 400);
    }

    const existing = await pool.query(
      `SELECT * FROM payments WHERE booking_id = $1 AND type = 'deposit' AND status = 'completed'`,
      [booking_id]
    );
    if (existing.rows.length > 0) {
      throw new AppError('Deposit already paid for this booking', 400);
    }

    const days = rentalDays(booking.start_date, booking.end_date);
    const vehicleResult = await pool.query(
      'SELECT daily_rate FROM vehicles WHERE id = $1',
      [booking.vehicle_id]
    );
    const pricing = calculatePricing(vehicleResult.rows[0].daily_rate, days);
    const depositAmount = pricing.deposit_amount;
    const reference = generateReference('bk');

    const pendingPayment = await pool.query(
      `INSERT INTO payments (booking_id, amount, type, paystack_reference, status)
       VALUES ($1, $2, 'deposit', $3, 'pending')
       RETURNING *`,
      [booking_id, depositAmount, reference]
    );

    const callbackUrl = `${config.clientUrl}/dashboard/bookings/${booking_id}/payment-callback`;

    const paystack = await initializeTransaction({
      email: booking.email,
      amountKobo: toKobo(depositAmount),
      reference,
      callbackUrl,
      metadata: {
        booking_id,
        payment_id: pendingPayment.rows[0].id,
        custom_fields: [
          { display_name: 'Booking ID', variable_name: 'booking_id', value: String(booking_id) },
        ],
      },
    });

    res.json({
      authorization_url: paystack.authorization_url,
      access_code: paystack.access_code,
      reference,
      public_key: config.paystack.publicKey,
      amount: depositAmount,
      payment_id: pendingPayment.rows[0].id,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyPayment(req, res, next) {
  try {
    const { reference } = req.body;
    if (!reference) throw new AppError('reference is required');

    const paymentResult = await pool.query(
      `SELECT p.*, b.client_id, b.status AS booking_status
       FROM payments p
       JOIN bookings b ON b.id = p.booking_id
       WHERE p.paystack_reference = $1`,
      [reference]
    );

    if (paymentResult.rows.length === 0) {
      throw new AppError('Payment not found', 404);
    }

    const payment = paymentResult.rows[0];
    if (payment.client_id !== req.user.id) {
      throw new AppError('Access denied', 403);
    }

    if (payment.status === 'completed') {
      return res.json({
        status: 'success',
        booking_id: payment.booking_id,
        already_verified: true,
      });
    }

    const verified = await verifyTransaction(reference);
    if (verified.status !== 'success') {
      throw new AppError('Payment was not successful', 400);
    }

    await completePayment(payment.booking_id, payment.id, verified);

    res.json({
      status: 'success',
      booking_id: payment.booking_id,
      reference,
    });
  } catch (err) {
    next(err);
  }
}

export async function paystackWebhook(req, res, next) {
  try {
    const signature = req.headers['x-paystack-signature'];
    const rawBody =
      typeof req.body === 'string' ? req.body : Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';

    if (!config.paystack.devMode && !verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).json({ error: true, message: 'Invalid signature' });
    }

    const event = JSON.parse(rawBody);

    if (event.event !== 'charge.success') {
      return res.json({ received: true });
    }

    const reference = event.data?.reference;
    if (!reference) {
      return res.json({ received: true });
    }

    const paymentResult = await pool.query(
      'SELECT * FROM payments WHERE paystack_reference = $1',
      [reference]
    );

    if (paymentResult.rows.length === 0) {
      return res.json({ received: true });
    }

    const payment = paymentResult.rows[0];
    if (payment.status === 'completed') {
      return res.json({ received: true });
    }

    await completePayment(payment.booking_id, payment.id, event.data);

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}
