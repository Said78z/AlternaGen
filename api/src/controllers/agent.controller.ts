import { Request, Response } from 'express';
import prisma from '../utils/database';
import { createTask } from '../services/agent.service';

/**
 * GET /agent/brief
 * Returns daily actions and summary for PRO users
 */
export async function getDailyBrief(req: Request, res: Response) {
    try {
        const userId = req.userId!;
        // MVP 2 Gating: Check implementation
        // For MVP 2, we assume everyone is PRO or we let them see a tease

        // 1. Get stats
        const [pendingApps, offers] = await Promise.all([
            prisma.application.count({
                where: { userId, status: { in: ['SAVED', 'APPLIED', 'WAITING'] } }
            }),
            prisma.jobMatch.count({
                where: { userId, scoreTotal: { gt: 70 } } // Good matches
            })
        ]);

        // 2. Generate "Brief"
        const brief = {
            message: "Here is your mission for today.",
            actions: [
                { type: "APPLY", label: "Apply to TechCorp (95% Match)", link: "/offers/1" },
                { type: "FOLLOWUP", label: "Follow up with DigitalAgency", link: "/applications/2" }
            ],
            stats: {
                pendingApplications: pendingApps,
                newOpportunities: offers
            }
        };

        res.json({ success: true, data: brief });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Failed to get brief' });
    }
}

/**
 * GET /offers/recommended
 * Returns top matched offers
 */
export async function getRecommendedOffers(req: Request, res: Response) {
    try {
        const userId = req.userId!;

        // MVP logic: Find top matches. If none, trigger matching task
        let matches = await prisma.jobMatch.findMany({
            where: { userId },
            include: { jobOffer: true },
            orderBy: { scoreTotal: 'desc' },
            take: 10
        });

        if (matches.length === 0) {
            // Trigger Agent Task to find matches (Async)
            await createTask(userId, 'RUN_MATCH');

            // Return empty for now with a "working on it" status
            return res.json({
                success: true,
                data: [],
                status: "MATCHING_IN_PROGRESS"
            });
        }

        res.json({ success: true, data: matches });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Failed to fetch recommendations' });
    }
}

/**
 * POST /agent/run
 * Manually trigger agent task
 */
export async function runAgentTask(req: Request, res: Response) {
    try {
        const userId = req.userId!;
        const { taskType } = req.body; // e.g. "FETCH_OFFERS"

        const task = await createTask(userId, taskType);
        res.json({ success: true, data: task });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Failed to run task' });
    }
}
