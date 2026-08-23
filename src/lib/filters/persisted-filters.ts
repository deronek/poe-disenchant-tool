import type { ColumnFiltersState } from "@tanstack/react-table";
import { z } from "zod";

import type { RangeFilterValue } from "./range-filter";
import { getFilterValue } from "./column-filter";
import {
  RANGE_FILTER_COLUMN_IDS,
  RANGE_FILTER_COLUMNS,
} from "./range-filter-columns";

const RangeFilterValueSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
});

export const PersistedFiltersSchema = z.object({
  price: RangeFilterValueSchema.optional(),
  dust: RangeFilterValueSchema.optional(),
  gold: RangeFilterValueSchema.optional(),
});

export type PersistedFilters = z.infer<typeof PersistedFiltersSchema>;

const PERSISTED_FIELDS = Object.keys(
  RANGE_FILTER_COLUMNS,
) as (keyof typeof RANGE_FILTER_COLUMNS)[];

/**
 * Converts column filters state to the persisted shape (range filters only;
 * the name filter and any other filters are ignored).
 */
export const persistedFiltersFromState = (
  filters: ColumnFiltersState,
): PersistedFilters => {
  const result: PersistedFilters = {};
  for (const field of PERSISTED_FIELDS) {
    const value = getFilterValue<RangeFilterValue>(
      filters,
      RANGE_FILTER_COLUMNS[field],
    );
    if (value) result[field] = value;
  }
  return result;
};

/**
 * Applies persisted range filters to column filters state, preserving any
 * non-range filters (e.g. the name filter).
 */
export const mergePersistedFilters = (
  filters: ColumnFiltersState,
  persisted: PersistedFilters,
): ColumnFiltersState => {
  const rangeColumnIds = new Set<string>(RANGE_FILTER_COLUMN_IDS);
  const merged = filters.filter((f) => !rangeColumnIds.has(f.id));

  for (const field of PERSISTED_FIELDS) {
    const value = persisted[field];
    if (value != null) {
      merged.push({ id: RANGE_FILTER_COLUMNS[field], value });
    }
  }

  return merged;
};
