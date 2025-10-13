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

export type PriceRange = {
  min: number;
  max?: number;
};

export type PriceFilterContext<TData extends Item> = {
  column: Column<TData, unknown> | undefined;
  min: number;
  max: number;
};

/**
 * Gets the current filter value from the table column
 */
export const getCurrentFilterValue = <TData extends Item>(
  context: PriceFilterContext<TData>,
): PriceFilterValue | undefined => {
  return context.column?.getFilterValue() as PriceFilterValue | undefined;
};

/**
 * Sets the filter value on the table column
 */
export const setFilterValue = <TData extends Item>(
  context: PriceFilterContext<TData>,
  value: PriceFilterValue | undefined,
): void => {
  context.column?.setFilterValue(value);
};

/**
 * Creates a normalized filter value, clearing the filter if it matches defaults
 */
export const createNormalizedFilterValue = <TData extends Item>(
  context: PriceFilterContext<TData>,
  range: PriceRange,
): PriceFilterValue | undefined => {
  const { min, max } = range;

  // Clear filter if range equals defaults
  if (min === context.min && (max === undefined || max === context.max)) {
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
  context: PriceFilterContext<TData>,
): PriceRange => {
  const filterValue = getCurrentFilterValue(context);
  const min = filterValue?.min ?? context.min;
  const max = filterValue?.max ?? context.max;

  return {
    min,
    max,
  };
};

/**
 * Updates the lower bound of the price range
 */
export const updateLowerBound = <TData extends Item>(
  context: PriceFilterContext<TData>,
  newMin: number,
  currentRange: PriceRange,
): PriceRange => {
  const constrainedMin = Math.min(newMin, currentRange.max ?? context.max);

  return {
    ...currentRange,
    min: constrainedMin,
  };
};

/**
 * Updates the upper bound of the price range
 */
export const updateUpperBound = <TData extends Item>(
  context: PriceFilterContext<TData>,
  newMax: number,
  currentRange: PriceRange,
): PriceRange => {
  return {
    ...currentRange,
    max: newMax === context.max ? undefined : newMax,
  };
};

/**
 * Gets the effective maximum for lower bound calculations
 */
const getEffectiveMaxForLowerBound = <TData extends Item>(
  context: PriceFilterContext<TData>,
): number => {
  const currentRange = getCurrentRange(context);
  return currentRange.max ?? context.max;
};

/**
 * Converts lower bound linear value to slider value
 */
export const getLowerBoundSliderValue = <TData extends Item>(
  context: PriceFilterContext<TData>,
  linearValue: number,
): number => {
  const effectiveMax = getEffectiveMaxForLowerBound(context);
  return createLowerBoundSliderValue(linearValue, context.min, effectiveMax);
};

/**
 * Converts slider value to lower bound linear value
 */
export const getLowerBoundLinearValue = <TData extends Item>(
  context: PriceFilterContext<TData>,
  sliderValue: number,
): number => {
  const effectiveMax = getEffectiveMaxForLowerBound(context);
  return createLowerBoundLinearValue(sliderValue, context.min, effectiveMax);
};

/**
 * Checks if there's an active filter applied
 */
export const hasActiveFilter = <TData extends Item>(
  context: PriceFilterContext<TData>,
): boolean => {
  const filterValue = getCurrentFilterValue(context);
  if (!filterValue) return false;

  return (
    filterValue.min !== context.min ||
    (filterValue.max !== undefined && filterValue.max !== context.max)
  );
};

/**
 * Resets the filter to default state
 */
export const resetFilter = <TData extends Item>(
  context: PriceFilterContext<TData>,
): void => {
  setFilterValue(context, undefined);
};

/**
 * Utility functions to derive filter state from PriceRange
 */

/**
 * Checks if the lower bound filter is active
 */
export const hasMinFilter = <TData extends Item>(
  context: PriceFilterContext<TData>,
  range: PriceRange,
): boolean => {
  return range.min !== context.min;
};

/**
 * Checks if the upper bound filter is active
 */
export const hasMaxFilter = <TData extends Item>(
  context: PriceFilterContext<TData>,
  range: PriceRange,
): boolean => {
  return range.max !== undefined && range.max !== context.max;
};

/**
 * Applies the current filter state (used for closing the popover)
 */
export const applyFilter = <TData extends Item>(
  context: PriceFilterContext<TData>,
): void => {
  const currentFilter = getCurrentFilterValue(context);
  if (currentFilter) {
    const currentRange = getCurrentRange(context);
    // If current range equals defaults, clear the filter
    if (
      currentRange.min === context.min &&
      (!currentRange.max || currentRange.max === context.max)
    ) {
      setFilterValue(context, undefined);
    }
  }
};
