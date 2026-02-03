import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import logger from '../utils/logger';
import { CreateJobRequest } from '../types';

/**
 * Get all jobs for current user (matched jobs)
 * GET /jobs
 */
export const getJobs = async (req: Request, res: Response): Promise<void> => {
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

        // Pagination
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const [matches, total] = await Promise.all([
            prisma.jobMatch.findMany({
                where: { userId: user.id },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    jobOffer: true,
                },
            }),
            prisma.jobMatch.count({ where: { userId: user.id } }),
        ]);

        res.json({
            success: true,
            data: matches.map(m => ({
                ...m.jobOffer,
                matchScore: m.scoreTotal,
                matchExplanation: m.explanation,
                matchId: m.id
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        logger.error('Get jobs error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to fetch jobs' },
        });
    }
};

/**
 * Get single job by ID
 * GET /jobs/:id
 */
export const getJobById = async (req: Request, res: Response): Promise<void> => {
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

        const match = await prisma.jobMatch.findFirst({
            where: {
                jobOfferId: req.params.id,
                userId: user?.id,
            },
            include: {
                jobOffer: true,
            },
        });

        if (!match) {
            res.status(404).json({
                success: false,
                error: { code: 'JOB_NOT_FOUND', message: 'Job not found for this user' },
            });
            return;
        }

        res.json({
            success: true,
            data: {
                ...match.jobOffer,
                matchScore: match.scoreTotal,
                matchExplanation: match.explanation
            }
        });
    } catch (error: any) {
        logger.error('Get job error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to fetch job' },
        });
    }
};

/**
 * Save/Create a new job (global offer) and match it to user
 * POST /jobs
 */
export const createJob = async (req: Request, res: Response): Promise<void> => {
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

        const data: CreateJobRequest = req.body;

        // Upsert JobOffer
        const jobOffer = await prisma.jobOffer.upsert({
            where: { url: data.url },
            update: {
                title: data.title,
                company: data.company,
                location: data.location,
                description: data.description,
            },
            create: {
                url: data.url,
                title: data.title,
                company: data.company,
                location: data.location,
                description: data.description,
                source: data.source || 'MANUAL',
            }
        });

        // Create initial Match (score 100 for manual/saved)
        const match = await prisma.jobMatch.upsert({
            where: {
                userId_jobOfferId: {
                    userId: user.id,
                    jobOfferId: jobOffer.id
                }
            },
            update: {},
            create: {
                userId: user.id,
                jobOfferId: jobOffer.id,
                scoreTotal: 100,
                explanation: 'Manually saved'
            }
        });

        res.status(201).json({ success: true, data: { ...jobOffer, matchId: match.id } });
    } catch (error: any) {
        logger.error('Create job error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to save job' },
        });
    }
};

/**
 * Delete a job (unmatch)
 * DELETE /jobs/:id
 */
export const deleteJob = async (req: Request, res: Response): Promise<void> => {
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

        await prisma.jobMatch.deleteMany({
            where: {
                jobOfferId: req.params.id,
                userId: user?.id,
            },
        });

        res.json({ success: true, message: 'Job unmatched successfully' });
    } catch (error: any) {
        logger.error('Delete job error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to delete job' },
        });
    }
};
