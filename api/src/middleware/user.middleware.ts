import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/database';

export const syncUserMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.clerkId) {
            return next();
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: req.clerkId },
            include: { subscription: true }
        });

        if (user) {
            req.userId = user.id;
            req.user = user; // Attach full user object for subsequent middlewares
        }
        next();
    } catch (error) {
        console.error('Sync user middleware error:', error);
        next();
    }
};

export const requirePro = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const sub = req.user.subscription;

        // Simple check: Must have a subscription record
        // In real Stripe world: status must be 'active' or 'trialing' AND currentPeriodEnd > now
        // For MVP manual testing: just check if planCode === 'PRO'

        const isPro = sub && sub.planCode === 'PRO' && sub.status === 'active';

        // Allow grace period if strictly needed, but for now strict.

        if (!isPro) {
            return res.status(403).json({
                error: 'Forbidden: PRO subscription required',
                code: 'PRO_REQUIRED'
            });
        }

        next();
    } catch (error) {
        console.error('RequirePro middleware error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
