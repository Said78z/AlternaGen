import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.middleware';
import { getVision, createVision, updateVision, deleteVision } from '../controllers/vision.controller';

const router = Router();

const visionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});

// All routes require rate limiting and authentication
router.use(visionLimiter);
router.use(requireAuth);

/**
 * @route   GET /vision
 * @desc    Get current user's vision
 * @access  Private
 */
router.get('/', getVision);

/**
 * @route   POST /vision
 * @desc    Create user vision
 * @access  Private
 */
router.post('/', createVision);

/**
 * @route   PUT /vision
 * @desc    Update user vision
 * @access  Private
 */
router.put('/', updateVision);

/**
 * @route   DELETE /vision
 * @desc    Delete user vision
 * @access  Private
 */
router.delete('/', deleteVision);

export default router;
