import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

// Prisma 7 requires an explicit driver adapter — `new PrismaClient()` with no args throws.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Neon's pooler silently drops idle connections; recycle ours first so pg.Pool never hands
    // out a dead client (surfaces as "Connection terminated unexpectedly" otherwise).
    keepAlive: true,
    idleTimeoutMillis: 10_000,
    max: 10,
  });

// An idle client erroring in the background is an unhandled event by default and can crash the
// process — always have a listener, even if it just logs.
pool.on("error", (err) => {
  console.error("[pg pool] unexpected error on idle client", err);
});

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter: new PrismaPg(pool) });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pool;
}
