import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { createSubscription, stripeWebhook } from '../controllers/stripe.controller';

const router = Router();

// Webhook (no auth, raw body)
router.post('/webhook', stripeWebhook);

// Subscription (requires auth)
router.post('/create-subscription', requireAuth, createSubscription);

export default router;
