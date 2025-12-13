import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getProfile, createProfile, updateProfile } from '../controllers/profiles.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @route   GET /profiles/me
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/me', getProfile);

/**
 * @route   POST /profiles/me
 * @desc    Create user profile
 * @access  Private
 */
router.post('/me', createProfile);

/**
 * @route   PATCH /profiles/me
 * @desc    Update user profile
 * @access  Private
 */
router.patch('/me', updateProfile);

export default router;
