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

// GET (paginated history) lands with the Test history page feature — this route only saves for now.
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
