import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/utils/database';

describe('GET /health', () => {
    it('should return 200 and database status', async () => {
        // Mock prisma $queryRaw if needed, but here we test the real flow
        const response = await request(app).get('/health');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'ok');
        expect(response.body).toHaveProperty('database');
    });
});
