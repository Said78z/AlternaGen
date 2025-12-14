import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { prisma } from './utils/database';
import metrics from './utils/metrics';

// Import routes
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import profilesRoutes from './routes/profiles.routes';
import jobsRoutes from './routes/jobs.routes';
import matchRoutes from './routes/match.routes';
import applicationsRoutes from './routes/applications.routes';
import aiRoutes from './routes/ai.routes';
import stripeRoutes from './routes/stripe.routes';
import agentRoutes from './routes/agent.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        process.env.EXTENSION_URL || 'chrome-extension://*',
    ],
    credentials: true,
};

app.use(cors(corsOptions));

// Request ID middleware (must be first)
app.use(requestIdMiddleware);

// Body parsing middleware
// Note: /auth/webhook uses raw body, so it's handled in its route
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint with DB connectivity
app.get('/health', async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: 'connected'
        });
    } catch (error) {
        logger.error({ error }, 'Health check failed');
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            database: 'disconnected'
        });
    }
});

// Metrics endpoint
app.get('/metrics', (_req, res) => {
    res.json({
        timestamp: new Date().toISOString(),
        metrics: metrics.getAll()
    });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
    res.json({
        message: 'AlternaGen API V1',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: '/auth',
            users: '/users',
            profiles: '/profiles',
            jobs: '/jobs',
            match: '/match',
            applications: '/applications',
            ai: '/ai',
            stripe: '/stripe',
        },
    });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/profiles', profilesRoutes);
app.use('/jobs', jobsRoutes);
app.use('/match', matchRoutes);
app.use('/applications', applicationsRoutes);
app.use('/ai', aiRoutes);
app.use('/stripe', stripeRoutes);
app.use('/agent', agentRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    logger.info(`🚀 AlternaGen API running on port ${PORT}`);
    logger.info(`📍 Health check: http://localhost:${PORT}/health`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
