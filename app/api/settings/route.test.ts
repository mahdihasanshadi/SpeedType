// @vitest-environment node
import { describe, it, expect, vi, afterAll } from "vitest";
import { GET, POST } from "./route";
import { prisma } from "@/lib/prisma";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const email = `settings-route-${Date.now()}@example.test`;
let userId: string;

function postRequest(body: unknown) {
  return new Request("http://localhost/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET/POST /api/settings", () => {
  afterAll(async () => {
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("GET rejects an unauthenticated request with 401", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("POST rejects an unauthenticated request with 401", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await POST(postRequest({ mode: "time" }));
    expect(res.status).toBe(401);
  });

  it("GET returns sensible defaults when no row exists yet", async () => {
    const user = await prisma.user.create({ data: { email } });
    userId = user.id;
    mockAuth.mockResolvedValueOnce({ user: { id: userId } });

    const res = await GET();
    const body = await res.json();
    expect(body).toMatchObject({ mode: "time", duration: 30, punctuation: false, numbers: false, theme: "dark" });
  });

  it("POST creates the row on first save (upsert)", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: userId } });
    const res = await POST(
      postRequest({ mode: "words", duration: 50, punctuation: true, numbers: false }),
    );
    expect(res.status).toBe(200);

    mockAuth.mockResolvedValueOnce({ user: { id: userId } });
    const getRes = await GET();
    const body = await getRes.json();
    expect(body.mode).toBe("words");
    expect(body.duration).toBe(50); // dual-purpose column: word count for words mode
    expect(body.punctuation).toBe(true);
  });

  it("POST accepts a partial update (e.g. theme only) without clobbering other fields", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: userId } });
    await POST(postRequest({ theme: "light" }));

    mockAuth.mockResolvedValueOnce({ user: { id: userId } });
    const res = await GET();
    const body = await res.json();
    expect(body.theme).toBe("light");
    expect(body.mode).toBe("words"); // untouched by the theme-only update
  });

  it("POST rejects an invalid mode with 400", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: userId } });
    const res = await POST(postRequest({ mode: "not-a-mode" }));
    expect(res.status).toBe(400);
  });
});
