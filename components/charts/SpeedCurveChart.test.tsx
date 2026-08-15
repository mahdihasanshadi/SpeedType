import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpeedCurveChart } from "./SpeedCurveChart";

function mockFetchOnce(tests: Array<{ netWpm: number; createdAt: string }>) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ tests, page: 1, pageSize: 200, hasMore: false }),
    }),
  );
}

describe("SpeedCurveChart", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the empty state when there are no tests in range", async () => {
    mockFetchOnce([]);
    render(<SpeedCurveChart />);
    expect(await screen.findByText(/no tests in this range yet/i)).toBeInTheDocument();
  });

  it("fetches with the default filters (all modes, 30 days) on mount", async () => {
    mockFetchOnce([]);
    render(<SpeedCurveChart />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    const url = new URL((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0], "http://x");
    expect(url.searchParams.get("mode")).toBeNull(); // "all" omits the mode param
    expect(url.searchParams.get("range")).toBe("30");
  });

  it("clicking a mode filter re-fetches with that mode", async () => {
    mockFetchOnce([]);
    render(<SpeedCurveChart />);
    await screen.findByText(/no tests in this range yet/i);

    await userEvent.click(screen.getByRole("button", { name: "words" }));

    await waitFor(() => {
      const lastCall = (fetch as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0];
      const url = new URL(lastCall, "http://x");
      expect(url.searchParams.get("mode")).toBe("words");
    });
  });

  it("clicking a range filter re-fetches with that range", async () => {
    mockFetchOnce([]);
    render(<SpeedCurveChart />);
    await screen.findByText(/no tests in this range yet/i);

    await userEvent.click(screen.getByRole("button", { name: "7d" }));

    await waitFor(() => {
      const lastCall = (fetch as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0];
      const url = new URL(lastCall, "http://x");
      expect(url.searchParams.get("range")).toBe("7");
    });
  });

  it("renders the chart container once data resolves", async () => {
    mockFetchOnce([
      { netWpm: 50, createdAt: "2026-01-01T00:00:00.000Z" },
      { netWpm: 60, createdAt: "2026-01-02T00:00:00.000Z" },
    ]);
    const { container } = render(<SpeedCurveChart />);
    await waitFor(() => {
      expect(container.querySelector(".recharts-responsive-container")).toBeInTheDocument();
    });
  });
});
