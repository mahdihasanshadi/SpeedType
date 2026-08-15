import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModeControls } from "./ModeControls";

const baseProps = {
  faded: false,
  mode: "time" as const,
  duration: 30,
  wordCount: 25,
  punctuation: false,
  numbers: false,
};

describe("ModeControls", () => {
  it("shows duration pills in time mode and word-count pills in words mode", () => {
    const { rerender } = render(<ModeControls {...baseProps} onChange={() => {}} />);
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.queryByText("100")).not.toBeInTheDocument();

    rerender(<ModeControls {...baseProps} mode="words" onChange={() => {}} />);
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.queryByText("120")).not.toBeInTheDocument();
  });

  it("calls onChange with the toggled value when punctuation is clicked", async () => {
    const onChange = vi.fn();
    render(<ModeControls {...baseProps} onChange={onChange} />);
    await userEvent.click(screen.getByText("@ punctuation"));
    expect(onChange).toHaveBeenCalledWith({ punctuation: true });
  });

  it("calls onChange with the selected duration", async () => {
    const onChange = vi.fn();
    render(<ModeControls {...baseProps} onChange={onChange} />);
    await userEvent.click(screen.getByText("60"));
    expect(onChange).toHaveBeenCalledWith({ duration: 60 });
  });

  it("switching mode calls onChange with the new mode", async () => {
    const onChange = vi.fn();
    render(<ModeControls {...baseProps} onChange={onChange} />);
    await userEvent.click(screen.getByText("words"));
    expect(onChange).toHaveBeenCalledWith({ mode: "words" });
  });
});
