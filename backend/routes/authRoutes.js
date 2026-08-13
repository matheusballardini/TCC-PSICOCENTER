import express from 'express';
import { register, login, logout, forgotPassword, refreshToken, me, deleteAccount } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', requireAuth, logout);
router.post('/forgot-password', forgotPassword);
router.post('/refresh-token', refreshToken);
router.get('/me', requireAuth, me);
router.delete('/me', requireAuth, deleteAccount);

export default router;
