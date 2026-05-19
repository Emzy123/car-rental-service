import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
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

const app = express();

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

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
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

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  if (config.paystack.devMode) {
    console.log('Paystack DEV MODE enabled — payments auto-simulate without API keys');
  }
});
