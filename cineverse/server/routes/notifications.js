import express from 'express';
import { auth, isAdmin } from '../middleware/auth.js';
import {
  broadcast,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  sendNotification
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', auth, getNotifications);
router.get('/unread-count', auth, getUnreadCount);
router.put('/:id/read', auth, markAsRead);
router.put('/mark-all-read', auth, markAllAsRead);
router.post('/send', auth, isAdmin, sendNotification);
router.post('/broadcast', auth, isAdmin, broadcast);

export default router;
