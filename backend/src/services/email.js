import { config } from '../config/index.js';

/** Sends booking confirmation email (logs in dev when no API key). */
export async function sendBookingConfirmation({ to, booking, vehicle, payment }) {
  const subject = `Booking confirmed #${booking.id} — DriveRent`;
  const body = `
Hello,

Your booking has been confirmed.

Booking #${booking.id}
Vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.year})
Dates: ${booking.start_date} to ${booking.end_date}
Total: ${booking.total_price}
Deposit paid: ${payment?.amount ?? 'N/A'}

Thank you for choosing DriveRent.
`.trim();

  if (!config.emailServiceApiKey) {
    console.log('[email:dev]', { to, subject, body });
    return { sent: false, dev: true };
  }

  // Integrate your email provider here (Resend, SendGrid, etc.)
  console.log('[email]', { to, subject });
  return { sent: true };
}

export async function sendCancellationEmail({ to, booking, refundAmount }) {
  const subject = `Booking #${booking.id} cancelled`;
  const body = `Your booking was cancelled. Refund amount: ${refundAmount}`;

  if (!config.emailServiceApiKey) {
    console.log('[email:dev]', { to, subject, body });
    return { sent: false, dev: true };
  }

  return { sent: true };
}
