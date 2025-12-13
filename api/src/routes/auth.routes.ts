import { Router } from 'express';
import express from 'express';
import { handleClerkWebhook } from '../controllers/auth.controller';

const router = Router();

/**
 * @route   POST /auth/webhook
 * @desc    Clerk webhook for user events
 * @access  Public (verified by Svix signature)
 */
router.post(
    '/webhook',
    express.raw({ type: 'application/json' }),
    handleClerkWebhook
);

export default router;
