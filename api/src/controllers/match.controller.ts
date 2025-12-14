import { Request, Response } from 'express';
import prisma from '../utils/database';
import logger from '../utils/logger';
import { calculateMatchScore } from '../services/matching.service';

/**
 * Calculate match score for a job
 * POST /match/calculate
 */
export const calculateMatch = async (req: Request, res: Response): Promise<void> => {
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
        });

        if (!user) {
            res.status(404).json({
                success: false,
                error: { code: 'USER_NOT_FOUND', message: 'User not found' },
            });
            return;
        }

        const { jobId } = req.body;

        if (!jobId) {
            res.status(400).json({
                success: false,
                error: { code: 'MISSING_JOB_ID', message: 'Job ID required' },
            });
            return;
        }

        const result = await calculateMatchScore(user.id, jobId);

        res.json({ success: true, data: result });
    } catch (error) {
        logger.error('Calculate match error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to calculate match' },
        });
    }
};

/**
 * Get recommended jobs (top matches)
 * GET /match/recommendations
 */
export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
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
        });

        if (!user) {
            res.status(404).json({
                success: false,
                error: { code: 'USER_NOT_FOUND', message: 'User not found' },
            });
            return;
        }

        const limit = parseInt(req.query.limit as string) || 10;

        const recommendations = await prisma.jobMatch.findMany({
            where: { userId: user.id },
            orderBy: { scoreTotal: 'desc' },
            take: limit,
            include: {
                jobOffer: true,
            },
        });

        res.json({ success: true, data: recommendations });
    } catch (error) {
        logger.error('Get recommendations error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to fetch recommendations' },
        });
    }
};
