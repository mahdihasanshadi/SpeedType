// @vitest-environment node
import { describe, it, expect, vi, afterAll } from "vitest";
import { POST } from "./route";
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
    await prisma.$disconnect();
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
