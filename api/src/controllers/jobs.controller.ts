import { Request, Response } from 'express';
import prisma from '../utils/database';
import logger from '../utils/logger';
import { CreateJobRequest } from '../types';

/**
 * Get all jobs for current user
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

        // Filters
        const location = req.query.location as string;
        const company = req.query.company as string;

        const where: any = { userId: user.id };
        if (location) where.location = { contains: location, mode: 'insensitive' };
        if (company) where.company = { contains: company, mode: 'insensitive' };

        const [jobs, total] = await Promise.all([
            prisma.job.findMany({
                where,
                skip,
                take: limit,
                orderBy: { savedAt: 'desc' },
                include: {
                    matchScores: {
                        where: { userId: user.id },
                        take: 1,
                    },
                },
            }),
            prisma.job.count({ where }),
        ]);

        res.json({
            success: true,
            data: jobs,
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

        if (!user) {
            res.status(404).json({
                success: false,
                error: { code: 'USER_NOT_FOUND', message: 'User not found' },
            });
            return;
        }

        const job = await prisma.job.findFirst({
            where: {
                id: req.params.id,
                userId: user.id,
            },
            include: {
                matchScores: {
                    where: { userId: user.id },
                    take: 1,
                },
                applications: {
                    where: { userId: user.id },
                    take: 1,
                },
            },
        });

        if (!job) {
            res.status(404).json({
                success: false,
                error: { code: 'JOB_NOT_FOUND', message: 'Job not found' },
            });
            return;
        }

        res.json({ success: true, data: job });
    } catch (error: any) {
        logger.error('Get job error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to fetch job' },
        });
    }
};

/**
 * Save a new job
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

        // Check if URL already exists for this user
        const existing = await prisma.job.findFirst({
            where: {
                url: data.url,
                userId: user.id,
            },
        });

        if (existing) {
            res.status(400).json({
                success: false,
                error: { code: 'JOB_EXISTS', message: 'Job already saved' },
            });
            return;
        }

        const job = await prisma.job.create({
            data: {
                userId: user.id,
                title: data.title,
                company: data.company,
                location: data.location,
                description: data.description,
                requirements: data.requirements,
                url: data.url,
                source: data.source || 'Manual',
            },
        });

        // TODO: Calculate match score asynchronously
        // For now, we'll add it in the matching service

        res.status(201).json({ success: true, data: job });
    } catch (error: any) {
        logger.error('Create job error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to save job' },
        });
    }
};

/**
 * Delete a job
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

        if (!user) {
            res.status(404).json({
                success: false,
                error: { code: 'USER_NOT_FOUND', message: 'User not found' },
            });
            return;
        }

        const job = await prisma.job.findFirst({
            where: {
                id: req.params.id,
                userId: user.id,
            },
        });

        if (!job) {
            res.status(404).json({
                success: false,
                error: { code: 'JOB_NOT_FOUND', message: 'Job not found' },
            });
            return;
        }

        await prisma.job.delete({
            where: { id: job.id },
        });

        res.json({ success: true, message: 'Job deleted successfully' });
    } catch (error: any) {
        logger.error('Delete job error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to delete job' },
        });
    }
};
