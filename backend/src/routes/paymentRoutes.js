import { Router } from 'express';
import {
  initializePayment,
  verifyPayment,
  verifyPaymentCallback,
} from '../controllers/paymentController.js';
import { authenticate, loadActiveUser, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/verify-callback', verifyPaymentCallback);

router.use(authenticate, loadActiveUser, requireRole('client'));

router.post('/initialize', initializePayment);
router.post('/verify', verifyPayment);

export default router;
