import { describe, expect, it } from "vitest";

import {
  createNormalizedFilterValue,
  fractionalSliderToLinear,
  getEffectiveMax,
  getEffectiveMin,
  getRangeStep,
  linearToFractionalSlider,
  rangeFilterFn,
  roundRangeValue,
} from "@/lib/filters";

const FRACTIONAL_BOUNDS = { min: 0.01, max: 500 };
const PRICE_PRECISION = [
  { below: 0.1, decimals: 2 },
  { below: 1, decimals: 1 },
];

describe("range filter scales", () => {
  it("keeps sub-1 values in a small slice of the slider", () => {
    expect(
      linearToFractionalSlider(1, FRACTIONAL_BOUNDS.min, FRACTIONAL_BOUNDS.max),
    ).toBe(10);
    expect(
      linearToFractionalSlider(5, FRACTIONAL_BOUNDS.min, FRACTIONAL_BOUNDS.max),
    ).toBeGreaterThan(30);
    expect(
      linearToFractionalSlider(
        50,
        FRACTIONAL_BOUNDS.min,
        FRACTIONAL_BOUNDS.max,
      ),
    ).toBeGreaterThan(
      linearToFractionalSlider(5, FRACTIONAL_BOUNDS.min, FRACTIONAL_BOUNDS.max),
    );
    expect(
      linearToFractionalSlider(
        200,
        FRACTIONAL_BOUNDS.min,
        FRACTIONAL_BOUNDS.max,
      ),
    ).toBeLessThan(100);
  });

  it("keeps distinct slider positions for fractional values", () => {
    const positions = [0.01, 0.02, 0.1].map((value) =>
      linearToFractionalSlider(
        value,
        FRACTIONAL_BOUNDS.min,
        FRACTIONAL_BOUNDS.max,
      ),
    );

    expect(positions[0]).toBe(0);
    expect(positions[1]).toBeGreaterThan(0);
    expect(positions[1]).toBeLessThan(positions[2]);
  });

  it("round-trips slider positions back to values", () => {
    for (const value of [0.01, 0.02, 0.1, 1, 5, 10, 50, 200, 500]) {
      const position = linearToFractionalSlider(
        value,
        FRACTIONAL_BOUNDS.min,
        FRACTIONAL_BOUNDS.max,
      );
      const roundTripped = fractionalSliderToLinear(
        position,
        FRACTIONAL_BOUNDS.min,
        FRACTIONAL_BOUNDS.max,
      );

      expect(roundTripped).toBeCloseTo(value, 6);
    }
  });

  it("rounds to the precision of the matching band", () => {
    expect(roundRangeValue(0.094, PRICE_PRECISION)).toBe(0.09);
    expect(roundRangeValue(0.633, PRICE_PRECISION)).toBe(0.6);
    expect(roundRangeValue(65.8, PRICE_PRECISION)).toBe(66);
    expect(roundRangeValue(2.4, [])).toBe(2);
  });

  it("steps keyboard changes by the precision of the matching band", () => {
    expect(getRangeStep(0.05, PRICE_PRECISION, 1)).toBe(0.01);
    expect(getRangeStep(0.5, PRICE_PRECISION, 1)).toBe(0.1);
    expect(getRangeStep(5, PRICE_PRECISION, 1)).toBe(1);
    expect(getRangeStep(2_000, [], 50_000)).toBe(50_000);
  });

  it("steps down from a band edge by the finer step", () => {
    expect(getRangeStep(1, PRICE_PRECISION, 1, "down")).toBe(0.1);
    expect(getRangeStep(0.1, PRICE_PRECISION, 1, "down")).toBe(0.01);
  });

  it("keeps stored sub-1 filters active", () => {
    expect(
      createNormalizedFilterValue({ min: 0.01 }, FRACTIONAL_BOUNDS),
    ).toBeUndefined();
    expect(
      createNormalizedFilterValue({ min: 0.02 }, FRACTIONAL_BOUNDS),
    ).toEqual({
      min: 0.02,
    });
    expect(
      createNormalizedFilterValue({ max: 0.1 }, FRACTIONAL_BOUNDS),
    ).toEqual({
      max: 0.1,
    });
  });

  it("clamps persisted bounds into the configured range", () => {
    expect(getEffectiveMin({ min: 0 }, FRACTIONAL_BOUNDS)).toBe(0.01);
    expect(getEffectiveMin({ min: 900 }, FRACTIONAL_BOUNDS)).toBe(500);
    expect(getEffectiveMax({ max: 0 }, FRACTIONAL_BOUNDS)).toBe(0.01);
    expect(getEffectiveMax({ max: 900 }, FRACTIONAL_BOUNDS)).toBe(500);
  });

  it("filters fractional values", () => {
    const row = { getValue: () => 0.02 };

    expect(rangeFilterFn(row, "value", { min: 0.02 })).toBe(true);
    expect(rangeFilterFn(row, "value", { min: 0.03 })).toBe(false);
    expect(rangeFilterFn(row, "value", { max: 0.01 })).toBe(false);
  });
});
