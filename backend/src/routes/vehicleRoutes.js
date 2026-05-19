import { Router } from 'express';
import { listVehicles, getVehicle } from '../controllers/vehicleController.js';

const router = Router();

router.get('/', listVehicles);
router.get('/:id', getVehicle);

export default router;
