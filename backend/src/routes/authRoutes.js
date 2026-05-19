import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  uploadAvatar,
} from '../controllers/authController.js';
import { authenticate, loadActiveUser } from '../middleware/auth.js';
import { uploadAvatar as avatarUpload, handleUploadError } from '../middleware/upload.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, loadActiveUser, getMe);
router.patch('/me', authenticate, loadActiveUser, updateProfile);
router.put('/profile', authenticate, loadActiveUser, updateProfile);
router.post('/avatar', authenticate, loadActiveUser, avatarUpload, handleUploadError, uploadAvatar);

export default router;
