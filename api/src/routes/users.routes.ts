import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getCurrentUser, updateCurrentUser } from '../controllers/users.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @route   GET /users/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', getCurrentUser);

/**
 * @route   PATCH /users/me
 * @desc    Update current user
 * @access  Private
 */
router.patch('/me', updateCurrentUser);

export default router;
