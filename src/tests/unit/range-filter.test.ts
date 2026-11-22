import { describe, expect, it } from "vitest";

import {
  createNormalizedFilterValue,
  getRangeSliders,
  rangeFilterFn,
  updateLowerBound,
  updateUpperBound,
} from "@/lib/filters";
import {
  fractionalSliderToLinear,
  getRangeKeyboardDelta,
  linearToFractionalSlider,
  roundRangeValue,
} from "@/lib/filters/range-filter/range-transforms";

const FRACTIONAL_BOUNDS = { min: 0.01, max: 500 };
const PRICE_PRECISION = [
  { below: 0.1, decimals: 2 },
  { below: 1, decimals: 1 },
];
const PRICE_CONFIG = {
  ...FRACTIONAL_BOUNDS,
  step: 1,
  precision: PRICE_PRECISION,
};
const DUST_CONFIG = {
  min: 2_000,
  max: 5_000_000,
  step: 50_000,
  precision: [],
};

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
    expect(
      getRangeKeyboardDelta("ArrowRight", 0.05, PRICE_PRECISION, 1, false),
    ).toBe(0.01);
    expect(
      getRangeKeyboardDelta("ArrowRight", 0.5, PRICE_PRECISION, 1, false),
    ).toBe(0.1);
    expect(
      getRangeKeyboardDelta("ArrowRight", 5, PRICE_PRECISION, 1, false),
    ).toBe(1);
    expect(getRangeKeyboardDelta("ArrowRight", 2_000, [], 50_000, false)).toBe(
      50_000,
    );
  });

  it("steps down from a band edge by the finer step", () => {
    expect(
      getRangeKeyboardDelta("ArrowLeft", 1, PRICE_PRECISION, 1, false),
    ).toBe(-0.1);
    expect(
      getRangeKeyboardDelta("ArrowLeft", 0.1, PRICE_PRECISION, 1, false),
    ).toBe(-0.01);
  });

  it("handles large keyboard steps and leaves other keys to Radix", () => {
    expect(
      getRangeKeyboardDelta("ArrowRight", 0.5, PRICE_PRECISION, 1, true),
    ).toBe(1);
    expect(
      getRangeKeyboardDelta("PageDown", 0.5, PRICE_PRECISION, 1, false),
    ).toBe(-1);
    expect(
      getRangeKeyboardDelta("Home", 0.5, PRICE_PRECISION, 1, false),
    ).toBeUndefined();
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

  it("clamps updated bounds into the configured range", () => {
    expect(updateLowerBound(0, {}, PRICE_CONFIG)).toEqual({ min: 0.01 });
    expect(updateLowerBound(900, {}, PRICE_CONFIG)).toEqual({ min: 500 });
    expect(updateUpperBound(0, {}, PRICE_CONFIG)).toEqual({ max: 0.01 });
    expect(updateUpperBound(900, {}, PRICE_CONFIG)).toEqual({ max: 500 });
    expect(getRangeSliders({ max: 900 }, PRICE_CONFIG).upper.value).toBe(100);
    expect(getRangeSliders({ max: 0 }, DUST_CONFIG).upper.value).toBe(2_000);
  });

  it("keeps rounded bounds within each other", () => {
    expect(
      updateUpperBound(0.2, { min: 0.24, max: 0.3 }, PRICE_CONFIG),
    ).toEqual({ min: 0.24, max: 0.24 });
    expect(
      updateLowerBound(0.3, { min: 0.2, max: 0.26 }, PRICE_CONFIG),
    ).toEqual({ min: 0.26, max: 0.26 });
  });

  it("keeps an unlimited upper bound at the top of a collapsed scale", () => {
    expect(getRangeSliders({ min: 500 }, PRICE_CONFIG).upper.value).toBe(100);
  });

  it("filters fractional values", () => {
    const row = { getValue: () => 0.02 };

    expect(rangeFilterFn(row, "value", { min: 0.02 })).toBe(true);
    expect(rangeFilterFn(row, "value", { min: 0.03 })).toBe(false);
    expect(rangeFilterFn(row, "value", { max: 0.01 })).toBe(false);
  });
});
