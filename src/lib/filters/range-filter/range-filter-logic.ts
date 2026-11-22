import type { PrecisionBand } from "./range-transforms";
import { roundRangeValue } from "./range-transforms";

// undefined means filter is disabled
export type RangeFilterValue = {
  min?: number;
  max?: number;
};

export interface RangeFilterConfig {
  min: number;
  max: number;
  step: number;
  precision: readonly PrecisionBand[];
}

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

export const updateLowerBound = (
  newMin: number,
  currentRange: Readonly<RangeFilterValue>,
  config: RangeFilterConfig,
): RangeFilterValue => ({
  ...currentRange,
  min: Math.min(
    Math.max(roundRangeValue(newMin, config.precision), config.min),
    getEffectiveMax(currentRange, config),
  ),
});

export const updateUpperBound = (
  newMax: number,
  currentRange: Readonly<RangeFilterValue>,
  config: RangeFilterConfig,
): RangeFilterValue => ({
  ...currentRange,
  max: Math.min(
    Math.max(
      roundRangeValue(newMax, config.precision),
      getEffectiveMin(currentRange, config),
    ),
    config.max,
  ),
});

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
