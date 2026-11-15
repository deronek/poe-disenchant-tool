import {
  fractionalSliderToLinear,
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
 * Updates the lower bound of the range.
 * Ensures min does not exceed the effective max.
 */
export const updateLowerBound = (
  newMin: number,
  currentRange: Readonly<RangeFilterValue>,
  defaults: { max: number },
): RangeFilterValue => {
  const effectiveMax = currentRange.max ?? defaults.max;
  const min = Math.min(newMin, effectiveMax);

  return { ...currentRange, min };
};

/**
 * Updates the upper bound of the range.
 *
 * - newMax >= defaults.max -> no upper bound (max: undefined)
 * - otherwise              -> max = newMax
 */
export const updateUpperBound = (
  newMax: number,
  currentRange: Readonly<RangeFilterValue>,
  defaults: { max: number },
): RangeFilterValue => {
  if (newMax >= defaults.max) {
    return { ...currentRange, max: undefined };
  }

  return { ...currentRange, max: newMax };
};

/**
 * Active lower bound, clamped to the configured minimum so persisted values
 * below the slider range still produce a usable control.
 */
export const getEffectiveMin = (
  currentRange: Readonly<RangeFilterValue>,
  defaults: { min: number },
): number => Math.max(currentRange.min ?? defaults.min, defaults.min);

/**
 * Active upper bound, clamped to the configured minimum so persisted values
 * below the slider range still produce a usable control.
 */
export const getEffectiveMax = (
  currentRange: Readonly<RangeFilterValue>,
  defaults: { min: number; max: number },
): number => Math.max(currentRange.max ?? defaults.max, defaults.min);

/**
 * Converts the current range's lower bound to its slider position. The
 * fractional scale falls back to a plain log scale when the range doesn't
 * span 1, so it serves every filter config.
 */
export const getLowerBoundSliderValue = (
  currentRange: Readonly<RangeFilterValue>,
  defaults: { min: number; max: number },
): number => {
  const value = currentRange.min ?? defaults.min;
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
