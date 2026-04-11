import express from 'express';
import {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
  getAdminStats,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser
} from '../controllers/authController.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getCurrentUser);
router.put('/profile', auth, updateProfile);
router.put('/password', auth, changePassword);

router.get('/admin/stats', auth, isAdmin, getAdminStats);
router.get('/admin/users', auth, isAdmin, getAdminUsers);
router.post('/admin/users', auth, isAdmin, createAdminUser);
router.put('/admin/users/:id', auth, isAdmin, updateAdminUser);
router.delete('/admin/users/:id', auth, isAdmin, deleteAdminUser);

export default router;