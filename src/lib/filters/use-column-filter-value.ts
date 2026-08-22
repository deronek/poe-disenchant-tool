import type { ReadonlyAtom } from "@tanstack/react-store";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { useSelector } from "@tanstack/react-store";

import { COLUMN_IDS, ColumnId } from "@/lib/column-ids";
import { getFilterValue } from "./column-filter";
import { EMPTY_RANGE, RangeFilterValue } from "./range-filter";

/**
 * Minimal table surface these hooks need: the columnFilters atom.
 */
export interface FilterColumnTable {
  atoms: { columnFilters: ReadonlyAtom<ColumnFiltersState> };
}

/**
 * Reactively reads the name filter value from the table's columnFilters
 * atom. The component only re-renders when this filter changes.
 */
export function useNameFilterValue(
  table: FilterColumnTable,
): string | undefined {
  return useSelector(table.atoms.columnFilters, (filters) =>
    getFilterValue<string>(filters, COLUMN_IDS.NAME),
  );
}

/**
 * Reactively reads a column's range filter value, defaulting to the shared
 * frozen EMPTY_RANGE when no filter is applied.
 */
export function useRangeFilterValue(
  table: FilterColumnTable,
  columnId: ColumnId,
): Readonly<RangeFilterValue> {
  return (
    useSelector(table.atoms.columnFilters, (filters) =>
      getFilterValue<RangeFilterValue>(filters, columnId),
    ) ?? EMPTY_RANGE
  );
}
