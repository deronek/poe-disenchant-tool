import type { ViewItem } from "@/lib/view-item";
import type {
  ColumnDef,
  HeaderContext,
  Row,
  RowData,
  Table,
} from "@tanstack/react-table";
import {
  columnFilteringFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  metaHelper,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";

interface DataTableColumnMeta {
  className?: string;
  divinePriceThreshold?: number | null;
  headerName?: string;
}

/**
 * Shared TanStack Table V9 feature configuration for the league data table.
 */
export const features = tableFeatures({
  columnFilteringFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  columnMeta: metaHelper<DataTableColumnMeta>(),
});

export type TableFeatures = typeof features;

/**
 * Feature-bound table type aliases; call sites only name the row type
 * (defaulting to `ViewItem`).
 */
export type AppTable<TData extends RowData = ViewItem> = Table<
  TableFeatures,
  TData
>;
export type AppRow<TData extends RowData = ViewItem> = Row<
  TableFeatures,
  TData
>;
export type AppColumnDef<TData extends RowData = ViewItem> = ColumnDef<
  TableFeatures,
  TData
>;
export type AppHeaderContext<TData extends RowData = ViewItem> = HeaderContext<
  TableFeatures,
  TData
>;
