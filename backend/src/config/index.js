import dotenv from 'dotenv';

dotenv.config();

const required = ['DATABASE_URL', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`Warning: ${key} is not set in environment`);
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: '7d',
  bcryptRounds: 10,
  emailServiceApiKey: process.env.EMAIL_SERVICE_API_KEY,
  currencyCode: process.env.CURRENCY_CODE || 'NGN',
  pricing: {
    taxRatePercent: parseFloat(process.env.TAX_RATE_PERCENT || '18'),
    depositPercent: parseFloat(process.env.DEPOSIT_PERCENT || '20'),
    pickupHour: parseInt(process.env.PICKUP_HOUR || '9', 10),
    cancellationPolicyHours: {
      fullRefund: parseInt(process.env.CANCEL_FULL_REFUND_HOURS || '48', 10),
      halfRefund: parseInt(process.env.CANCEL_HALF_REFUND_HOURS || '24', 10),
    },
    extras: {
      gpsPerDay: parseFloat(process.env.EXTRA_GPS_DAY || '5'),
      childSeatPerDay: parseFloat(process.env.EXTRA_CHILD_SEAT_DAY || '7'),
      additionalDriverPerDay: parseFloat(process.env.EXTRA_DRIVER_DAY || '10'),
      insurancePremiumPerDay: parseFloat(process.env.EXTRA_INSURANCE_PREMIUM || '15'),
      insuranceElitePerDay: parseFloat(process.env.EXTRA_INSURANCE_ELITE || '30'),
      roadsidePerDay: parseFloat(process.env.EXTRA_ROADSIDE_DAY || '5'),
      prepaidFuelFlat: parseFloat(process.env.EXTRA_PREPAID_FUEL || '40'),
    },
  },
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY,
    publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    devMode:
      process.env.PAYSTACK_DEV_MODE === 'true' ||
      (!process.env.PAYSTACK_SECRET_KEY && process.env.NODE_ENV !== 'production'),
  },
  redis: {
    url: process.env.REDIS_URL,
    enabled: !!process.env.REDIS_URL,
    ttl: {
      vehicles: 300, // 5 minutes
      dashboard: 60, // 1 minute
      bookings: 30,  // 30 seconds
      static: 3600,  // 1 hour
    },
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
    enabled: !!process.env.SENTRY_DSN && process.env.NODE_ENV === 'production',
  },
};
