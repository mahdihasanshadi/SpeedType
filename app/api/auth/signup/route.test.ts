// @vitest-environment node
import { describe, it, expect, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import { POST } from "./route";
import { prisma } from "@/lib/prisma";

const email = `signup-route-test-${Date.now()}@example.test`;

function postRequest(body: unknown) {
  return new Request("http://localhost/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/signup", () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("creates a user with a bcrypt passwordHash, never the plaintext password", async () => {
    const res = await POST(postRequest({ email, password: "supersecret1" }));
    expect(res.status).toBe(201);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.passwordHash).not.toBe("supersecret1");
    expect(await bcrypt.compare("supersecret1", user.passwordHash!)).toBe(true);
  });

  it("rejects a duplicate email with 409", async () => {
    const res = await POST(postRequest({ email, password: "anotherpassword2" }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/already exists/i);
  });

  it("rejects an invalid email with 400", async () => {
    const res = await POST(postRequest({ email: "not-an-email", password: "supersecret1" }));
    expect(res.status).toBe(400);
  });

  it("rejects a password shorter than 8 characters with 400", async () => {
    const res = await POST(postRequest({ email: "someone-else@example.test", password: "short" }));
    expect(res.status).toBe(400);
  });
});
