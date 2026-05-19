import { Router } from 'express';
import {
  initializePayment,
  verifyPayment,
} from '../controllers/paymentController.js';
import { authenticate, loadActiveUser, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, loadActiveUser, requireRole('client'));

router.post('/initialize', initializePayment);
router.post('/verify', verifyPayment);

export default router;
