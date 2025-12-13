import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
    res.json({
        message: 'AlternaGen API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
        },
    });
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 AlternaGen API running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

export default app;
