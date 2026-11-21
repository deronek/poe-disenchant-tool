/**
 * Utility functions for range value transformations and scaling.
 * Slider positions run from 0 to 100. A non-positive minimum has no log
 * scale, so it collapses to the track start.
 */

/** Share of the slider track reserved for values below 1. */
const SUB_UNIT_SLIDER_SHARE = 10;

/** True when a range spans 1, so the scale reserves a slice for sub-1 values. */
export const hasSubUnitRange = (min: number, max: number): boolean =>
  min < 1 && max > 1;

/**
 * Fractional scale: the first SUB_UNIT_SLIDER_SHARE percent of the track
 * covers min..1, the rest covers 1..max logarithmically. Ranges entirely
 * above or below 1 fall back to a plain log scale.
 */
export const linearToFractionalSlider = (
  linearValue: number,
  min: number,
  max: number,
): number => {
  if (min <= 0 || max <= min) return 0;
  if (linearValue <= min) return 0;
  if (linearValue >= max) return 100;

  const subUnitRange = hasSubUnitRange(min, max);
  if (subUnitRange && linearValue <= 1) {
    return (
      (SUB_UNIT_SLIDER_SHARE * Math.log(linearValue / min)) / Math.log(1 / min)
    );
  }

  const base = subUnitRange ? 1 : min;
  const start = subUnitRange ? SUB_UNIT_SLIDER_SHARE : 0;

  return (
    start +
    ((100 - start) * Math.log(linearValue / base)) / Math.log(max / base)
  );
};

/** Converts a fractional slider position back to a linear value. */
export const fractionalSliderToLinear = (
  sliderValue: number,
  min: number,
  max: number,
): number => {
  if (min <= 0 || max <= min) return min;
  if (sliderValue <= 0) return min;
  if (sliderValue >= 100) return max;

  const subUnitRange = hasSubUnitRange(min, max);
  if (subUnitRange && sliderValue <= SUB_UNIT_SLIDER_SHARE) {
    return min * (1 / min) ** (sliderValue / SUB_UNIT_SLIDER_SHARE);
  }

  const base = subUnitRange ? 1 : min;
  const start = subUnitRange ? SUB_UNIT_SLIDER_SHARE : 0;

  return base * (max / base) ** ((sliderValue - start) / (100 - start));
};

/** Decimal places to apply below an exclusive threshold; checked in order. */
export interface PrecisionBand {
  below: number;
  decimals: number;
}

/** Decimal places the scale offers at a given value. */
const decimalsForValue = (
  value: number,
  precision: readonly PrecisionBand[],
): number => precision.find((band) => value < band.below)?.decimals ?? 0;

/** Rounds a bound to its band's precision, or to whole numbers without one. */
export const roundRangeValue = (
  value: number,
  precision: readonly PrecisionBand[],
): number => Number(value.toFixed(decimalsForValue(value, precision)));

/** Finest step the bands or the configured step offer. */
const finestStep = (
  precision: readonly PrecisionBand[],
  step: number,
): number =>
  precision.reduce(
    (finest, band) => Math.min(finest, 10 ** -band.decimals),
    step,
  );

/**
 * Step size for keyboard changes at a given value. Stepping down probes just
 * below the value so a bound on a band edge uses the finer step.
 */
export const getRangeStep = (
  value: number,
  precision: readonly PrecisionBand[],
  step: number,
  direction: "up" | "down" = "up",
): number => {
  const decimals = decimalsForValue(
    direction === "down" ? value - finestStep(precision, step) : value,
    precision,
  );

  return decimals === 0 ? step : 10 ** -decimals;
};
