// @vitest-environment node
import { describe, it, expect, vi, afterAll } from "vitest";
import { POST } from "./route";
import { prisma } from "@/lib/prisma";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const email = `tests-import-route-${Date.now()}@example.test`;
let userId: string;

function postRequest(body: unknown) {
  return new Request("http://localhost/api/tests/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function guestTest(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    mode: "time",
    target: 30,
    netWpm: 60,
    rawWpm: 65,
    accuracy: 95,
    consistency: 90,
    charStats: { correct: 100, incorrect: 5, extra: 0, missed: 0 },
    punctuation: false,
    numbers: false,
    createdAt: "2026-06-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("POST /api/tests/import", () => {
  afterAll(async () => {
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("rejects an unauthenticated request with 401", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await POST(postRequest([guestTest()]));
    expect(res.status).toBe(401);
  });

  it("rejects an empty array with 400", async () => {
    const user = await prisma.user.create({ data: { email } });
    userId = user.id;
    mockAuth.mockResolvedValueOnce({ user: { id: userId } });

    const res = await POST(postRequest([]));
    expect(res.status).toBe(400);
  });

  it("rejects more than 20 tests with 400", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: userId } });
    const res = await POST(postRequest(Array.from({ length: 21 }, () => guestTest())));
    expect(res.status).toBe(400);
  });

  it("rejects an invalid date with 400", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: userId } });
    const res = await POST(postRequest([guestTest({ createdAt: "not-a-date" })]));
    expect(res.status).toBe(400);
  });

  it("imports tests, preserving each test's original createdAt", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: userId } });
    const res = await POST(
      postRequest([
        guestTest({ netWpm: 50, createdAt: "2026-05-01T00:00:00.000Z" }),
        guestTest({ netWpm: 60, createdAt: "2026-05-02T00:00:00.000Z" }),
        guestTest({ netWpm: 70, createdAt: "2026-05-03T00:00:00.000Z" }),
      ]),
    );
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.imported).toBe(3);

    const saved = await prisma.typingTest.findMany({ where: { userId }, orderBy: { netWpm: "asc" } });
    expect(saved).toHaveLength(3);
    expect(saved[0].createdAt.toISOString()).toBe("2026-05-01T00:00:00.000Z");
    expect(saved[2].createdAt.toISOString()).toBe("2026-05-03T00:00:00.000Z");
  });
});
