import { Router } from 'express';
import { triggerOnboarding } from '../controllers/automation.controller';

const router = Router();

router.post('/trigger-onboarding', triggerOnboarding);

export default router;
