import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { GuestMigration } from "./guest-migration";
import { saveGuestTest, getGuestTests } from "@/lib/guest-tests";

const mockUseSession = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}));

const mockToastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: { success: (...args: unknown[]) => mockToastSuccess(...args) },
}));

function makeGuestTest(netWpm: number) {
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

describe("GuestMigration", () => {
  beforeEach(() => {
    localStorage.clear();
    mockToastSuccess.mockClear();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("does nothing while unauthenticated", () => {
    mockUseSession.mockReturnValue({ status: "unauthenticated" });
    saveGuestTest(makeGuestTest(50));
    render(<GuestMigration />);

    expect(fetch).not.toHaveBeenCalled();
    expect(getGuestTests()).toHaveLength(1); // untouched
  });

  it("does nothing when there are no guest tests to migrate", () => {
    mockUseSession.mockReturnValue({ status: "authenticated" });
    render(<GuestMigration />);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("imports guest tests, clears local storage, and shows the exact-count toast", async () => {
    saveGuestTest(makeGuestTest(50));
    saveGuestTest(makeGuestTest(60));
    saveGuestTest(makeGuestTest(70));

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ imported: 3 }) }),
    );
    mockUseSession.mockReturnValue({ status: "authenticated" });
    render(<GuestMigration />);

    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/tests/import", expect.any(Object)));
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith("Imported 3 tests from this device."));
    expect(getGuestTests()).toHaveLength(0);
  });

  it("uses singular phrasing for exactly one imported test", async () => {
    saveGuestTest(makeGuestTest(50));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ imported: 1 }) }),
    );
    mockUseSession.mockReturnValue({ status: "authenticated" });
    render(<GuestMigration />);

    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith("Imported 1 test from this device."),
    );
  });

  it("leaves local storage intact if the import request fails", async () => {
    saveGuestTest(makeGuestTest(50));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) }));
    mockUseSession.mockReturnValue({ status: "authenticated" });
    render(<GuestMigration />);

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));
    expect(getGuestTests()).toHaveLength(1);
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });
});
