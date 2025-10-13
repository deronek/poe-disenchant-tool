// Export all types
export type {
  PriceFilterValue,
  PriceRange,
  PriceFilterContext,
} from "./price-filter-logic";

// Export all business logic functions
export {
  getCurrentFilterValue,
  setFilterValue,
  createNormalizedFilterValue,
  getCurrentRange,
  updateLowerBound,
  updateUpperBound,
  getLowerBoundSliderValue,
  getLowerBoundLinearValue,
  hasActiveFilter,
  resetFilter,
  hasMinFilter,
  hasMaxFilter,
  applyFilter,
} from "./price-filter-logic";
