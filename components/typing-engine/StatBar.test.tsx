import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatBar } from "./StatBar";

describe("StatBar", () => {
  it("shows seconds remaining in time mode, clamped at 0", () => {
    const now = Date.now();
    render(
      <StatBar
        status="running"
        startedAt={now - 25_000}
        keystrokeCount={20}
        mode="time"
        target={30}
        passage="whatever text is here"
        currentIndex={5}
      />,
    );
    // 30s target - 25s elapsed = ~5s remaining
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("sec")).toBeInTheDocument();
  });

  it("shows words remaining in words mode", () => {
    render(
      <StatBar
        status="running"
        startedAt={Date.now()}
        keystrokeCount={0}
        mode="words"
        target={5}
        passage="one two three four five"
        currentIndex={4} // typed "one " (4 chars), 4 words remain
      />,
    );
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("words")).toBeInTheDocument();
  });

  it("is invisible (opacity 0) while idle", () => {
    const { container } = render(
      <StatBar
        status="idle"
        startedAt={null}
        keystrokeCount={0}
        mode="time"
        target={30}
        passage="text"
        currentIndex={0}
      />,
    );
    expect(container.firstChild).toHaveStyle({ opacity: "0" });
  });
});
