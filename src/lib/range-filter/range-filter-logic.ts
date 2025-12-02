import type { Item } from "@/lib/itemData";
import type { Column, Row } from "@tanstack/react-table";

import {
  createLowerBoundLinearValue,
  createLowerBoundSliderValue,
} from "./range-transforms";

// undefined means filter is disabled
export type RangeFilterValue = {
  min?: number;
  max?: number;
};

/**
 * Gets the current filter value from the table column
 */
export const getCurrentFilterValue = <TData extends Item>(
  column: Column<TData, unknown> | undefined,
): RangeFilterValue => {
  const value = column?.getFilterValue() as RangeFilterValue | undefined;
  if (value === undefined)
    return {
      min: undefined,
      max: undefined,
    };
  else return value;
};

/**
 * Sets the filter value on the table column.
 */
export const setFilterValue = <TData extends Item>(
  column: Column<TData, unknown> | undefined,
  value: RangeFilterValue | undefined,
): void => {
  if (!column) return;
  column.setFilterValue(value);
};

/**
 * Creates a normalized filter value against defaults.
 */
export const createNormalizedFilterValue = (
  range: RangeFilterValue,
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
 * Updates the lower bound of the price range.
 * Ensures min does not exceed the effective max.
 */
export const updateLowerBound = (
  newMin: number,
  currentRange: RangeFilterValue,
  defaults: { max: number },
): RangeFilterValue => {
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
  currentRange: RangeFilterValue,
  defaults: { max: number },
): RangeFilterValue => {
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
  const currentRange = getCurrentFilterValue(column);
  return currentRange.max ?? defaults.max;
};

/**
 * Converts lower bound linear value to slider value
 */
export const getLowerBoundSliderValue = <TData extends Item>(
  column: Column<TData, unknown> | undefined,
  linearValue: number | undefined,
  defaults: { min: number; max: number },
): number => {
  const value = linearValue ?? defaults.min;
  const effectiveMax = getEffectiveMaxForLowerBound(column, defaults);
  return createLowerBoundSliderValue(value, defaults.min, effectiveMax);
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
 * Resets the filter to default state
 */
export const resetFilter = <TData extends Item>(
  column: Column<TData, unknown> | undefined,
): void => {
  setFilterValue(column, undefined);
};

/**
 * Checks if the lower bound filter is active.
 */
export const hasMinFilter = (range: RangeFilterValue): boolean => {
  return range.min !== undefined;
};

/**
 * Checks if the upper bound filter is active.
 */
export const hasMaxFilter = (range: RangeFilterValue): boolean => {
  return range.max !== undefined;
};

export const rangeFilterFn = (
  row: Row<Item>,
  columnId: string,
  filterValue: RangeFilterValue,
) => {
  if (!filterValue) return true;

  const value = row.getValue(columnId) as number;
  const minCheck = filterValue.min === undefined || value >= filterValue.min;
  const maxCheck = filterValue.max === undefined || value <= filterValue.max;

  return minCheck && maxCheck;
};
