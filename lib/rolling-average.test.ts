import { describe, it, expect } from "vitest";
import { rollingAverage } from "./rolling-average";

describe("rollingAverage", () => {
  it("shrinks the window for the first few points instead of returning null", () => {
    // window=2: [1], [1,2], [2,3], [3,4] -> 1, 1.5, 2.5, 3.5
    expect(rollingAverage([1, 2, 3, 4], 2)).toEqual([1, 1.5, 2.5, 3.5]);
  });

  it("uses a full window once enough points exist", () => {
    // window=3 starting at index 3: values[1..3] = [2,3,4] -> avg 3
    expect(rollingAverage([1, 2, 3, 4], 3)[3]).toBe(3);
  });

  it("returns an empty array for empty input", () => {
    expect(rollingAverage([], 10)).toEqual([]);
  });

  it("with a window of 1, returns the input unchanged", () => {
    expect(rollingAverage([5, 10, 15], 1)).toEqual([5, 10, 15]);
  });
});
