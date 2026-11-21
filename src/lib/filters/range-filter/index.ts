// Export all types
export type { PrecisionBand } from "./range-transforms";
export type { RangeFilterValue } from "./range-filter-logic";

// Export all business logic functions
export {
  EMPTY_RANGE,
  createNormalizedFilterValue,
  getEffectiveMax,
  getEffectiveMin,
  updateLowerBound,
  updateUpperBound,
  getLowerBoundSliderValue,
  getLowerBoundLinearValue,
  hasMinFilter,
  hasMaxFilter,
  rangeFilterFn,
} from "./range-filter-logic";

// Export transformation utilities
export {
  fractionalSliderToLinear,
  getRangeStep,
  hasSubUnitRange,
  linearToFractionalSlider,
  roundRangeValue,
} from "./range-transforms";
