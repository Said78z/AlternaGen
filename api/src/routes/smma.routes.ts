import { Router } from 'express';
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

router.use(requireAuth);
router.use(syncUserMiddleware);

// Questionnaire
router.post('/questionnaire', upsertQuestionnaire);
router.get('/questionnaire', getQuestionnaire);

// Generation
router.post('/generate', generateContent);

// Content library
router.get('/content', listContent);
router.get('/content/:id', getContentItem);
router.put('/content/:id', updateContentItem);

// Calendar
router.post('/calendar', createCalendarEvent);
router.get('/calendar', listCalendarEvents);

// Repurpose
router.post('/content/:id/repurpose', repurposeContent);

// CSV Export
router.get('/export', exportCsv);

// Metrics
router.post('/content/:id/metrics', upsertMetrics);
router.get('/metrics/dashboard', getMetricsDashboard);

export default router;
