// @vitest-environment node
import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";

describe("Prisma schema — 001_auth, 002_typing_tests, 003_user_settings", () => {
  const email = `schema-test-${Date.now()}@example.test`;
  let userId: string;

  afterAll(async () => {
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("creates a User with a passwordHash (Credentials-provider shape)", async () => {
    const user = await prisma.user.create({
      data: { email, passwordHash: "hashed-not-real" },
    });
    userId = user.id;
    expect(user.email).toBe(email);
    expect(user.passwordHash).toBe("hashed-not-real");
  });

  it("creates and reads back UserSettings 1:1 with the user", async () => {
    await prisma.userSettings.create({
      data: { userId, mode: "words", duration: 50 },
    });
    const settings = await prisma.userSettings.findUniqueOrThrow({ where: { userId } });
    expect(settings.mode).toBe("words");
    expect(settings.duration).toBe(50);
    expect(settings.theme).toBe("dark"); // default
  });

  it("creates a TypingTest and computes charStats as JSON", async () => {
    const test = await prisma.typingTest.create({
      data: {
        userId,
        mode: "time",
        target: 30,
        netWpm: 72.4,
        rawWpm: 78.1,
        accuracy: 96.5,
        consistency: 88.2,
        charStats: { correct: 180, incorrect: 6, extra: 1, missed: 0 },
      },
    });
    expect(test.userId).toBe(userId);
    expect(test.charStats).toEqual({ correct: 180, incorrect: 6, extra: 1, missed: 0 });
  });

  it("cascades UserSettings + TypingTest deletion when the User is deleted", async () => {
    await prisma.user.delete({ where: { id: userId } });
    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    const tests = await prisma.typingTest.findMany({ where: { userId } });
    expect(settings).toBeNull();
    expect(tests).toHaveLength(0);
    userId = ""; // already deleted, skip afterAll cleanup
  });
});
