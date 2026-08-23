import type { AppColumnDef, AppRow } from "@/lib/table-features";
import type { ViewItem } from "@/lib/view-item";
import * as React from "react";
import { useCreateAtom } from "@tanstack/react-store";
import {
  flexRender,
  PaginationState,
  RowSelectionState,
  useTable,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";

import { MobileCardLayout, MobileToolbar } from "@/components/mobile";
import { DataTableToolbar } from "@/components/toolbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { features } from "@/lib/table-features";
import { useRowSelected } from "@/lib/use-row-selected";
import { DataTablePagination } from "./data-table-pagination";
import { useDataTableState } from "./data-table-state-context";
import {
  DEFAULT_PAGE_SIZE,
  PaginationPersistence,
} from "./pagination-persistence";
import { SelectionPersistence } from "./selection-persistence";

interface DataTableProps<TData extends ViewItem> {
  columns: AppColumnDef<TData>[];
  data: TData[];
}

function DataTableRow<TData extends ViewItem>({ row }: { row: AppRow<TData> }) {
  const isSelected = useRowSelected(row);

  return (
    <TableRow
      data-state={isSelected ? "selected" : undefined}
      className={
        "data-[state=selected]:bg-muted/40 even:bg-background bg-background-200 h-11 transition-none data-[state=selected]:opacity-95"
      }
    >
      {row.getVisibleCells().map((cell) => {
        const width = cell.column.getSize();
        return (
          <TableCell
            key={cell.id}
            className={cell.column.columnDef.meta?.className}
            style={{ width }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        );
      })}
    </TableRow>
  );
}

export function DataTable<TData extends ViewItem>({
  columns,
  data,
}: DataTableProps<TData>) {
  const { sorting, columnFilters, columnSizing } = useDataTableState();

  // External rowSelection atom - single source of truth
  const rowSelection = useCreateAtom<RowSelectionState>({});
  const clearSelection = React.useCallback(() => {
    rowSelection.set({});
  }, [rowSelection]);

  // External pagination atom - single source of truth
  const pagination = useCreateAtom<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const table = useTable(
    {
      features,
      data,
      columns,
      columnResizeMode: "onChange",
      enableColumnResizing: true,
      enableMultiSort: false,
      enableSortingRemoval: false,
      getRowId: (row) => row.uniqueId,
      atoms: {
        sorting,
        columnFilters,
        columnSizing,
        rowSelection,
        pagination,
      },
      // Provide sensible defaults in case columns do not specify size
      defaultColumn: {
        minSize: 60,
        size: 150,
        maxSize: 500,
      },
    },
    // Only re-render on slices the rendered row/header models depend on.
    (state) => ({
      sorting: state.sorting,
      columnFilters: state.columnFilters,
      columnSizing: state.columnSizing,
      pagination: state.pagination,
      columnVisibility: state.columnVisibility,
    }),
  );

  return (
    <div
      className="mx-auto w-full max-w-md rounded-md border md:max-w-4xl lg:max-w-screen-xl"
      data-testid="league-table"
    >
      <SelectionPersistence rowSelection={rowSelection} />
      {/* Page size is a global, league-independent setting */}
      <PaginationPersistence pagination={pagination} />
      {/* Desktop Toolbar */}
      <div className="bg-background-200 hidden lg:block">
        <DataTableToolbar table={table} onClearMarks={clearSelection} />
      </div>

      {/* Mobile Toolbar */}
      <div className="bg-background-200 lg:hidden">
        <MobileToolbar table={table} onClearMarks={clearSelection} />
      </div>

      {/* Mobile Card Layout */}
      <div className="lg:hidden">
        <MobileCardLayout table={table} />
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden overflow-x-auto lg:block">
        <Table className="w-full table-fixed text-sm">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const width = header.getSize();
                  const isSorted = header.column.getIsSorted();
                  const ariaSort =
                    isSorted === "asc"
                      ? "ascending"
                      : isSorted === "desc"
                        ? "descending"
                        : "none";

                  const canSort = header.column.getCanSort?.() ?? true;
                  const toggleSort = canSort
                    ? header.column.getToggleSortingHandler()
                    : undefined;

                  const headerName =
                    header.column.columnDef.meta?.headerName ??
                    (typeof header.column.columnDef.header === "string"
                      ? header.column.columnDef.header
                      : undefined);

                  return (
                    <TableHead
                      key={header.id}
                      style={{ width }}
                      aria-sort={ariaSort as React.AriaAttributes["aria-sort"]}
                      className={`font-normal transition-colors select-none ${isSorted ? "text-primary" : "text-foreground"} ${canSort ? "hover:bg-accent/60" : ""}`}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          role={canSort ? "button" : undefined}
                          tabIndex={canSort ? 0 : -1}
                          className={`flex w-full items-center justify-between rounded-sm py-1 outline-none ${canSort ? "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-offset-background focus-visible:ring-[3px] focus-visible:ring-offset-2" : ""}`}
                          onClick={toggleSort}
                          onKeyDown={(e) => {
                            if (!canSort) return;
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleSort?.(e);
                            }
                          }}
                          aria-label={
                            canSort
                              ? headerName
                                ? `Sort by ${headerName}`
                                : "Sort column"
                              : undefined
                          }
                          aria-disabled={canSort ? undefined : true}
                        >
                          <div className="flex w-full min-w-0 flex-1 items-center truncate">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </div>
                          {canSort ? (
                            <span
                              aria-hidden="true"
                              className={`ml-1 inline-flex h-4 w-4 items-center justify-center transition-all ${isSorted ? "" : "text-muted-foreground"} ${isSorted === "asc" ? "rotate-180" : ""} ${isSorted === false ? "opacity-80" : ""}`}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </span>
                          ) : null}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table
                .getRowModel()
                .rows.map((row) => <DataTableRow key={row.id} row={row} />)
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination - Show below both layouts */}
      <div className="bg-background-200 border-t p-4">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
