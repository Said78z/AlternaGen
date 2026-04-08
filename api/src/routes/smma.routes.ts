import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.middleware';
import { syncUserMiddleware } from '../middleware/user.middleware';
import {
    upsertQuestionnaire,
    getQuestionnaire,
    generateContent,
    listContent,
    getContentItem,
    updateContentItem,
    createCalendarEvent,
    listCalendarEvents,
    repurposeContent,
    exportCsv,
    upsertMetrics,
    getMetricsDashboard,
} from '../controllers/smma.controller';

const router = Router();

// Global rate limiter for all SMMA routes (100 requests per 15 minutes per IP)
const smmqLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for AI generation endpoints (10 requests per 15 minutes per IP)
const generateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, error: 'Too many generation requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.use(smmqLimiter);
router.use(requireAuth);
router.use(syncUserMiddleware);

// Questionnaire
router.post('/questionnaire', upsertQuestionnaire);
router.get('/questionnaire', getQuestionnaire);

// Generation (rate-limited)
router.post('/generate', generateLimiter, generateContent);

// Content library
router.get('/content', listContent);
router.get('/content/:id', getContentItem);
router.put('/content/:id', updateContentItem);

// Calendar
router.post('/calendar', createCalendarEvent);
router.get('/calendar', listCalendarEvents);

// Repurpose (rate-limited)
router.post('/content/:id/repurpose', generateLimiter, repurposeContent);

// CSV Export
router.get('/export', exportCsv);

// Metrics
router.post('/content/:id/metrics', upsertMetrics);
router.get('/metrics/dashboard', getMetricsDashboard);

export default router;
