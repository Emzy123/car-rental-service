import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
} from '../controllers/authController.js';
import { authenticate, loadActiveUser } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, loadActiveUser, getMe);
router.patch('/me', authenticate, loadActiveUser, updateProfile);
router.put('/profile', authenticate, loadActiveUser, updateProfile);

export default router;
