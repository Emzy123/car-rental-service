import { Router } from 'express';
import { config } from '../config/index.js';

const router = Router();

router.get('/public', (_req, res) => {
  res.json({
    currency_code: config.currencyCode,
    pricing: {
      tax_rate_percent: config.pricing.taxRatePercent,
      deposit_percent: config.pricing.depositPercent,
      extras: config.pricing.extras,
    },
  });
});

export default router;
