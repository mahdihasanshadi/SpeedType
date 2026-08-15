import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Results } from "./Results";
import type { TestResult } from "@/store/typing-store";

const result: TestResult = {
  mode: "time",
  target: 30,
  netWpm: 72.4,
  rawWpm: 78.1,
  accuracy: 96.5,
  consistency: 88.2,
  charStats: { correct: 180, incorrect: 6, extra: 1, missed: 3 },
};

describe("Results", () => {
  it("shows Net WPM rounded as the headline, and the other stats", () => {
    render(<Results result={result} onNextTest={() => {}} />);
    expect(screen.getByText("72")).toBeInTheDocument(); // net wpm, rounded
    expect(screen.getByText("78")).toBeInTheDocument(); // raw wpm, rounded
    expect(screen.getByText("96.5%")).toBeInTheDocument();
    expect(screen.getByText("88.2%")).toBeInTheDocument();
  });

  it("shows the full correct/incorrect/extra/missed breakdown", () => {
    render(<Results result={result} onNextTest={() => {}} />);
    expect(screen.getByText("180")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("calls onNextTest when the button is clicked", async () => {
    const onNextTest = vi.fn();
    render(<Results result={result} onNextTest={onNextTest} />);
    await userEvent.click(screen.getByText("Next test"));
    expect(onNextTest).toHaveBeenCalledOnce();
  });
});
