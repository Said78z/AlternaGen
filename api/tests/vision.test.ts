import request from 'supertest';

// Mock prisma before importing app
jest.mock('../src/utils/database', () => ({
    prisma: {
        user: { findUnique: jest.fn() },
        userVision: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        $queryRaw: jest.fn().mockResolvedValue([]),
        $disconnect: jest.fn(),
    },
    default: {
        user: { findUnique: jest.fn() },
        userVision: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        $queryRaw: jest.fn().mockResolvedValue([]),
        $disconnect: jest.fn(),
    },
}));

// Mock OpenAI service to avoid missing API key error
jest.mock('../src/services/openai.service', () => ({}));

// Mock Stripe service to avoid missing API key error
jest.mock('../src/services/stripe.service', () => ({}));

// Mock auth middleware
jest.mock('../src/middleware/auth.middleware', () => ({
    requireAuth: (req: any, _res: any, next: any) => {
        req.clerkId = 'test-clerk-id';
        next();
    },
    optionalAuth: (_req: any, _res: any, next: any) => next(),
}));

import app from '../src/index';
import { prisma } from '../src/utils/database';

const mockUser = {
    id: 'user-1',
    clerkId: 'test-clerk-id',
    email: 'test@example.com',
};

const mockVision = {
    userId: 'user-1',
    dreams: 'Devenir CTO',
    constraints: 'Disponible en janvier',
    preferredIndustries: ['tech', 'fintech'],
    targetRoles: ['Développeur', 'Architecte'],
    alterGoal: 'Signer avant septembre',
    updatedAt: new Date('2026-01-01').toISOString(),
};

describe('GET /vision', () => {
    it('should return 200 with vision data', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (prisma.userVision.findUnique as jest.Mock).mockResolvedValue(mockVision);

        const response = await request(app).get('/vision');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('dreams', 'Devenir CTO');
    });

    it('should return 404 when vision does not exist', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (prisma.userVision.findUnique as jest.Mock).mockResolvedValue(null);

        const response = await request(app).get('/vision');

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('VISION_NON_TROUVEE');
    });

    it('should return 404 when user does not exist', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        const response = await request(app).get('/vision');

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('UTILISATEUR_NON_TROUVE');
    });
});

describe('POST /vision', () => {
    it('should return 201 when creating a new vision', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, vision: null });
        (prisma.userVision.create as jest.Mock).mockResolvedValue(mockVision);

        const response = await request(app)
            .post('/vision')
            .send({ targetRoles: ['Développeur'], dreams: 'Devenir CTO' });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('success', true);
    });

    it('should return 400 when vision already exists', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, vision: mockVision });

        const response = await request(app)
            .post('/vision')
            .send({ targetRoles: ['Développeur'] });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VISION_EXISTE');
    });

    it('should return 400 when targetRoles is missing', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, vision: null });

        const response = await request(app)
            .post('/vision')
            .send({ dreams: 'Devenir CTO' });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('DONNEES_INVALIDES');
    });

    it('should return 400 when targetRoles is empty', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, vision: null });

        const response = await request(app)
            .post('/vision')
            .send({ targetRoles: [] });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('DONNEES_INVALIDES');
    });
});

describe('PUT /vision', () => {
    it('should return 200 when updating a vision', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (prisma.userVision.findUnique as jest.Mock).mockResolvedValue(mockVision);
        (prisma.userVision.update as jest.Mock).mockResolvedValue({ ...mockVision, dreams: 'Nouveau rêve' });

        const response = await request(app)
            .put('/vision')
            .send({ dreams: 'Nouveau rêve' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
    });

    it('should return 404 when vision does not exist', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (prisma.userVision.findUnique as jest.Mock).mockResolvedValue(null);

        const response = await request(app).put('/vision').send({ dreams: 'Test' });

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('VISION_NON_TROUVEE');
    });
});

describe('DELETE /vision', () => {
    it('should return 200 when deleting a vision', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (prisma.userVision.findUnique as jest.Mock).mockResolvedValue(mockVision);
        (prisma.userVision.delete as jest.Mock).mockResolvedValue(mockVision);

        const response = await request(app).delete('/vision');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.message).toBe('Vision supprimée avec succès');
    });

    it('should return 404 when vision does not exist', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (prisma.userVision.findUnique as jest.Mock).mockResolvedValue(null);

        const response = await request(app).delete('/vision');

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('VISION_NON_TROUVEE');
    });
});
