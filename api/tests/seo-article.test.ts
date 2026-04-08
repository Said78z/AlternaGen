import request from 'supertest';
import app from '../src/index';

// Mock prisma and openai service to isolate the unit under test
jest.mock('../src/services/stripe.service', () => ({
    createCheckoutSession: jest.fn(),
    handleWebhook: jest.fn(),
}));

jest.mock('../src/utils/database', () => ({
    prisma: {
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
        credits: {
            findUnique: jest.fn().mockResolvedValue({ freeCredits: 5, isSubscribed: false }),
            create: jest.fn(),
            update: jest.fn().mockResolvedValue({ freeCredits: 4, isSubscribed: false }),
        },
        generation: {
            create: jest.fn().mockResolvedValue({}),
        },
    },
}));

jest.mock('../src/services/openai.service', () => ({
    generateCV: jest.fn(),
    generateCoverLetter: jest.fn(),
    generateSEOArticle: jest.fn().mockResolvedValue({
        seoTitle: '10 Powerful Tips for Mastering remote work in 2024',
        metaDescription:
            'Discover the best strategies for remote work that boost your productivity and well-being.',
        article: '# Remote Work Guide\n\nRemote work has transformed the modern workplace...',
    }),
}));

jest.mock('../src/middleware/auth.middleware', () => ({
    requireAuth: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../src/middleware/user.middleware', () => ({
    syncUserMiddleware: (req: any, _res: any, next: any) => {
        req.userId = 'test-user-id';
        next();
    },
    requirePro: (_req: any, _res: any, next: any) => next(),
}));

describe('POST /ai/generate-seo-article', () => {
    it('should return 400 when keyword is missing', async () => {
        const response = await request(app)
            .post('/ai/generate-seo-article')
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'keyword is required');
    });

    it('should return 400 when keyword is empty string', async () => {
        const response = await request(app)
            .post('/ai/generate-seo-article')
            .send({ keyword: '   ' });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'keyword is required');
    });

    it('should return 200 with seoTitle, metaDescription, and article', async () => {
        const response = await request(app)
            .post('/ai/generate-seo-article')
            .send({ keyword: 'remote work' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('seoTitle');
        expect(response.body).toHaveProperty('metaDescription');
        expect(response.body).toHaveProperty('article');
    });
});
