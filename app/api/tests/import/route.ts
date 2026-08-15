import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const charStatsSchema = z.object({
  correct: z.number().int().nonnegative(),
  incorrect: z.number().int().nonnegative(),
  extra: z.number().int().nonnegative(),
  missed: z.number().int().nonnegative(),
});

const importTestSchema = z.object({
  mode: z.enum(["time", "words"]),
  target: z.number().int().positive(),
  netWpm: z.number().nonnegative(),
  rawWpm: z.number().nonnegative(),
  accuracy: z.number().min(0).max(100),
  consistency: z.number().min(0).max(100),
  charStats: charStatsSchema,
  punctuation: z.boolean(),
  numbers: z.boolean(),
  // Preserve the original test time (when it was actually taken as a guest), not "now" — this
  // keeps the imported points honest on the speed curve instead of bunching them at import time.
  createdAt: z.string().refine((v) => !Number.isNaN(new Date(v).getTime()), "Invalid date"),
});

// Matches lib/guest-tests.ts's own cap — never trust the client to have actually respected it.
const importSchema = z.array(importTestSchema).min(1).max(20);

// Guest -> account migration, see ux-flows.md Flow 4. Credentials/OAuth sign-in never creates a
// user by itself (that's /api/auth/signup or the OAuth callback) — this route only ever attaches
// tests to the session's own account, called once right after a session becomes authenticated.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await req.json();
    const parsed = importSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const rows = parsed.data.map(({ createdAt, ...rest }) => ({
      ...rest,
      userId,
      createdAt: new Date(createdAt),
    }));

    const result = await prisma.typingTest.createMany({ data: rows });
    return Response.json({ imported: result.count }, { status: 201 });
  } catch (err) {
    console.error("[tests/import]", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
