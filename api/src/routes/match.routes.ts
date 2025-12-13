import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { calculateMatch, getRecommendations } from '../controllers/match.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @route   POST /match/calculate
 * @desc    Calculate match score for a job
 * @access  Private
 */
router.post('/calculate', calculateMatch);

/**
 * @route   GET /match/recommendations
 * @desc    Get top recommended jobs
 * @access  Private
 */
router.get('/recommendations', getRecommendations);

export default router;
