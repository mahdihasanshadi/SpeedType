import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

// Prisma 7 requires an explicit driver adapter — `new PrismaClient()` with no args throws.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

const pool =
  globalForPrisma.pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL });

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter: new PrismaPg(pool) });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pool;
}
