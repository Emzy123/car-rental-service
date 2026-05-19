import { config } from '../config/index.js';

export function parseDateOnly(value) {
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function rentalDays(startDate, endDate) {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  const ms = end - start;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function validateBookingDates(startDate, endDate) {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (!start || !end) {
    throw new Error('Invalid start_date or end_date');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start < today) {
    throw new Error('Start date cannot be in the past');
  }
  if (end <= start) {
    throw new Error('End date must be after start date');
  }

  const days = rentalDays(startDate, endDate);
  if (days < 1) {
    throw new Error('Rental must be at least 1 day');
  }

  return { start, end, days };
}

export function calculateExtrasTotal(extras = {}, days) {
  const rates = config.pricing.extras;
  let total = 0;
  const lineItems = [];

  if (extras.gps) {
    const amount = rates.gpsPerDay * days;
    total += amount;
    lineItems.push({ label: 'GPS navigation', amount });
  }
  if (extras.child_seat) {
    const amount = rates.childSeatPerDay * days;
    total += amount;
    lineItems.push({ label: 'Child seat', amount });
  }
  if (extras.additional_driver) {
    const amount = rates.additionalDriverPerDay * days;
    total += amount;
    lineItems.push({ label: 'Additional driver', amount });
  }
  if (extras.roadside_assistance) {
    const amount = rates.roadsidePerDay * days;
    total += amount;
    lineItems.push({ label: 'Roadside assistance', amount });
  }
  if (extras.prepaid_fuel) {
    total += rates.prepaidFuelFlat;
    lineItems.push({ label: 'Pre-paid fuel', amount: rates.prepaidFuelFlat });
  }

  const tier = extras.insurance_tier || 'basic';
  if (tier === 'premium') {
    const amount = rates.insurancePremiumPerDay * days;
    total += amount;
    lineItems.push({ label: 'Premium insurance', amount });
  } else if (tier === 'elite') {
    const amount = rates.insuranceElitePerDay * days;
    total += amount;
    lineItems.push({ label: 'Elite insurance', amount });
  }

  return { extras_total: roundMoney(total), line_items: lineItems };
}

export function calculatePricing(dailyRate, days, extras = {}) {
  const rate = Number(dailyRate);
  const subtotal = rate * days;
  const { extras_total, line_items } = calculateExtrasTotal(extras, days);
  const subtotalWithExtras = subtotal + extras_total;
  const taxAmount = subtotalWithExtras * (config.pricing.taxRatePercent / 100);
  const total = subtotalWithExtras + taxAmount;
  const deposit = total * (config.pricing.depositPercent / 100);

  return {
    days,
    daily_rate: rate,
    subtotal: roundMoney(subtotal),
    extras_total,
    extras_line_items: line_items,
    tax_amount: roundMoney(taxAmount),
    tax_rate_percent: config.pricing.taxRatePercent,
    total_price: roundMoney(total),
    deposit_amount: roundMoney(deposit),
  };
}

export function roundMoney(n) {
  return Math.round(n * 100) / 100;
}

export function toKobo(amountNaira) {
  return Math.round(Number(amountNaira) * 100);
}

export function hoursUntilPickup(startDate) {
  const pickup = parseDateOnly(startDate);
  pickup.setHours(config.pricing.pickupHour, 0, 0, 0);
  return (pickup - new Date()) / (1000 * 60 * 60);
}

export function calculateRefundPercent(startDate) {
  const hours = hoursUntilPickup(startDate);
  const { fullRefund, halfRefund } = config.pricing.cancellationPolicyHours;

  if (hours >= fullRefund) return 1;
  if (hours >= halfRefund) return 0.5;
  return 0;
}

export function generateReference(prefix = 'pay') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function validateAge(dateOfBirth, minAge = 21) {
  if (!dateOfBirth) return { valid: true, age: null };
  const dob = parseDateOnly(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  if (age < minAge) {
    return { valid: false, message: `Driver must be at least ${minAge} years old` };
  }
  return { valid: true, age };
}
