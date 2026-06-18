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
  getBookingDetail,
  listClients,
  exportBookingsCSV,
  exportClientsCSV,
  getClientDetail,
  toggleClientStatus,
  listAdminLocations,
  createLocation,
  updateLocation,
  toggleLocation,
  getReports,
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

router.get('/bookings/export', exportBookingsCSV);
router.get('/bookings/:id', getBookingDetail);
router.get('/bookings', listBookings);
router.patch('/bookings/:id', patchBooking);

router.get('/clients/export', exportClientsCSV);
router.get('/clients/:id', getClientDetail);
router.get('/clients', listClients);
router.patch('/clients/:id/status', toggleClientStatus);

router.get('/locations', listAdminLocations);
router.post('/locations', createLocation);
router.put('/locations/:id', updateLocation);
router.patch('/locations/:id/toggle', toggleLocation);

router.get('/reports', getReports);

export default router;
