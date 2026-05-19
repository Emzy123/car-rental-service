import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { config } from './config/index.js';

// Sentry setup (optional)
let Sentry;
if (config.sentry.enabled) {
  Sentry = await import('@sentry/node');
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.nodeEnv,
    release: process.env.npm_package_version || '1.0.0',
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
    profilesSampleRate: 0.1,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
    ],
  });
  console.log('[sentry] Error tracking enabled');
}
import authRoutes from './routes/authRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import savedVehicleRoutes from './routes/savedVehicleRoutes.js';
import configRoutes from './routes/configRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { paystackWebhook } from './controllers/paymentController.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/errors.js';
import { checkDatabaseHealth, closeDatabase } from './db/pool.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: true, message: 'Too many authentication attempts, please try again later' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Request logging
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  paystackWebhook
);

// Ensure uploads directory exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = join(__dirname, '..', '..', 'uploads', 'avatars');
fs.mkdirSync(uploadsDir, { recursive: true });

// Serve static files from uploads directory
app.use('/uploads', express.static(join(__dirname, '..', '..', 'uploads')));

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Detailed health check with database connectivity
app.get('/api/health/detailed', async (_req, res) => {
  const dbHealth = await checkDatabaseHealth();
  
  const status = dbHealth.healthy ? 200 : 503;
  const statusText = dbHealth.healthy ? 'healthy' : 'unhealthy';
  
  res.status(status).json({
    status: statusText,
    timestamp: new Date().toISOString(),
    services: {
      api: { status: 'ok' },
      database: dbHealth,
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/saved-vehicles', savedVehicleRoutes);
app.use('/api/config', configRoutes);
app.use('/api/admin', adminRoutes);

app.use((_req, _res, next) => {
  next(new AppError('Not found', 404));
});

app.use(errorHandler);

// Sentry error handler (must be after all other error handlers)
if (config.sentry.enabled && Sentry) {
  app.use(Sentry.Handlers.errorHandler());
}

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('[server] SIGTERM received, shutting down gracefully');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[server] SIGINT received, shutting down gracefully');
  await closeDatabase();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled rejection:', reason);
});

app.listen(config.port, () => {
  console.log(`[server] Running on port ${config.port} in ${config.nodeEnv} mode`);
  if (config.paystack.devMode) {
    console.log('[paystack] DEV MODE enabled — payments auto-simulate without API keys');
  }
  console.log(`[security] Rate limiting: 100 req/15min (10 for auth)`);
});
