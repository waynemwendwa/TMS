import { PrismaClient } from '@prisma/client';

declare global {
  var process: {
    env: {
      NODE_ENV?: string;
      [key: string]: string | undefined;
    };
  };
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
	globalForPrisma.prisma ?? new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
