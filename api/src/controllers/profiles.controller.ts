import { Request, Response } from 'express';
import prisma from '../utils/database';
import logger from '../utils/logger';
import { CreateProfileRequest, UpdateProfileRequest } from '../types';

/**
 * Get current user's profile
 * GET /profiles/me
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
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

        if (!user.profile) {
            res.status(404).json({
                success: false,
                error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not created yet' },
            });
            return;
        }

        res.json({ success: true, data: user.profile });
    } catch (error: any) {
        logger.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to fetch profile' },
        });
    }
};

/**
 * Create user profile
 * POST /profiles/me
 */
export const createProfile = async (req: Request, res: Response): Promise<void> => {
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

        if (user.profile) {
            res.status(400).json({
                success: false,
                error: { code: 'PROFILE_EXISTS', message: 'Profile already exists' },
            });
            return;
        }

        const data: CreateProfileRequest = req.body;

        const profile = await prisma.profile.create({
            data: {
                userId: user.id,
                educationLevel: data.educationLevel,
                fieldOfStudy: data.fieldOfStudy,
                skills: data.skills || [],
                preferredLocations: data.preferredLocations || [],
                preferredSectors: data.preferredSectors || [],
                bio: data.bio,
            },
        });

        res.status(201).json({ success: true, data: profile });
    } catch (error: any) {
        logger.error('Create profile error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to create profile' },
        });
    }
};

/**
 * Update user profile
 * PATCH /profiles/me
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
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

        if (!user || !user.profile) {
            res.status(404).json({
                success: false,
                error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found' },
            });
            return;
        }

        const data: UpdateProfileRequest = req.body;

        const profile = await prisma.profile.update({
            where: { userId: user.id },
            data: {
                ...(data.educationLevel && { educationLevel: data.educationLevel }),
                ...(data.fieldOfStudy && { fieldOfStudy: data.fieldOfStudy }),
                ...(data.skills && { skills: data.skills }),
                ...(data.preferredLocations && { preferredLocations: data.preferredLocations }),
                ...(data.preferredSectors && { preferredSectors: data.preferredSectors }),
                ...(data.bio !== undefined && { bio: data.bio }),
            },
        });

        res.json({ success: true, data: profile });
    } catch (error: any) {
        logger.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Failed to update profile' },
        });
    }
};
