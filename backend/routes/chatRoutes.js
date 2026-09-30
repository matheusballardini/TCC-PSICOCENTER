import express from 'express';
import { listThreads, getThread, postMessage, getUnreadCount, deleteMessage } from '../controllers/chatController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/unread-count', requireAuth, getUnreadCount);
router.get('/threads', requireAuth, listThreads);
router.get('/threads/:otherUserId', requireAuth, getThread);
router.post('/threads/:otherUserId', requireAuth, postMessage);
router.delete('/threads/:otherUserId/messages/:messageId', requireAuth, deleteMessage);

export default router;
