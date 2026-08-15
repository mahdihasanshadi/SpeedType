import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(1).max(80).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const { email, password, name } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email, passwordHash, name } });

    return Response.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (err) {
    console.error("[signup]", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
