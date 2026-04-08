import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
    getCredits,
    generateCVController,
    generateCoverLetterController,
    generateLinkedInPostController,
    getGenerationHistory,
} from '../controllers/ai.controller';
import { syncUserMiddleware } from '../middleware/user.middleware';

const router = Router();

// All routes require authentication
router.use(requireAuth);
router.use(syncUserMiddleware);

// Credits
router.get('/credits', getCredits);

// Generation
router.post('/generate-cv', generateCVController);
router.post('/generate-cover-letter', generateCoverLetterController);
router.post('/generate-linkedin-post', generateLinkedInPostController);

// History
router.get('/history', getGenerationHistory);

export default router;
