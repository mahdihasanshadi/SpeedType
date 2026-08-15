import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TypingTest } from "./TypingTest";

vi.mock("@/lib/texts/generate", () => ({
  generatePassage: () => "cat sat",
}));

function getInput() {
  return screen.getByLabelText("Typing test input");
}

function getCharSpans() {
  return Array.from(document.querySelectorAll('[data-slot="passage"] > span[data-state]'));
}

describe("TypingTest", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads a passage on mount with every character pending", () => {
    render(<TypingTest />);
    const chars = getCharSpans();
    expect(chars).toHaveLength("cat sat".length);
    expect(chars.every((c) => c.getAttribute("data-state") === "pending")).toBe(true);
  });

  it("typing the correct next character marks it correct and advances", () => {
    render(<TypingTest />);
    fireEvent.keyDown(getInput(), { key: "c" });

    expect(getCharSpans()[0]).toHaveAttribute("data-state", "correct");
  });

  it("typing the wrong character marks it incorrect", () => {
    render(<TypingTest />);
    fireEvent.keyDown(getInput(), { key: "x" });

    expect(getCharSpans()[0]).toHaveAttribute("data-state", "incorrect");
  });

  it("Backspace reverts the previous character to pending", () => {
    render(<TypingTest />);
    fireEvent.keyDown(getInput(), { key: "c" });
    fireEvent.keyDown(getInput(), { key: "Backspace" });

    expect(getCharSpans()[0]).toHaveAttribute("data-state", "pending");
  });

  it("Escape restarts with a fresh, all-pending passage", () => {
    render(<TypingTest />);
    fireEvent.keyDown(getInput(), { key: "c" });
    fireEvent.keyDown(getInput(), { key: "Escape" });

    expect(getCharSpans().every((c) => c.getAttribute("data-state") === "pending")).toBe(true);
  });

  it("completing a words-mode passage shows the finished results", () => {
    render(<TypingTest />);
    // Default mode is "time" (only ends via tick()) — switch to "words" so finishing the
    // passage itself ends the test.
    fireEvent.click(screen.getByRole("button", { name: "words" }));

    for (const char of "cat sat") {
      fireEvent.keyDown(getInput(), { key: char });
    }
    expect(screen.getByText("Next test")).toBeInTheDocument();
    expect(screen.getByText("accuracy")).toBeInTheDocument();
  });

  it("clicking a mode control regenerates the passage and stays idle", () => {
    render(<TypingTest />);
    fireEvent.click(screen.getByRole("button", { name: "words" }));

    expect(getCharSpans().every((c) => c.getAttribute("data-state") === "pending")).toBe(true);
  });
});
