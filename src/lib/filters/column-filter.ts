import type { ColumnId } from "@/lib/column-ids";
import type { AppTable } from "@/lib/table-features";
import type { ColumnFiltersState, RowData } from "@tanstack/react-table";

import { RANGE_FILTER_COLUMN_IDS } from "./range-filter-columns";

/**
 * Reads a column's raw filter value from a column-filters state snapshot.
 * Filter values are untyped in TanStack state; callers declare the expected
 * type here, valid at known column boundaries.
 */
export function getFilterValue<T>(
  filters: ColumnFiltersState,
  columnId: ColumnId,
): T | undefined {
  return filters.find((f) => f.id === columnId)?.value as T | undefined;
}

/**
 * Sets the filter value of a single column; no-op if the column is missing.
 */
export const setColumnFilter = <TData extends RowData, TValue>(
  table: AppTable<TData>,
  columnId: ColumnId,
  value: TValue | undefined,
): void => {
  table.getColumn(columnId)?.setFilterValue(value);
};

/**
 * Clears the filter value of a single column.
 */
export const resetColumnFilter = <TData extends RowData>(
  table: AppTable<TData>,
  columnId: ColumnId,
): void => {
  setColumnFilter(table, columnId, undefined);
};

/**
 * Clears all range filter columns (price, dust, gold).
 */
export const resetRangeFilters = <TData extends RowData>(
  table: AppTable<TData>,
): void => {
  RANGE_FILTER_COLUMN_IDS.forEach((columnId) => {
    resetColumnFilter(table, columnId);
  });
};
