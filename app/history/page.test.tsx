import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GuestHistory, AuthedHistory } from "./page";
import { saveGuestTest } from "@/lib/guest-tests";

function makeTest(netWpm: number) {
  return {
    mode: "time" as const,
    target: 30,
    netWpm,
    rawWpm: netWpm,
    accuracy: 95,
    consistency: 90,
    charStats: { correct: 100, incorrect: 5, extra: 0, missed: 0 },
    punctuation: false,
    numbers: false,
  };
}

describe("GuestHistory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows an empty state with no saved tests", async () => {
    render(<GuestHistory />);
    expect(await screen.findByText(/no tests yet/i)).toBeInTheDocument();
  });

  it("lists saved guest tests and shows the sign-up nudge", async () => {
    saveGuestTest(makeTest(55));
    saveGuestTest(makeTest(60));
    render(<GuestHistory />);

    expect(await screen.findByText("60 wpm")).toBeInTheDocument();
    expect(screen.getByText("55 wpm")).toBeInTheDocument();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });
});

describe("AuthedHistory", () => {
  beforeEach(() => {
    // AuthedHistory renders Dashboard and SpeedCurveChart alongside the list, each hitting a
    // different endpoint — the mock has to branch on URL rather than return one fixed shape.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/tests/summary")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                personalBestWpm: 70,
                avgWpm: 70,
                avgAccuracy: 97,
                totalTests: 1,
                currentStreak: 1,
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              tests: [
                { id: "1", mode: "time", target: 30, netWpm: 70, accuracy: 97, createdAt: new Date().toISOString() },
              ],
              page: 1,
              pageSize: 20,
              hasMore: true,
            }),
        });
      }),
    );
  });

  it("fetches and displays tests from the API", async () => {
    render(<AuthedHistory />);
    expect(await screen.findByText("70 wpm")).toBeInTheDocument();
  });

  it("Next is enabled when hasMore is true, Previous disabled on page 1", async () => {
    render(<AuthedHistory />);
    await screen.findByText("70 wpm");
    expect(screen.getByText("Previous")).toBeDisabled();
    expect(screen.getByText("Next")).not.toBeDisabled();
  });

  it("clicking Next fetches page 2", async () => {
    render(<AuthedHistory />);
    await screen.findByText("70 wpm");
    await userEvent.click(screen.getByText("Next"));

    await waitFor(() => {
      expect(fetch).toHaveBeenLastCalledWith("/api/tests?page=2");
    });
  });
});
