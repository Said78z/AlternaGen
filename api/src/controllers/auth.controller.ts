import { Request, Response } from 'express';
import { Webhook } from 'svix';
import prisma from '../utils/database';
import logger from '../utils/logger';
import { ClerkWebhookEvent } from '../types';

/**
 * Clerk webhook handler
 * POST /auth/webhook
 * 
 * Handles user.created events from Clerk
 */
export const handleClerkWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

        if (!WEBHOOK_SECRET) {
            logger.error('CLERK_WEBHOOK_SECRET not configured');
            res.status(500).json({ error: 'Webhook secret not configured' });
            return;
        }

        // Get the headers
        const svix_id = req.headers['svix-id'] as string;
        const svix_timestamp = req.headers['svix-timestamp'] as string;
        const svix_signature = req.headers['svix-signature'] as string;

        // If there are no headers, error out
        if (!svix_id || !svix_timestamp || !svix_signature) {
            res.status(400).json({ error: 'Missing svix headers' });
            return;
        }

        // Get the body
        const body = JSON.stringify(req.body);

        // Create a new Svix instance with your secret
        const wh = new Webhook(WEBHOOK_SECRET);

        let evt: ClerkWebhookEvent;

        // Verify the payload with the headers
        try {
            evt = wh.verify(body, {
                'svix-id': svix_id,
                'svix-timestamp': svix_timestamp,
                'svix-signature': svix_signature,
            }) as ClerkWebhookEvent;
        } catch (err) {
            logger.error('Webhook verification failed:', err);
            res.status(400).json({ error: 'Webhook verification failed' });
            return;
        }

        // Handle the webhook
        const eventType = evt.type;

        if (eventType === 'user.created') {
            const { id, email_addresses, first_name, last_name } = evt.data;

            // Create user in our database
            await prisma.user.create({
                data: {
                    clerkId: id,
                    email: email_addresses[0].email_address,
                    firstName: first_name || null,
                    lastName: last_name || null,
                },
            });

            logger.info(`User created: ${id}`);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        logger.error('Webhook handler error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
