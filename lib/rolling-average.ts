/** Rolling average over the last `window` values ending at each index — shrinks gracefully for
 * the first few points instead of returning null/NaN, so the smoothed line is defined everywhere
 * the raw line is. Used by SpeedCurveChart for the rolling 10-test average. */
export function rollingAverage(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    return slice.reduce((sum, v) => sum + v, 0) / slice.length;
  });
}
