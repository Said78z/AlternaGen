import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requirePro } from '../middleware/user.middleware';
import { getDailyBrief, getRecommendedOffers, runAgentTask } from '../controllers/agent.controller';

const router = Router();

router.use(requireAuth);
router.use(requirePro);

router.get('/brief', getDailyBrief);
router.get('/offers', getRecommendedOffers); // /agent/offers
router.post('/run', runAgentTask);

export default router;
