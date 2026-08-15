import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateStreak } from "@/lib/streak";

const FREE_TIER_RETENTION_DAYS = 90;

// Powers the profile/dashboard tiles — personal best, all-time (within retention) averages,
// total test count, and current day-streak. Kept as its own route rather than folded into
// GET /api/tests since the response shape (aggregates, not a list) is entirely different.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - FREE_TIER_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const where = { userId: session.user.id, createdAt: { gte: cutoff } };

    const [aggregate, dateRows] = await Promise.all([
      prisma.typingTest.aggregate({
        where,
        _max: { netWpm: true },
        _avg: { netWpm: true, accuracy: true },
        _count: true,
      }),
      prisma.typingTest.findMany({ where, select: { createdAt: true } }),
    ]);

    return Response.json({
      personalBestWpm: aggregate._max.netWpm,
      avgWpm: aggregate._avg.netWpm,
      avgAccuracy: aggregate._avg.accuracy,
      totalTests: aggregate._count,
      currentStreak: calculateStreak(dateRows.map((r) => r.createdAt)),
    });
  } catch (err) {
    console.error("[tests/summary]", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
