import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.post('/login', authLimiter, authController.login);
router.post('/register', authLimiter, optionalAuth, authController.register);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);

export default router; 