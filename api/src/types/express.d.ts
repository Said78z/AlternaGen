import { User, Subscription } from '@prisma/client';

declare global {
    namespace Express {
        interface Request {
            clerkId?: string;
            userId?: string;
            user?: User & { subscription?: Subscription | null };
        }
    }
}
