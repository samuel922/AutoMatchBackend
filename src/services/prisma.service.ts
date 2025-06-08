import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

// Optional: Add middleware or extensions
prisma.$use(async (params, next) => {
  // Add your Prisma middleware here if needed
  return next(params);
});

export { prisma };