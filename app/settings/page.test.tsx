import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "./page";
import { getLocalSettings } from "@/lib/local-settings";

const mockUseSession = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }));
  });

  it("guest: changing a setting persists it to local storage immediately, no Save button", async () => {
    mockUseSession.mockReturnValue({ status: "unauthenticated" });
    render(<SettingsPage />);

    await userEvent.click(await screen.findByRole("button", { name: "words" }));

    expect(getLocalSettings().mode).toBe("words");
    expect(screen.queryByRole("button", { name: /^save$/i })).not.toBeInTheDocument();
  });

  it("logged-in: changing a setting also POSTs to /api/settings in the background", async () => {
    mockUseSession.mockReturnValue({ status: "authenticated" });
    render(<SettingsPage />);
    await screen.findByRole("button", { name: "words" });

    await userEvent.click(screen.getByRole("button", { name: "@ punctuation" }));

    await waitFor(() => {
      const postCall = (fetch as ReturnType<typeof vi.fn>).mock.calls.find(
        (c) => c[0] === "/api/settings" && c[1]?.method === "POST",
      );
      expect(postCall).toBeDefined();
      expect(JSON.parse(postCall![1].body)).toMatchObject({ punctuation: true });
    });
  });

  it("guest: does not call the settings API at all", async () => {
    mockUseSession.mockReturnValue({ status: "unauthenticated" });
    render(<SettingsPage />);
    await userEvent.click(await screen.findByRole("button", { name: "words" }));

    const postCall = (fetch as ReturnType<typeof vi.fn>).mock.calls.find((c) => c[0] === "/api/settings");
    expect(postCall).toBeUndefined();
  });
});
