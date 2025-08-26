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
  lower: number;
  upper?: number;
  upperEnabled: boolean;
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
  const { lower, upper, upperEnabled } = range;

  // Clear filter if range equals defaults
  if (lower === context.min && (!upperEnabled || upper === context.max)) {
    return undefined;
  }

  return {
    min: lower,
    max: upperEnabled ? upper : undefined,
  };
};

/**
 * Gets the current price range with proper defaults
 */
export const getCurrentRange = <TData extends Item>(
  context: PriceFilterContext<TData>,
): PriceRange => {
  const filterValue = getCurrentFilterValue(context);
  const currentMin = filterValue?.min ?? context.min;
  const currentMax = filterValue?.max ?? context.max;
  const upperEnabled =
    filterValue?.max !== undefined && filterValue.max !== context.max;

  return {
    lower: currentMin,
    upper: currentMax,
    upperEnabled,
  };
};

/**
 * Updates the lower bound of the price range
 */
export const updateLowerBound = <TData extends Item>(
  context: PriceFilterContext<TData>,
  newLower: number,
  currentRange: PriceRange,
): PriceRange => {
  const constrainedLower = Math.min(
    newLower,
    currentRange.upperEnabled ? currentRange.upper! : context.max,
  );

  return {
    ...currentRange,
    lower: constrainedLower,
  };
};

/**
 * Updates the upper bound of the price range
 */
export const updateUpperBound = <TData extends Item>(
  context: PriceFilterContext<TData>,
  newUpper: number,
  currentRange: PriceRange,
): PriceRange => {
  const shouldEnable = newUpper !== context.max;

  return {
    ...currentRange,
    upper: shouldEnable ? newUpper : context.max,
    upperEnabled: shouldEnable,
  };
};

/**
 * Gets the effective maximum for lower bound calculations
 */
const getEffectiveMaxForLowerBound = <TData extends Item>(
  context: PriceFilterContext<TData>,
): number => {
  const currentRange = getCurrentRange(context);
  return currentRange.upperEnabled ? currentRange.upper! : context.max;
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

  const currentRange = getCurrentRange(context);
  return (
    filterValue.min !== context.min ||
    (currentRange.upperEnabled && filterValue.max !== context.max)
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
      currentRange.lower === context.min &&
      (!currentRange.upperEnabled || currentRange.upper === context.max)
    ) {
      setFilterValue(context, undefined);
    }
  }
};
