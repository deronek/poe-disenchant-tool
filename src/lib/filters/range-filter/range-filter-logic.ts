import {
  fractionalSliderToLinear,
  hasSubUnitRange,
  linearToFractionalSlider,
} from "./range-transforms";

// undefined means filter is disabled
export type RangeFilterValue = {
  min?: number;
  max?: number;
};

export const EMPTY_RANGE: Readonly<RangeFilterValue> = Object.freeze({
  min: undefined,
  max: undefined,
});

/**
 * Minimal row surface rangeFilterFn needs from TanStack's Row.
 */
interface RowWithValue {
  getValue: (columnId: string) => unknown;
}

/**
 * Creates a normalized filter value against defaults.
 */
export const createNormalizedFilterValue = (
  range: Readonly<RangeFilterValue>,
  defaults: { min: number; max: number },
): RangeFilterValue | undefined => {
  const rawMin = range.min;
  const rawMax = range.max;

  const min =
    rawMin === undefined || rawMin === defaults.min ? undefined : rawMin;

  const max =
    rawMax === undefined || rawMax === defaults.max ? undefined : rawMax;

  if (min === undefined && max === undefined) {
    return undefined;
  }

  return { min, max };
};

/**
 * Active lower bound, clamped into the configured range so persisted values
 * outside it still produce a usable control.
 */
export const getEffectiveMin = (
  currentRange: Readonly<RangeFilterValue>,
  defaults: { min: number; max: number },
): number =>
  Math.min(
    Math.max(currentRange.min ?? defaults.min, defaults.min),
    defaults.max,
  );

/**
 * Active upper bound, clamped into the configured range so persisted values
 * outside it still produce a usable control.
 */
export const getEffectiveMax = (
  currentRange: Readonly<RangeFilterValue>,
  defaults: { min: number; max: number },
): number =>
  Math.min(
    Math.max(currentRange.max ?? defaults.max, defaults.min),
    defaults.max,
  );

/**
 * Converts the current range's lower bound to its slider position. The
 * fractional scale falls back to a plain log scale when the range doesn't
 * span 1, so it serves every filter config.
 */
export const getLowerBoundSliderValue = (
  currentRange: Readonly<RangeFilterValue>,
  defaults: { min: number; max: number },
): number => {
  const value = getEffectiveMin(currentRange, defaults);
  const max = getEffectiveMax(currentRange, defaults);

  return linearToFractionalSlider(value, defaults.min, max);
};

/**
 * Converts slider value to lower bound linear value
 */
export const getLowerBoundLinearValue = (
  currentRange: Readonly<RangeFilterValue>,
  sliderValue: number,
  defaults: { min: number; max: number },
): number => {
  const max = getEffectiveMax(currentRange, defaults);

  return fractionalSliderToLinear(sliderValue, defaults.min, max);
};

/** Converts the current upper bound to its slider position. */
export const getUpperBoundSliderValue = (
  currentRange: Readonly<RangeFilterValue>,
  defaults: { min: number; max: number },
): number => {
  const min = getEffectiveMin(currentRange, defaults);
  const value = getEffectiveMax(currentRange, defaults);

  return hasSubUnitRange(defaults.min, defaults.max)
    ? linearToFractionalSlider(value, min, defaults.max)
    : value;
};

/** Converts an upper-bound slider position back to a linear value. */
export const getUpperBoundLinearValue = (
  currentRange: Readonly<RangeFilterValue>,
  sliderValue: number,
  defaults: { min: number; max: number },
): number => {
  const min = getEffectiveMin(currentRange, defaults);

  return hasSubUnitRange(defaults.min, defaults.max)
    ? fractionalSliderToLinear(sliderValue, min, defaults.max)
    : sliderValue;
};

/**
 * Checks if the lower bound filter is active.
 */
export const hasMinFilter = (
  range: Readonly<RangeFilterValue>,
): range is Readonly<RangeFilterValue> & { min: number } => {
  return range.min !== undefined;
};

/**
 * Checks if the upper bound filter is active.
 */
export const hasMaxFilter = (
  range: Readonly<RangeFilterValue>,
): range is Readonly<RangeFilterValue> & { max: number } => {
  return range.max !== undefined;
};

export const rangeFilterFn = (
  row: RowWithValue,
  columnId: string,
  filterValue: RangeFilterValue,
) => {
  if (!filterValue) return true;

  const value = row.getValue(columnId) as number;
  const minCheck = filterValue.min === undefined || value >= filterValue.min;
  const maxCheck = filterValue.max === undefined || value <= filterValue.max;

  return minCheck && maxCheck;
};
