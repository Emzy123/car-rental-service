import { Router } from 'express';
import { authenticate, loadActiveUser, requireRole } from '../middleware/auth.js';
import {
  dashboardStats,
  dashboardCharts,
  activityFeed,
  listVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  listBookings,
  patchBooking,
  listClients,
} from '../controllers/adminController.js';

const router = Router();

router.use(authenticate, loadActiveUser, requireRole('admin'));

router.get('/dashboard/stats', dashboardStats);
router.get('/dashboard/charts', dashboardCharts);
router.get('/activity', activityFeed);

router.get('/vehicles', listVehicles);
router.post('/vehicles', createVehicle);
router.put('/vehicles/:id', updateVehicle);
router.delete('/vehicles/:id', deleteVehicle);

router.get('/bookings', listBookings);
router.patch('/bookings/:id', patchBooking);

router.get('/clients', listClients);

export default router;
