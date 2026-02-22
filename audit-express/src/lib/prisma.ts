import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL environment variable is required in production');
    }
    console.warn('[prisma] DATABASE_URL not set, using local dev fallback');
  }
  const adapter = new PrismaPg({
    connectionString: databaseUrl ?? 'postgresql://user:password@localhost:5432/audit_express',
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
