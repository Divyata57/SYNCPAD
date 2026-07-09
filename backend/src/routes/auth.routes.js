import express from 'express';
import {
  register, login, logout, refreshToken, verifyEmail,
  forgotPassword, resetPassword, getSessions, revokeSession
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.get('/verify', verifyEmail);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Sessions
router.get('/sessions', protect, getSessions);
router.delete('/sessions/:id', protect, revokeSession);

export default router;
