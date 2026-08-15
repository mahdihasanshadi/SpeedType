import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./theme-toggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
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
});
