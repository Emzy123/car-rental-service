import crypto from 'crypto';
import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';

const PAYSTACK_BASE = 'https://api.paystack.co';

async function paystackRequest(path, options = {}) {
  if (!config.paystack.secretKey) {
    throw new AppError('Paystack is not configured', 503);
  }

  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.paystack.secretKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!data.status) {
    throw new AppError(data.message || 'Paystack request failed', 502);
  }
  return data;
}

export function verifyWebhookSignature(rawBody, signature) {
  if (!config.paystack.secretKey || !signature) return false;
  const hash = crypto
    .createHmac('sha512', config.paystack.secretKey)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
}

export async function initializeTransaction({
  email,
  amountKobo,
  reference,
  callbackUrl,
  metadata,
}) {
  if (config.paystack.devMode) {
    return {
      authorization_url: `${config.clientUrl}/dashboard/bookings/${metadata.booking_id}/payment-callback?reference=${reference}&dev=1`,
      access_code: 'dev_mode',
      reference,
    };
  }

  const data = await paystackRequest('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email,
      amount: amountKobo,
      reference,
      callback_url: callbackUrl,
      metadata,
    }),
  });

  return data.data;
}

export async function verifyTransaction(reference) {
  if (config.paystack.devMode) {
    return {
      status: 'success',
      reference,
      id: `dev_${reference}`,
      amount: 0,
      paid_at: new Date().toISOString(),
    };
  }

  const data = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);
  return data.data;
}

export async function createRefund({ transactionId, amountKobo, reason }) {
  if (config.paystack.devMode) {
    return { id: `dev_refund_${transactionId}`, status: 'processed' };
  }

  const body = { transaction: transactionId, reason: reason || 'Booking cancellation' };
  if (amountKobo) body.amount = amountKobo;

  const data = await paystackRequest('/refund', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return data.data;
}
