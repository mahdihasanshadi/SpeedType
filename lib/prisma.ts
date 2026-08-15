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
    // Neon's pooler silently drops idle connections. `idleTimeoutMillis` alone isn't enough —
    // 10s is pg's own default and Neon can drop faster than that, so the client-side recycle
    // never wins the race. `keepAliveInitialDelayMillis` is what actually matters: it makes the
    // OS send TCP keepalive probes soon after a connection goes idle instead of following the
    // (often multi-minute) OS default, which is what was letting Neon's proxy kill the socket
    // out from under us between requests (reproduced live — see infrastructure.md).
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
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
