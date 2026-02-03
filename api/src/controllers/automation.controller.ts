import { Request, Response } from 'express';
import logger from '../utils/logger';

/**
 * Trigger an n8n workflow for user onboarding
 * POST /automation/trigger-onboarding
 */
export const triggerOnboarding = async (req: Request, res: Response) => {
    try {
        const { userEmail, userName } = req.body;
        const n8nWebhookUrl = process.env.N8N_ONBOARDING_WEBHOOK_URL;

        if (!n8nWebhookUrl) {
            logger.warn('N8N_ONBOARDING_WEBHOOK_URL not set, skipping external trigger');
            return res.status(200).json({ success: true, message: 'Automation mock: Triggered' });
        }

        // Forward to n8n
        const response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, name: userName, source: 'API' })
        });

        if (!response.ok) {
            throw new Error(`n8n responded with status ${response.status}`);
        }

        res.json({ success: true, message: 'Automation triggered successfully' });
    } catch (error: any) {
        logger.error({ error }, 'Failed to trigger automation');
        res.status(500).json({ success: false, error: 'Failed to communicate with automation engine' });
    }
};
