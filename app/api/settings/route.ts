import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULTS = { mode: "time", duration: 30, punctuation: false, numbers: false, theme: "dark" };

// UserSettings.duration is dual-purpose — seconds in time mode, word count in words mode — same
// convention as TypingTest.target. There's no separate wordCount column; the client maps its own
// `duration`/`wordCount` split onto this one field based on `mode` before sending it here.
const settingsSchema = z
  .object({
    mode: z.enum(["time", "words"]),
    duration: z.number().int().positive(),
    punctuation: z.boolean(),
    numbers: z.boolean(),
    theme: z.enum(["dark", "light"]),
  })
  .partial(); // every field optional — the ThemeToggle syncs just {theme}, the settings page sends the rest.

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await prisma.userSettings.findUnique({ where: { userId: session.user.id } });
    return Response.json(settings ?? DEFAULTS);
  } catch (err) {
    console.error("[settings]", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...DEFAULTS, ...parsed.data },
      update: parsed.data,
    });
    return Response.json(settings);
  } catch (err) {
    console.error("[settings]", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
