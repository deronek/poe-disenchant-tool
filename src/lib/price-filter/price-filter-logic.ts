import type { Column } from "@tanstack/react-table";
import type { Item } from "@/lib/itemData";
import {
  createLowerBoundSliderValue,
  createLowerBoundLinearValue,
} from "./price-transforms";

export type PriceFilterValue = {
  min: number;
  max?: number; // Optional for single bound filtering
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
 */
export const setFilterValue = <TData extends Item>(
  column: Column<TData, unknown> | undefined,
  value: PriceFilterValue | undefined,
): void => {
  column?.setFilterValue(value);
};

/**
 * Creates a normalized filter value, clearing the filter if it matches defaults
 */
export const createNormalizedFilterValue = (
  range: PriceFilterValue,
  defaults: { min: number; max: number },
): PriceFilterValue | undefined => {
  const { min, max } = range;

  // Clear filter if range equals defaults
  if (min === defaults.min && (max === undefined || max === defaults.max)) {
    return undefined;
  }

  return {
    min,
    max,
  };
};

/**
 * Gets the current price range with proper defaults
 */
export const getCurrentRange = <TData extends Item>(
  column: Column<TData, unknown> | undefined,
  defaults: { min: number; max: number },
): PriceFilterValue => {
  const filterValue = getCurrentFilterValue(column);
  const min = filterValue?.min ?? defaults.min;
  const max = filterValue?.max ?? defaults.max;

  return {
    min,
    max,
  };
};

/**
 * Updates the lower bound of the price range
 */
export const updateLowerBound = (
  newMin: number,
  currentRange: PriceFilterValue,
  defaults: { max: number },
): PriceFilterValue => {
  const constrainedMin = Math.min(newMin, currentRange.max ?? defaults.max);

  return {
    ...currentRange,
    min: constrainedMin,
  };
};

/**
 * Updates the upper bound of the price range
 */
export const updateUpperBound = (
  newMax: number,
  currentRange: PriceFilterValue,
  defaults: { max: number },
): PriceFilterValue => {
  return {
    ...currentRange,
    max: newMax === defaults.max ? undefined : newMax,
  };
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
 * Checks if there's an active filter applied
 */
export const hasActiveFilter = <TData extends Item>(
  column: Column<TData, unknown> | undefined,
  defaults: { min: number; max: number },
): boolean => {
  const filterValue = getCurrentFilterValue(column);
  if (!filterValue) return false;

  return (
    filterValue.min !== defaults.min ||
    (filterValue.max !== undefined && filterValue.max !== defaults.max)
  );
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
 * Checks if the lower bound filter is active
 */
export const hasMinFilter = (
  range: PriceFilterValue,
  defaults: { min: number },
): boolean => {
  return range.min !== defaults.min;
};

/**
 * Checks if the upper bound filter is active
 */
export const hasMaxFilter = (
  range: PriceFilterValue,
  defaults: { max: number },
): boolean => {
  return range.max !== undefined && range.max !== defaults.max;
};
