import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "./Header";

const mockUseSession = vi.fn();
const mockSignOut = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

describe("Header", () => {
  beforeEach(() => {
    mockSignOut.mockReset();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }));
  });

  it("shows Log in / Sign up when unauthenticated", () => {
    mockUseSession.mockReturnValue({ status: "unauthenticated", data: null });
    render(<Header />);

    expect(screen.getByRole("button", { name: "Log in" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("button", { name: "Sign up" })).toHaveAttribute("href", "/signup");
    expect(screen.queryByRole("button", { name: "Account menu" })).not.toBeInTheDocument();
  });

  it("shows a loading skeleton (not the guest or account controls) while session resolves", () => {
    mockUseSession.mockReturnValue({ status: "loading", data: null });
    render(<Header />);

    expect(screen.queryByRole("button", { name: "Log in" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Account menu" })).not.toBeInTheDocument();
  });

  it("shows the account menu with the user's name and initials when authenticated", async () => {
    mockUseSession.mockReturnValue({
      status: "authenticated",
      data: { user: { name: "Jane Doe", email: "jane@example.com", image: null } },
    });
    render(<Header />);

    expect(screen.queryByRole("button", { name: "Log in" })).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "Account menu" });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent("JD");

    await userEvent.click(trigger);
    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "History" })).toHaveAttribute("href", "/history");
    expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveAttribute("href", "/settings");
  });

  it("falls back to email initials when the user has no name", async () => {
    mockUseSession.mockReturnValue({
      status: "authenticated",
      data: { user: { name: null, email: "ab@example.com", image: null } },
    });
    render(<Header />);

    expect(screen.getByRole("button", { name: "Account menu" })).toHaveTextContent("AB");
  });

  it("signs out when the Sign out menu item is clicked", async () => {
    mockUseSession.mockReturnValue({
      status: "authenticated",
      data: { user: { name: "Jane Doe", email: "jane@example.com", image: null } },
    });
    render(<Header />);

    await userEvent.click(screen.getByRole("button", { name: "Account menu" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Sign out" }));

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/" });
  });
});
