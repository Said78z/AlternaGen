import { Request, Response } from 'express';
import prisma from '../utils/database';
import logger from '../utils/logger';
import { CreateApplicationRequest, UpdateApplicationRequest, ApplicationStatus } from '../types';

/**
 * Get all applications for current user
 * GET /applications
 */
export const getApplications = async (req: Request, res: Response): Promise<void> => {
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

        // Filter by status if provided
        const status = req.query.status as ApplicationStatus | undefined;
        const where: any = { userId: user.id };
        if (status) where.status = status;

        const applications = await prisma.application.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                job: true,
            },
        });

        res.json({ success: true, data: applications });
    } catch (error: any) {
        logger.error('Get applications error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to fetch applications' },
        });
    }
};

/**
 * Create application (link job to user with status)
 * POST /applications
 */
export const createApplication = async (req: Request, res: Response): Promise<void> => {
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

        const data: CreateApplicationRequest = req.body;

        // Check if application already exists
        const existing = await prisma.application.findUnique({
            where: {
                userId_jobId: {
                    userId: user.id,
                    jobId: data.jobId,
                },
            },
        });

        if (existing) {
            res.status(400).json({
                success: false,
                error: { code: 'APPLICATION_EXISTS', message: 'Application already exists' },
            });
            return;
        }

        const application = await prisma.application.create({
            data: {
                userId: user.id,
                jobId: data.jobId,
                status: data.status || ApplicationStatus.SAVED,
                notes: data.notes,
            },
            include: {
                job: true,
            },
        });

        res.status(201).json({ success: true, data: application });
    } catch (error: any) {
        logger.error('Create application error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to create application' },
        });
    }
};

/**
 * Update application status/notes
 * PATCH /applications/:id
 */
export const updateApplication = async (req: Request, res: Response): Promise<void> => {
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

        const application = await prisma.application.findFirst({
            where: {
                id: req.params.id,
                userId: user.id,
            },
        });

        if (!application) {
            res.status(404).json({
                success: false,
                error: { code: 'APPLICATION_NOT_FOUND', message: 'Application not found' },
            });
            return;
        }

        const data: UpdateApplicationRequest = req.body;

        const updated = await prisma.application.update({
            where: { id: application.id },
            data: {
                ...(data.status && { status: data.status }),
                ...(data.notes !== undefined && { notes: data.notes }),
                ...(data.appliedAt && { appliedAt: data.appliedAt }),
            },
            include: {
                job: true,
            },
        });

        res.json({ success: true, data: updated });
    } catch (error: any) {
        logger.error('Update application error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to update application' },
        });
    }
};

/**
 * Delete application
 * DELETE /applications/:id
 */
export const deleteApplication = async (req: Request, res: Response): Promise<void> => {
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

        const application = await prisma.application.findFirst({
            where: {
                id: req.params.id,
                userId: user.id,
            },
        });

        if (!application) {
            res.status(404).json({
                success: false,
                error: { code: 'APPLICATION_NOT_FOUND', message: 'Application not found' },
            });
            return;
        }

        await prisma.application.delete({
            where: { id: application.id },
        });

        res.json({ success: true, message: 'Application deleted successfully' });
    } catch (error: any) {
        logger.error('Delete application error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to delete application' },
        });
    }
};
