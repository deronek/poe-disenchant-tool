import type { Item } from "@/lib/itemData";
import type { Column } from "@tanstack/react-table";

import {
  createLowerBoundLinearValue,
  createLowerBoundSliderValue,
} from "./price-transforms";

export type PriceFilterValue = {
  min: number;
  max?: number; // Optional for single bound filtering; "no upper bound" is represented as undefined
};

/**
 * Gets the current filter value from the table column
 */
export const getCurrentFilterValue = <TData extends Item>(
  column: Column<TData, unknown> | undefined,
): PriceFilterValue | undefined => {
  return column?.getFilterValue() as PriceFilterValue | undefined;
};

/**
 * Sets the filter value on the table column
 *
 * NOTE: We always pass a fresh object when setting the filter, to avoid any
 * stale/mutated reference issues from downstream code or table internals.
 */
export const setFilterValue = <TData extends Item>(
  column: Column<TData, unknown> | undefined,
  value: PriceFilterValue | undefined,
): void => {
  if (!column) return;

  if (value === undefined) {
    column.setFilterValue(undefined);
  } else {
    const next: PriceFilterValue = {
      min: value.min,
      max: value.max,
    };
    column.setFilterValue(next);
  }
};

/**
 * Creates a normalized filter value against defaults.
 *
 * Rules:
 * - "No upper bound" is stored as max: undefined.
 * - If the normalized state is effectively default (min at defaults.min and no upper bound),
 *   the filter is cleared (returns undefined).
 */
export const createNormalizedFilterValue = (
  range: PriceFilterValue,
  defaults: { min: number; max: number },
): PriceFilterValue | undefined => {
  const min = range.min ?? defaults.min;
  const rawMax = range.max;

  const max =
    rawMax === undefined || rawMax === defaults.max ? undefined : rawMax;

  if (min === defaults.min && max === undefined) {
    return undefined;
  }

  return { min, max };
};

/**
 * Gets the current price range with proper defaults
 *
 * Important behavior:
 * - If there is no filter, returns the default [min, max].
 * - If only min is set, returns [min, defaults.max] BUT this does NOT mean
 *   the upper bound filter is active. That distinction is handled by hasMaxFilter().
 * - If max is set to a custom value (not equal to defaults.max), it is treated
 *   as an active upper bound filter.
 */
export const getCurrentRange = <TData extends Item>(
  column: Column<TData, unknown> | undefined,
  defaults: { min: number; max: number },
): PriceFilterValue => {
  const filterValue = getCurrentFilterValue(column);

  if (!filterValue) {
    return {
      min: defaults.min,
      max: defaults.max,
    };
  }

  const min = filterValue.min ?? defaults.min;

  // IMPORTANT:
  // - If max is undefined => no active upper bound; expose defaults.max so UI can position the slider thumb at the end.
  // - If max equals defaults.max => we normalize it to "no upper bound" as well (for legacy values),
  //   again exposing defaults.max for UI.
  // - Otherwise use the concrete max.
  let effectiveMax: number;

  if (filterValue.max === undefined || filterValue.max === defaults.max) {
    effectiveMax = defaults.max;
  } else {
    effectiveMax = filterValue.max;
  }

  return {
    min,
    max: effectiveMax,
  };
};

/**
 * Updates the lower bound of the price range.
 * Ensures min does not exceed the effective max.
 */
export const updateLowerBound = (
  newMin: number,
  currentRange: PriceFilterValue,
  defaults: { max: number },
): PriceFilterValue => {
  const effectiveMax = currentRange.max ?? defaults.max;
  const min = Math.min(newMin, effectiveMax);

  return { ...currentRange, min };
};

/**
 * Updates the upper bound of the price range.
 *
 * - newMax >= defaults.max -> no upper bound (max: undefined)
 * - otherwise              -> max = newMax
 */
export const updateUpperBound = (
  newMax: number,
  currentRange: PriceFilterValue,
  defaults: { max: number },
): PriceFilterValue => {
  if (newMax >= defaults.max) {
    return { ...currentRange, max: undefined };
  }

  return { ...currentRange, max: newMax };
};

/**
 * Gets the effective maximum for lower bound calculations
 */
const getEffectiveMaxForLowerBound = <TData extends Item>(
  column: Column<TData, unknown> | undefined,
  defaults: { min: number; max: number },
): number => {
  const currentRange = getCurrentRange(column, defaults);
  return currentRange.max ?? defaults.max;
};

/**
 * Converts lower bound linear value to slider value
 */
export const getLowerBoundSliderValue = <TData extends Item>(
  column: Column<TData, unknown> | undefined,
  linearValue: number,
  defaults: { min: number; max: number },
): number => {
  const effectiveMax = getEffectiveMaxForLowerBound(column, defaults);
  return createLowerBoundSliderValue(linearValue, defaults.min, effectiveMax);
};

/**
 * Converts slider value to lower bound linear value
 */
export const getLowerBoundLinearValue = <TData extends Item>(
  column: Column<TData, unknown> | undefined,
  sliderValue: number,
  defaults: { min: number; max: number },
): number => {
  const effectiveMax = getEffectiveMaxForLowerBound(column, defaults);
  return createLowerBoundLinearValue(sliderValue, defaults.min, effectiveMax);
};

/**
 * Checks if there's an active filter applied.
 *
 * Uses the raw filter value, not the UI-effective range.
 */
export const hasActiveFilter = <TData extends Item>(
  column: Column<TData, unknown> | undefined,
  defaults: { min: number; max: number },
): boolean => {
  const filterValue = getCurrentFilterValue(column);
  if (!filterValue) return false;

  const hasMin =
    filterValue.min !== undefined && filterValue.min !== defaults.min;
  const hasMax =
    filterValue.max !== undefined && filterValue.max !== defaults.max;

  return hasMin || hasMax;
};

/**
 * Resets the filter to default state
 */
export const resetFilter = <TData extends Item>(
  column: Column<TData, unknown> | undefined,
): void => {
  setFilterValue(column, undefined);
};

/**
 * Checks if the lower bound filter is active.
 *
 * Interprets min strictly vs defaults.min.
 */
export const hasMinFilter = (
  range: PriceFilterValue,
  defaults: { min: number },
): boolean => {
  return range.min !== undefined && range.min !== defaults.min;
};

/**
 * Checks if the upper bound filter is active.
 *
 * IMPORTANT:
 * - max: undefined => no upper bound.
 * - max equal to defaults.max => treated as "no upper bound".
 */
export const hasMaxFilter = (
  range: PriceFilterValue,
  defaults: { max: number },
): boolean => {
  if (range.max === undefined) return false;
  return range.max !== defaults.max;
};
