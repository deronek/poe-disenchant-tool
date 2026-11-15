/**
 * Utility functions for range value transformations and scaling.
 * Slider positions run from 0 to 100.
 */

/** Share of the slider track reserved for values below 1. */
const SUB_UNIT_SLIDER_SHARE = 10;

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
  if (linearValue <= min || max <= min) return 0;

  const hasSubUnitRange = min < 1 && max > 1;
  if (hasSubUnitRange && linearValue <= 1) {
    return (
      (SUB_UNIT_SLIDER_SHARE * Math.log(linearValue / min)) / Math.log(1 / min)
    );
  }

  const base = hasSubUnitRange ? 1 : min;
  const start = hasSubUnitRange ? SUB_UNIT_SLIDER_SHARE : 0;

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
  if (max <= min) return min;
  if (sliderValue <= 0) return min;

  const hasSubUnitRange = min < 1 && max > 1;
  if (hasSubUnitRange && sliderValue <= SUB_UNIT_SLIDER_SHARE) {
    return min * (1 / min) ** (sliderValue / SUB_UNIT_SLIDER_SHARE);
  }

  const base = hasSubUnitRange ? 1 : min;
  const start = hasSubUnitRange ? SUB_UNIT_SLIDER_SHARE : 0;

  return base * (max / base) ** ((sliderValue - start) / (100 - start));
};

/** Decimal places the scale offers at a given value. */
const decimalsForValue = (value: number, precision: number): number => {
  if (value >= 1) return 0;

  return value >= 0.1 ? Math.min(1, precision) : precision;
};

/**
 * Rounds a bound to the precision the scale offers at that magnitude: whole
 * units at 1 and above, one decimal from 0.1, full precision below that.
 */
export const roundRangeValue = (value: number, precision: number): number =>
  Number(value.toFixed(decimalsForValue(value, precision)));

/** Step size for keyboard changes at a given value. */
export const getRangeStep = (
  value: number,
  precision: number,
  step: number,
): number => {
  const decimals = decimalsForValue(value, precision);

  return decimals === 0 ? step : 10 ** -decimals;
};
