import { Resend } from 'resend';
import { config } from '../config/index.js';

const resend = config.emailServiceApiKey ? new Resend(config.emailServiceApiKey) : null;

const FROM_EMAIL = 'bookings@driverent.com';
const FROM_NAME = 'DriveRent';

function formatCurrency(amount, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount);
}

function getEmailStyles() {
  return `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #1e3a5f; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
      .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
      .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
      .detail-row:last-child { border-bottom: none; }
      .label { color: #6b7280; font-weight: 500; }
      .value { color: #111827; font-weight: 600; }
      .total { font-size: 18px; color: #1e3a5f; }
      .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
      .button { display: inline-block; background: #d4af37; color: #1e3a5f; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
      .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
      .status-confirmed { background: #d1fae5; color: #065f46; }
    </style>
  `;
}

/** Sends booking confirmation email with Resend (logs in dev when no API key). */
export async function sendBookingConfirmation({ to, booking, vehicle, payment }) {
  const subject = `Booking confirmed #${booking.id} — DriveRent`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${getEmailStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Confirmed!</h1>
      <p>Your reservation is all set</p>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Thank you for choosing DriveRent. Your booking has been confirmed and we're excited to get you on the road!</p>
      
      <div class="booking-details">
        <div style="text-align: center; margin-bottom: 20px;">
          <span class="status-badge status-confirmed">Confirmed</span>
        </div>
        <div class="detail-row">
          <span class="label">Booking Reference</span>
          <span class="value">#${booking.id}</span>
        </div>
        <div class="detail-row">
          <span class="label">Vehicle</span>
          <span class="value">${vehicle.make} ${vehicle.model} (${vehicle.year})</span>
        </div>
        <div class="detail-row">
          <span class="label">Pickup Date</span>
          <span class="value">${booking.start_date}</span>
        </div>
        <div class="detail-row">
          <span class="label">Return Date</span>
          <span class="value">${booking.end_date}</span>
        </div>
        <div class="detail-row">
          <span class="label">Total Price</span>
          <span class="value total">${formatCurrency(booking.total_price)}</span>
        </div>
        <div class="detail-row">
          <span class="label">Deposit Paid</span>
          <span class="value" style="color: #059669;">${payment?.amount ? formatCurrency(payment.amount) : 'Pending'}</span>
        </div>
      </div>
      
      <p style="text-align: center;">
        <a href="${config.clientUrl}/dashboard/bookings" class="button">View My Bookings</a>
      </p>
      
      <div class="footer">
        <p>Need help? Contact our support team at support@driverent.com</p>
        <p>&copy; ${new Date().getFullYear()} DriveRent. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
BOOKING CONFIRMED #${booking.id}

Vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.year})
Dates: ${booking.start_date} to ${booking.end_date}
Total: ${formatCurrency(booking.total_price)}
Deposit: ${payment?.amount ? formatCurrency(payment.amount) : 'Pending'}

View your bookings: ${config.clientUrl}/dashboard/bookings

Thank you for choosing DriveRent!
  `.trim();

  if (!resend) {
    console.log('[email:dev]', { to, subject, text });
    return { sent: false, dev: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
      text,
    });

    if (error) {
      console.error('[email:error]', error);
      return { sent: false, error: error.message };
    }

    console.log('[email:sent]', { to, subject, id: data?.id });
    return { sent: true, id: data?.id };
  } catch (err) {
    console.error('[email:error]', err);
    return { sent: false, error: err.message };
  }
}

export async function sendCancellationEmail({ to, booking, refundAmount }) {
  const subject = `Booking #${booking.id} cancelled — DriveRent`;
  
  const hasRefund = refundAmount && refundAmount > 0;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #7c2d12; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .label { color: #6b7280; font-weight: 500; }
    .value { color: #111827; font-weight: 600; }
    .refund-box { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
    .refund-amount { font-size: 24px; font-weight: 700; color: #92400e; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Cancelled</h1>
      <p>Your reservation has been cancelled</p>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>We're sorry to see you go. Your booking has been cancelled as requested.</p>
      
      <div class="booking-details">
        <div style="text-align: center; margin-bottom: 20px;">
          <span class="status-badge status-cancelled">Cancelled</span>
        </div>
        <div class="detail-row">
          <span class="label">Booking Reference</span>
          <span class="value">#${booking.id}</span>
        </div>
        <div class="detail-row">
          <span class="label">Vehicle</span>
          <span class="value">${booking.vehicle?.make || ''} ${booking.vehicle?.model || 'Vehicle'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Original Dates</span>
          <span class="value">${booking.start_date} to ${booking.end_date}</span>
        </div>
      </div>
      
      ${hasRefund ? `
      <div class="refund-box">
        <p style="margin: 0 0 5px 0; color: #92400e; font-weight: 600;">Refund Amount</p>
        <p class="refund-amount">${formatCurrency(refundAmount)}</p>
        <p style="margin: 10px 0 0 0; color: #78350f; font-size: 14px;">Your refund will be processed within 5-7 business days</p>
      </div>
      ` : '<p style="text-align: center; color: #6b7280;">No refund applicable based on cancellation policy</p>'}
      
      <div class="footer">
        <p>Need help? Contact our support team at support@driverent.com</p>
        <p>&copy; ${new Date().getFullYear()} DriveRent. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
BOOKING CANCELLED #${booking.id}

Vehicle: ${booking.vehicle?.make || ''} ${booking.vehicle?.model || 'Vehicle'}
Original Dates: ${booking.start_date} to ${booking.end_date}

${hasRefund ? `Refund Amount: ${formatCurrency(refundAmount)}\nYour refund will be processed within 5-7 business days.` : 'No refund applicable based on cancellation policy.'}

Contact support@driverent.com if you have any questions.
  `.trim();

  if (!resend) {
    console.log('[email:dev]', { to, subject, text });
    return { sent: false, dev: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
      text,
    });

    if (error) {
      console.error('[email:error]', error);
      return { sent: false, error: error.message };
    }

    console.log('[email:sent]', { to, subject, id: data?.id });
    return { sent: true, id: data?.id };
  } catch (err) {
    console.error('[email:error]', err);
    return { sent: false, error: err.message };
  }
}
