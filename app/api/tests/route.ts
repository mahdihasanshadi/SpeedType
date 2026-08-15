import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const charStatsSchema = z.object({
  correct: z.number().int().nonnegative(),
  incorrect: z.number().int().nonnegative(),
  extra: z.number().int().nonnegative(),
  missed: z.number().int().nonnegative(),
});

const saveTestSchema = z.object({
  mode: z.enum(["time", "words"]),
  target: z.number().int().positive(),
  netWpm: z.number().nonnegative(),
  rawWpm: z.number().nonnegative(),
  accuracy: z.number().min(0).max(100),
  consistency: z.number().min(0).max(100),
  charStats: charStatsSchema,
  punctuation: z.boolean(),
  numbers: z.boolean(),
});

const PAGE_SIZE = 20;
const FREE_TIER_RETENTION_DAYS = 90;

// Every user is free-tier for now (Subscription doesn't exist until Phase 2) — the retention
// window applies to everyone. Premium unlimited retention lands with the Phase 2 subscription
// feature, per database-schema.md's retention note (hides old rows from the query, never deletes).
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const retentionCutoff = new Date(Date.now() - FREE_TIER_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const rows = await prisma.typingTest.findMany({
      where: { userId: session.user.id, createdAt: { gte: retentionCutoff } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE + 1,
      select: { id: true, mode: true, target: true, netWpm: true, accuracy: true, createdAt: true },
    });

    const hasMore = rows.length > PAGE_SIZE;
    return Response.json({ tests: rows.slice(0, PAGE_SIZE), page, pageSize: PAGE_SIZE, hasMore });
  } catch (err) {
    console.error("[tests]", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = saveTestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const test = await prisma.typingTest.create({
      data: { userId: session.user.id, ...parsed.data },
    });

    return Response.json({ id: test.id }, { status: 201 });
  } catch (err) {
    console.error("[tests]", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
