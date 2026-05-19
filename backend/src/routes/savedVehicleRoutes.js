import { Router } from 'express';
import { authenticate, loadActiveUser, requireRole } from '../middleware/auth.js';
import {
  listSaved,
  saveVehicle,
  unsaveVehicle,
} from '../controllers/savedVehicleController.js';

const router = Router();

router.use(authenticate, loadActiveUser, requireRole('client'));

router.get('/', listSaved);
router.post('/', saveVehicle);
router.delete('/:vehicleId', unsaveVehicle);

export default router;
