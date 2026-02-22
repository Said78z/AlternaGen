import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { generateContentIdeas, repurposeToReels } from '../services/smma.service';
import logger from '../utils/logger';

// ---- Questionnaire ----

export async function upsertQuestionnaire(req: Request, res: Response) {
    try {
        const userId = req.userId!;
        const { agencyName, niche, targetAudience, contentGoals, toneOfVoice, competitors, uniqueValue, language } = req.body;

        if (!agencyName || !niche || !targetAudience || !contentGoals || !toneOfVoice) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const agency = await prisma.smmqAgency.upsert({
            where: { userId },
            create: { userId, agencyName, niche, targetAudience, contentGoals, toneOfVoice, competitors, uniqueValue, language: language || 'fr' },
            update: { agencyName, niche, targetAudience, contentGoals, toneOfVoice, competitors, uniqueValue, language: language || 'fr' },
        });

        return res.status(200).json({ success: true, data: agency });
    } catch (error) {
        logger.error({ error }, 'upsertQuestionnaire error');
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

export async function getQuestionnaire(req: Request, res: Response) {
    try {
        const userId = req.userId!;
        const agency = await prisma.smmqAgency.findUnique({ where: { userId } });
        if (!agency) return res.status(404).json({ success: false, error: 'Agency profile not found' });
        return res.status(200).json({ success: true, data: agency });
    } catch (error) {
        logger.error({ error }, 'getQuestionnaire error');
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

// ---- Generate ----

export async function generateContent(req: Request, res: Response) {
    try {
        const userId = req.userId!;
        const agency = await prisma.smmqAgency.findUnique({ where: { userId } });
        if (!agency) return res.status(400).json({ success: false, error: 'Complete the questionnaire first' });

        const items = await generateContentIdeas({
            agencyName: agency.agencyName,
            niche: agency.niche,
            targetAudience: agency.targetAudience,
            contentGoals: agency.contentGoals,
            toneOfVoice: agency.toneOfVoice,
            competitors: agency.competitors ?? undefined,
            uniqueValue: agency.uniqueValue ?? undefined,
            language: agency.language,
        });

        const created = await prisma.$transaction(
            items.map((item) =>
                prisma.contentItem.create({
                    data: {
                        agencyId: agency.id,
                        title: item.title,
                        channel: item.channel,
                        hook: item.hook,
                        script: item.script,
                        cta: item.cta,
                        onScreenText: item.onScreenText,
                        beats: item.beats,
                        hashtags: item.hashtags,
                    },
                })
            )
        );

        return res.status(201).json({ success: true, data: created, count: created.length });
    } catch (error) {
        logger.error({ error }, 'generateContent error');
        return res.status(500).json({ success: false, error: 'Content generation failed' });
    }
}

// ---- Content Library ----

export async function listContent(req: Request, res: Response) {
    try {
        const userId = req.userId!;
        const { status, channel, search, page = '1', limit = '30' } = req.query as Record<string, string>;

        const agency = await prisma.smmqAgency.findUnique({ where: { userId } });
        if (!agency) return res.status(404).json({ success: false, error: 'Agency profile not found' });

        const where: any = { agencyId: agency.id, parentId: null };
        if (status) where.status = status;
        if (channel) where.channel = channel;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { hook: { contains: search, mode: 'insensitive' } },
            ];
        }

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        const [items, total] = await Promise.all([
            prisma.contentItem.findMany({
                where,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: { metrics: true, calendarEvents: true },
            }),
            prisma.contentItem.count({ where }),
        ]);

        return res.status(200).json({ success: true, data: items, total, page: pageNum, limit: limitNum });
    } catch (error) {
        logger.error({ error }, 'listContent error');
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

export async function getContentItem(req: Request, res: Response) {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const agency = await prisma.smmqAgency.findUnique({ where: { userId } });
        if (!agency) return res.status(404).json({ success: false, error: 'Agency profile not found' });

        const item = await prisma.contentItem.findFirst({
            where: { id, agencyId: agency.id },
            include: { metrics: true, calendarEvents: true, variants: true },
        });
        if (!item) return res.status(404).json({ success: false, error: 'Content item not found' });

        return res.status(200).json({ success: true, data: item });
    } catch (error) {
        logger.error({ error }, 'getContentItem error');
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

export async function updateContentItem(req: Request, res: Response) {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const { title, hook, script, cta, onScreenText, beats, hashtags, status } = req.body;

        const agency = await prisma.smmqAgency.findUnique({ where: { userId } });
        if (!agency) return res.status(404).json({ success: false, error: 'Agency profile not found' });

        const item = await prisma.contentItem.findFirst({ where: { id, agencyId: agency.id } });
        if (!item) return res.status(404).json({ success: false, error: 'Content item not found' });

        const updated = await prisma.contentItem.update({
            where: { id },
            data: { title, hook, script, cta, onScreenText, beats, hashtags, status },
        });

        return res.status(200).json({ success: true, data: updated });
    } catch (error) {
        logger.error({ error }, 'updateContentItem error');
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

// ---- Calendar ----

export async function createCalendarEvent(req: Request, res: Response) {
    try {
        const userId = req.userId!;
        const { contentItemId, scheduledAt, channel, notes } = req.body;

        if (!contentItemId || !scheduledAt || !channel) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const agency = await prisma.smmqAgency.findUnique({ where: { userId } });
        if (!agency) return res.status(404).json({ success: false, error: 'Agency profile not found' });

        const item = await prisma.contentItem.findFirst({ where: { id: contentItemId, agencyId: agency.id } });
        if (!item) return res.status(404).json({ success: false, error: 'Content item not found' });

        const event = await prisma.calendarEvent.create({
            data: { contentItemId, scheduledAt: new Date(scheduledAt), channel, notes },
        });

        return res.status(201).json({ success: true, data: event });
    } catch (error) {
        logger.error({ error }, 'createCalendarEvent error');
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

export async function listCalendarEvents(req: Request, res: Response) {
    try {
        const userId = req.userId!;
        const { from, to } = req.query as Record<string, string>;

        const agency = await prisma.smmqAgency.findUnique({ where: { userId } });
        if (!agency) return res.status(404).json({ success: false, error: 'Agency profile not found' });

        const contentItemIds = (await prisma.contentItem.findMany({
            where: { agencyId: agency.id },
            select: { id: true },
        })).map((i) => i.id);

        const where: any = { contentItemId: { in: contentItemIds } };
        if (from || to) {
            where.scheduledAt = {};
            if (from) where.scheduledAt.gte = new Date(from);
            if (to) where.scheduledAt.lte = new Date(to);
        }

        const events = await prisma.calendarEvent.findMany({
            where,
            orderBy: { scheduledAt: 'asc' },
            include: { contentItem: true },
        });

        return res.status(200).json({ success: true, data: events });
    } catch (error) {
        logger.error({ error }, 'listCalendarEvents error');
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

// ---- Repurpose ----

export async function repurposeContent(req: Request, res: Response) {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const agency = await prisma.smmqAgency.findUnique({ where: { userId } });
        if (!agency) return res.status(404).json({ success: false, error: 'Agency profile not found' });

        const item = await prisma.contentItem.findFirst({ where: { id, agencyId: agency.id } });
        if (!item) return res.status(404).json({ success: false, error: 'Content item not found' });
        if (item.channel !== 'TIKTOK') {
            return res.status(400).json({ success: false, error: 'Only TikTok content can be repurposed to Reels' });
        }

        const reelsVersion = await repurposeToReels({
            title: item.title,
            hook: item.hook,
            script: item.script,
            cta: item.cta,
            hashtags: item.hashtags,
        }, agency.language);

        const variant = await prisma.contentItem.create({
            data: {
                agencyId: agency.id,
                parentId: item.id,
                title: reelsVersion.title,
                channel: 'REELS',
                hook: reelsVersion.hook,
                script: reelsVersion.script,
                cta: reelsVersion.cta,
                onScreenText: reelsVersion.onScreenText,
                beats: reelsVersion.beats,
                hashtags: reelsVersion.hashtags,
            },
        });

        return res.status(201).json({ success: true, data: variant });
    } catch (error) {
        logger.error({ error }, 'repurposeContent error');
        return res.status(500).json({ success: false, error: 'Repurpose failed' });
    }
}

// ---- CSV Export ----

export async function exportCsv(req: Request, res: Response) {
    try {
        const userId = req.userId!;
        const { ids } = req.query as { ids?: string };

        const agency = await prisma.smmqAgency.findUnique({ where: { userId } });
        if (!agency) return res.status(404).json({ success: false, error: 'Agency profile not found' });

        const where: any = { agencyId: agency.id };
        if (ids) {
            const idList = ids.split(',').map((id) => id.trim()).filter(Boolean);
            if (idList.length > 0) where.id = { in: idList };
        }

        const items = await prisma.contentItem.findMany({ where, include: { metrics: true } });

        const escapeCsv = (val: string | null | undefined): string => {
            if (val === null || val === undefined) return '';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
        };

        const header = ['id', 'title', 'channel', 'status', 'hook', 'script', 'cta', 'onScreenText', 'beats', 'hashtags', 'views', 'likes', 'comments', 'shares', 'clicks', 'leads', 'revenue', 'createdAt'];
        const rows = items.map((item) => [
            escapeCsv(item.id),
            escapeCsv(item.title),
            escapeCsv(item.channel),
            escapeCsv(item.status),
            escapeCsv(item.hook),
            escapeCsv(item.script),
            escapeCsv(item.cta),
            escapeCsv(item.onScreenText),
            escapeCsv(item.beats),
            escapeCsv(item.hashtags.join(';')),
            String(item.metrics?.views ?? 0),
            String(item.metrics?.likes ?? 0),
            String(item.metrics?.comments ?? 0),
            String(item.metrics?.shares ?? 0),
            String(item.metrics?.clicks ?? 0),
            String(item.metrics?.leads ?? 0),
            String(item.metrics?.revenue ?? ''),
            escapeCsv(item.createdAt.toISOString()),
        ]);

        const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="content-export-${Date.now()}.csv"`);
        return res.status(200).send(csv);
    } catch (error) {
        logger.error({ error }, 'exportCsv error');
        return res.status(500).json({ success: false, error: 'Export failed' });
    }
}

// ---- Metrics ----

export async function upsertMetrics(req: Request, res: Response) {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const { views, likes, comments, shares, clicks, leads, revenue } = req.body;

        const agency = await prisma.smmqAgency.findUnique({ where: { userId } });
        if (!agency) return res.status(404).json({ success: false, error: 'Agency profile not found' });

        const item = await prisma.contentItem.findFirst({ where: { id, agencyId: agency.id } });
        if (!item) return res.status(404).json({ success: false, error: 'Content item not found' });

        const metrics = await prisma.contentMetrics.upsert({
            where: { contentItemId: id },
            create: { contentItemId: id, views: views || 0, likes: likes || 0, comments: comments || 0, shares: shares || 0, clicks: clicks || 0, leads: leads || 0, revenue },
            update: { views: views || 0, likes: likes || 0, comments: comments || 0, shares: shares || 0, clicks: clicks || 0, leads: leads || 0, revenue },
        });

        // Update item status to POSTED
        await prisma.contentItem.update({ where: { id }, data: { status: 'POSTED' } });

        return res.status(200).json({ success: true, data: metrics });
    } catch (error) {
        logger.error({ error }, 'upsertMetrics error');
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

export async function getMetricsDashboard(req: Request, res: Response) {
    try {
        const userId = req.userId!;

        const agency = await prisma.smmqAgency.findUnique({ where: { userId } });
        if (!agency) return res.status(404).json({ success: false, error: 'Agency profile not found' });

        const items = await prisma.contentItem.findMany({
            where: { agencyId: agency.id },
            include: { metrics: true },
        });

        const withMetrics = items.filter((i) => i.metrics);
        const totals = withMetrics.reduce(
            (acc, item) => {
                const m = item.metrics!;
                acc.views += m.views;
                acc.likes += m.likes;
                acc.comments += m.comments;
                acc.shares += m.shares;
                acc.clicks += m.clicks;
                acc.leads += m.leads;
                acc.revenue += m.revenue || 0;
                return acc;
            },
            { views: 0, likes: 0, comments: 0, shares: 0, clicks: 0, leads: 0, revenue: 0 }
        );

        const byChannel = items.reduce((acc: Record<string, number>, item) => {
            acc[item.channel] = (acc[item.channel] || 0) + 1;
            return acc;
        }, {});

        const byStatus = items.reduce((acc: Record<string, number>, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
        }, {});

        return res.status(200).json({
            success: true,
            data: {
                totals,
                byChannel,
                byStatus,
                totalItems: items.length,
                postedItems: withMetrics.length,
            },
        });
    } catch (error) {
        logger.error({ error }, 'getMetricsDashboard error');
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
