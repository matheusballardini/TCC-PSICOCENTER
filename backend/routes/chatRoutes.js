import express from 'express';
import {
  createConversation,
  listConversations,
  listMessages,
  sendMessage,
  deleteMessage,
  addAttachment,
  getAttachments,
} from '../controllers/chatController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/conversations', requireAuth, createConversation);
router.get('/conversations', requireAuth, listConversations);
router.get('/conversations/:conversationId/messages', requireAuth, listMessages);
router.post('/conversations/:conversationId/messages', requireAuth, sendMessage);
router.delete('/conversations/:conversationId/messages/:messageId', requireAuth, deleteMessage);

router.post('/messages/:messageId/attachments', requireAuth, addAttachment);
router.get('/messages/:messageId/attachments', requireAuth, getAttachments);

export default router;
