// @vitest-environment node
import { describe, it, expect, vi, afterAll } from "vitest";
import { GET } from "./route";
import { prisma } from "@/lib/prisma";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const email = `tests-summary-route-${Date.now()}@example.test`;
let userId: string;

const basePayload = {
  mode: "time" as const,
  target: 30,
  accuracy: 95,
  consistency: 90,
  charStats: { correct: 100, incorrect: 5, extra: 0, missed: 0 },
  punctuation: false,
  numbers: false,
};

function getRequest() {
  return new Request("http://localhost/api/tests/summary");
}

describe("GET /api/tests/summary", () => {
  afterAll(async () => {
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("rejects an unauthenticated request with 401", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns nulls and zero counts with no tests", async () => {
    const user = await prisma.user.create({ data: { email } });
    userId = user.id;
    mockAuth.mockResolvedValueOnce({ user: { id: userId } });

    const res = await GET();
    const body = await res.json();

    expect(body.personalBestWpm).toBeNull();
    expect(body.avgWpm).toBeNull();
    expect(body.totalTests).toBe(0);
    expect(body.currentStreak).toBe(0);
  });

  it("computes personal best, averages, and total count from real rows", async () => {
    await prisma.typingTest.createMany({
      data: [
        { ...basePayload, userId, netWpm: 50, rawWpm: 55, createdAt: new Date() },
        { ...basePayload, userId, netWpm: 80, rawWpm: 85, createdAt: new Date() }, // new personal best
        { ...basePayload, userId, netWpm: 60, rawWpm: 65, createdAt: new Date() },
      ],
    });

    mockAuth.mockResolvedValueOnce({ user: { id: userId } });
    const res = await GET();
    const body = await res.json();

    expect(body.personalBestWpm).toBe(80);
    expect(body.avgWpm).toBeCloseTo((50 + 80 + 60) / 3, 5);
    expect(body.totalTests).toBe(3);
    expect(body.currentStreak).toBe(1); // all three are "today"
  });
});
