import { Request, Response } from 'express';
import { generateCV, generateCoverLetter, CVInput, CoverLetterInput } from '../services/openai.service';
import { prisma } from '../utils/database';
import logger from '../utils/logger';

// Check and deduct credits
async function checkAndDeductCredits(userId: string): Promise<boolean> {
    const credits = await prisma.credits.findUnique({
        where: { userId },
    });

    if (!credits) {
        // Create credits record with 5 free credits
        await prisma.credits.create({
            data: {
                userId,
                freeCredits: 5,
            },
        });
        return true;
    }

    // If subscribed, unlimited credits
    if (credits.isSubscribed) {
        return true;
    }

    // Check free credits
    if (credits.freeCredits > 0) {
        await prisma.credits.update({
            where: { userId },
            data: {
                freeCredits: credits.freeCredits - 1,
            },
        });
        return true;
    }

    return false; // No credits left
}

export async function getCredits(req: Request, res: Response) {
    try {
        const userId = req.userId!;

        let credits = await prisma.credits.findUnique({
            where: { userId },
        });

        if (!credits) {
            credits = await prisma.credits.create({
                data: {
                    userId,
                    freeCredits: 5,
                },
            });
        }

        res.json({
            freeCredits: credits.freeCredits,
            isSubscribed: credits.isSubscribed,
            subscriptionEnd: credits.subscriptionEnd,
        });
    } catch (error: any) {
        logger.error('Get credits error:', error);
        res.status(500).json({ error: 'Failed to get credits' });
    }
}

export async function generateCVController(req: Request, res: Response) {
    try {
        const input: CVInput = req.body;

        // Ensure user exists (Auto-sync for MVP fluidity)
        if (!req.userId && req.clerkId) {
            const user = await prisma.user.create({
                data: {
                    clerkId: req.clerkId,
                    email: `user_${req.clerkId}@alternagen.com`, // Fallback
                }
            });
            req.userId = user.id;
        }

        const userId = req.userId!;

        // Check credits
        const hasCredits = await checkAndDeductCredits(userId);
        if (!hasCredits) {
            return res.status(402).json({
                error: 'No credits remaining',
                message: 'Upgrade to Pro for unlimited generations'
            });
        }

        // Generate CV
        const cv = await generateCV(input);

        // Save to history
        await prisma.generation.create({
            data: {
                userId,
                type: 'CV',
                input: JSON.stringify(input),
                output: cv,
            },
        });

        res.json({ cv });
    } catch (error: any) {
        logger.error('Generate CV error:', error);
        res.status(500).json({ error: 'Failed to generate CV' });
    }
}

export async function generateCoverLetterController(req: Request, res: Response) {
    try {
        const userId = req.userId!;
        const input: CoverLetterInput = req.body;

        // Check credits
        const hasCredits = await checkAndDeductCredits(userId);
        if (!hasCredits) {
            return res.status(402).json({
                error: 'No credits remaining',
                message: 'Upgrade to Pro for unlimited generations'
            });
        }

        // Generate cover letter
        const coverLetter = await generateCoverLetter(input);

        // Save to history
        await prisma.generation.create({
            data: {
                userId,
                type: 'COVER_LETTER',
                input: JSON.stringify(input),
                output: coverLetter,
            },
        });

        res.json({ coverLetter });
    } catch (error: any) {
        logger.error('Generate cover letter error:', error);
        res.status(500).json({ error: 'Failed to generate cover letter' });
    }
}

export async function getGenerationHistory(req: Request, res: Response) {
    try {
        const userId = req.userId!;
        const { limit = 10 } = req.query;

        const generations = await prisma.generation.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
        });

        res.json({ generations });
    } catch (error: any) {
        logger.error('Get generation history error:', error);
        res.status(500).json({ error: 'Failed to get generation history' });
    }
}
