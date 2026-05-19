import { Router } from 'express';
import { listLocations } from '../controllers/locationController.js';

const router = Router();

router.get('/', listLocations);

export default router;
