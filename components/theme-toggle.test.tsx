import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./theme-toggle";

const mockUseSession = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    mockUseSession.mockReturnValue({ status: "unauthenticated" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }));
  });

  it("toggles the dark class and persists the choice to localStorage", async () => {
    document.documentElement.classList.add("dark");
    render(<ThemeToggle />);

    const button = await screen.findByRole("button", { name: /switch to light theme/i });
    await userEvent.click(button);

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /switch to dark theme/i })).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole("button", { name: /switch to dark theme/i }));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("does not sync to the server while unauthenticated", async () => {
    document.documentElement.classList.add("dark");
    render(<ThemeToggle />);
    await userEvent.click(await screen.findByRole("button", { name: /switch to light theme/i }));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("syncs the new theme to /api/settings for a logged-in user", async () => {
    mockUseSession.mockReturnValue({ status: "authenticated" });
    document.documentElement.classList.add("dark");
    render(<ThemeToggle />);
    await userEvent.click(await screen.findByRole("button", { name: /switch to light theme/i }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/settings",
        expect.objectContaining({ body: JSON.stringify({ theme: "light" }) }),
      ),
    );
  });
});
