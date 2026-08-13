import express from 'express';
import {
  listNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, listNotifications);
router.get('/:id', requireAuth, getNotificationById);
router.patch('/:id/read', requireAuth, markAsRead);
router.patch('/mark-all-read', requireAuth, markAllAsRead);
router.delete('/:id', requireAuth, deleteNotification);

export default router;
