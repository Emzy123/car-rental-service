import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getBooking,
  cancelBooking,
  modifyBooking,
  previewPricing,
} from '../controllers/bookingController.js';
import { authenticate, loadActiveUser, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, loadActiveUser, requireRole('client'));

router.post('/preview', previewPricing);
router.post('/', createBooking);
router.get('/my-bookings', getMyBookings);
router.get('/:id', getBooking);
router.patch('/:id', modifyBooking);
router.post('/:id/cancel', cancelBooking);

export default router;
