import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Passage } from "./Passage";

function getCharSpans(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[data-slot="passage"] > span[data-state]'));
}

describe("Passage", () => {
  it("renders each character with its matching data-state", () => {
    const { container } = render(
      <Passage passage="cat" charStates={["correct", "incorrect", "pending"]} currentIndex={2} />,
    );

    const chars = getCharSpans(container);
    expect(chars.map((c) => c.textContent)).toEqual(["c", "a", "t"]);
    expect(chars[0]).toHaveAttribute("data-state", "correct");
    expect(chars[1]).toHaveAttribute("data-state", "incorrect");
    expect(chars[2]).toHaveAttribute("data-state", "pending");
  });

  it("applies the correct/incorrect/pending color classes", () => {
    const { container } = render(
      <Passage passage="ab" charStates={["correct", "incorrect"]} currentIndex={2} />,
    );

    const chars = getCharSpans(container);
    expect(chars[0].className).toContain("text-type-correct");
    expect(chars[1].className).toContain("text-type-incorrect");
  });
});
