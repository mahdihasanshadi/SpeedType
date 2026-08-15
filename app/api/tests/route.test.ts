// @vitest-environment node
import { describe, it, expect, vi, afterAll } from "vitest";
import { GET, POST } from "./route";
import { prisma } from "@/lib/prisma";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const email = `tests-route-${Date.now()}@example.test`;
let userId: string;

function postRequest(body: unknown) {
  return new Request("http://localhost/api/tests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validPayload = {
  mode: "time" as const,
  target: 30,
  netWpm: 72.4,
  rawWpm: 78.1,
  accuracy: 96.5,
  consistency: 88.2,
  charStats: { correct: 180, incorrect: 6, extra: 0, missed: 0 },
  punctuation: false,
  numbers: false,
};

describe("POST /api/tests", () => {
  afterAll(async () => {
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    // No $disconnect here — the GET describe below runs afterwards in the same file and needs
    // the client alive; disconnecting is left to that block's own afterAll.
  });

  it("rejects an unauthenticated request with 401", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await POST(postRequest(validPayload));
    expect(res.status).toBe(401);
  });

  it("rejects an invalid payload with 400", async () => {
    const user = await prisma.user.create({ data: { email } });
    userId = user.id;
    mockAuth.mockResolvedValueOnce({ user: { id: userId } });

    const res = await POST(postRequest({ ...validPayload, accuracy: 150 }));
    expect(res.status).toBe(400);
  });

  it("saves a valid test for the authenticated user", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: userId } });
    const res = await POST(postRequest(validPayload));
    expect(res.status).toBe(201);

    const saved = await prisma.typingTest.findMany({ where: { userId } });
    expect(saved).toHaveLength(1);
    expect(saved[0].netWpm).toBe(72.4);
    expect(saved[0].charStats).toEqual(validPayload.charStats);
  });
});

function getRequest(url: string) {
  return new Request(url);
}

describe("GET /api/tests", () => {
  const getEmail = `tests-get-route-${Date.now()}@example.test`;
  let getUserId: string;

  afterAll(async () => {
    if (getUserId) await prisma.user.deleteMany({ where: { id: getUserId } });
    await prisma.$disconnect();
  });

  it("rejects an unauthenticated request with 401", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await GET(getRequest("http://localhost/api/tests"));
    expect(res.status).toBe(401);
  });

  it("returns tests newest-first, excludes rows older than 90 days, and paginates", async () => {
    const user = await prisma.user.create({ data: { email: getEmail } });
    getUserId = user.id;

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    // 3 recent tests (netWpm 1, 2, 3 in creation order) + 1 test 100 days old (outside the
    // 90-day free-tier retention window).
    for (const [i, netWpm] of [1, 2, 3].entries()) {
      await prisma.typingTest.create({
        data: {
          ...validPayload,
          netWpm,
          userId: getUserId,
          createdAt: new Date(now - (3 - i) * 1000),
        },
      });
    }
    await prisma.typingTest.create({
      data: { ...validPayload, netWpm: 999, userId: getUserId, createdAt: new Date(now - 100 * DAY) },
    });

    mockAuth.mockResolvedValueOnce({ user: { id: getUserId } });
    const res = await GET(getRequest("http://localhost/api/tests?page=1"));
    const body = await res.json();

    expect(body.tests.map((t: { netWpm: number }) => t.netWpm)).toEqual([3, 2, 1]);
    expect(body.tests.some((t: { netWpm: number }) => t.netWpm === 999)).toBe(false);
    expect(body.hasMore).toBe(false);
  });

  it("filters by mode", async () => {
    await prisma.typingTest.create({
      data: { ...validPayload, mode: "words", netWpm: 42, userId: getUserId },
    });

    mockAuth.mockResolvedValueOnce({ user: { id: getUserId } });
    const res = await GET(getRequest("http://localhost/api/tests?mode=words"));
    const body = await res.json();

    expect(body.tests.every((t: { mode: string }) => t.mode === "words")).toBe(true);
    expect(body.tests.some((t: { netWpm: number }) => t.netWpm === 42)).toBe(true);
  });

  it("a `range` narrower than the retention window excludes older rows within the window", async () => {
    const DAY = 24 * 60 * 60 * 1000;
    await prisma.typingTest.create({
      data: {
        ...validPayload,
        netWpm: 777,
        userId: getUserId,
        createdAt: new Date(Date.now() - 15 * DAY), // within 90-day retention, outside a 7d range
      },
    });

    mockAuth.mockResolvedValueOnce({ user: { id: getUserId } });
    const res = await GET(getRequest("http://localhost/api/tests?range=7&pageSize=200"));
    const body = await res.json();

    expect(body.tests.some((t: { netWpm: number }) => t.netWpm === 777)).toBe(false);
  });

  it("caps pageSize at 200 even if a larger value is requested", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: getUserId } });
    const res = await GET(getRequest("http://localhost/api/tests?pageSize=9999"));
    const body = await res.json();
    expect(body.pageSize).toBe(200);
  });
});
