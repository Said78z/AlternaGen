import { Request, Response } from 'express';
import { createCheckoutSession, handleWebhook } from '../services/stripe.service';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

export async function createSubscription(req: Request, res: Response) {
    try {
        const userId = req.userId!;
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const checkoutUrl = await createCheckoutSession({
            userId,
            userEmail: user.email,
            successUrl: `${process.env.FRONTEND_URL}/success`,
            cancelUrl: `${process.env.FRONTEND_URL}/pricing`,
        });

        res.json({ url: checkoutUrl });
    } catch (error) {
        logger.error('Create subscription error:', error);
        res.status(500).json({ error: 'Failed to create subscription' });
    }
}

export async function stripeWebhook(req: Request, res: Response) {
    try {
        const signature = req.headers['stripe-signature'] as string;
        await handleWebhook(req.body, signature);
        res.json({ received: true });
    } catch (error) {
        logger.error('Stripe webhook error:', error);
        res.status(400).json({ error: 'Webhook error' });
    }
}
