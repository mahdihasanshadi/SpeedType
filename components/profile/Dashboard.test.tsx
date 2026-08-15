import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Dashboard } from "./Dashboard";

function mockSummary(summary: object) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(summary) }),
  );
}

describe("Dashboard", () => {
  it("renders real values once the summary loads", async () => {
    mockSummary({
      personalBestWpm: 88,
      avgWpm: 65.4,
      avgAccuracy: 96.789,
      totalTests: 12,
      currentStreak: 3,
    });
    render(<Dashboard />);

    expect(await screen.findByText("88")).toBeInTheDocument();
    expect(screen.getByText("65")).toBeInTheDocument(); // avgWpm rounded
    expect(screen.getByText("96.8%")).toBeInTheDocument(); // avgAccuracy to 1 decimal
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows an em dash for null personal-best/average when there are no tests yet", async () => {
    mockSummary({
      personalBestWpm: null,
      avgWpm: null,
      avgAccuracy: null,
      totalTests: 0,
      currentStreak: 0,
    });
    render(<Dashboard />);

    const dashes = await screen.findAllByText("—");
    expect(dashes).toHaveLength(3); // personal best, avg wpm, avg accuracy
  });

  it("stays on the skeleton instead of crashing if the fetch fails (e.g. a 401 error shape)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: "Unauthorized" }) }),
    );
    const { container } = render(<Dashboard />);

    // Give the failed fetch's .then chain a tick to resolve, then confirm no crash / no tiles.
    await new Promise((r) => setTimeout(r, 0));
    expect(container.querySelector("[aria-hidden]")).toBeInTheDocument();
    expect(screen.queryByText("personal best")).not.toBeInTheDocument();
  });
});
