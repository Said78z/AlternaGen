import { Request, Response } from 'express';
import prisma from '../utils/database';
import logger from '../utils/logger';

/**
 * Get current user
 * GET /users/me
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.clerkId) {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
            });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: req.clerkId },
            include: { profile: true },
        });

        if (!user) {
            res.status(404).json({
                success: false,
                error: { code: 'USER_NOT_FOUND', message: 'User not found' },
            });
            return;
        }

        res.json({ success: true, data: user });
    } catch (error) {
        logger.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to fetch user' },
        });
    }
};

/**
 * Update current user
 * PATCH /users/me
 */
export const updateCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.clerkId) {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
            });
            return;
        }

        const { firstName, lastName } = req.body;

        const user = await prisma.user.update({
            where: { clerkId: req.clerkId },
            data: {
                ...(firstName && { firstName }),
                ...(lastName && { lastName }),
            },
            include: { profile: true },
        });

        res.json({ success: true, data: user });
    } catch (error) {
        logger.error('Update user error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to update user' },
        });
    }
};
