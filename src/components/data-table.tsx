import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowData,
  useReactTable,
} from "@tanstack/react-table";

import { type AdvancedSettings } from "@/components/advanced-settings-panel";
import { MobileToolbar } from "@/components/mobile-toolbar";
import { DataTableToolbar } from "@/components/toolbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Item } from "@/lib/itemData";
import { ChevronDown } from "lucide-react";
import * as React from "react";
import { DataTablePagination } from "./data-table-pagination";
import { useDataTableState } from "./data-table-state-context";
import { MobileCardLayout } from "./mobile-card-layout";
import { usePersistentRowSelection } from "./usePersistentRowSelection";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
  }
}
import { League } from "@/lib/leagues";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  advancedSettings: AdvancedSettings;
  onAdvancedSettingsChange: (settings: AdvancedSettings) => void;
  league: League;
  lowStockThreshold: number;
}

export function DataTable<TData extends Item, TValue>({
  columns,
  data,
  advancedSettings,
  onAdvancedSettingsChange,
  league,
  lowStockThreshold,
}: DataTableProps<TData, TValue>) {
  "use no memo"; // TanStack Table not yet comptatible with React Compiler
  const {
    sorting,
    columnFilters,
    columnSizing,
    updateSorting,
    updateColumnFilters,
    updateColumnSizing,
  } = useDataTableState();

  // Persistent row selection
  const selectionStorageKey = React.useMemo(
    () => `poe-udt:selected:${league}:v2`,
    [league],
  );
  const { rowSelection, setRowSelection, clearSelection } =
    usePersistentRowSelection(selectionStorageKey);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: updateSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: updateColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnSizingChange: updateColumnSizing,
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    enableMultiSort: false,
    enableSortingRemoval: false,
    getRowId: (row, _index) =>
      // Fall back to array index string if uniqueId not present
      row.uniqueId ?? String(_index ?? 0),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnSizing,
      rowSelection,
    },
    // Provide sensible defaults in case columns do not specify size
    defaultColumn: {
      minSize: 60,
      size: 150,
      maxSize: 500,
    },
  });

  return (
    <div className="mx-auto w-full max-w-md rounded-md border md:max-w-4xl lg:max-w-screen-xl">
      {/* Desktop Toolbar */}
      <div className="hidden lg:block">
        <DataTableToolbar
          table={table}
          onClearMarks={clearSelection}
          advancedSettings={advancedSettings}
          onAdvancedSettingsChange={onAdvancedSettingsChange}
        />
      </div>

      {/* Mobile Toolbar */}
      <div className="lg:hidden">
        <MobileToolbar
          table={table}
          onClearMarks={clearSelection}
          advancedSettings={advancedSettings}
          onAdvancedSettingsChange={onAdvancedSettingsChange}
        />
      </div>

      {/* Mobile Card Layout */}
      <div className="lg:hidden">
        <MobileCardLayout
          table={table}
          advancedSettings={advancedSettings}
          league={league}
          lowStockThreshold={lowStockThreshold}
        />
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden overflow-x-auto px-1 lg:block">
        <Table className="w-full table-fixed text-sm">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
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
                          className={`flex w-full items-center justify-between gap-2 rounded-sm py-1 outline-none ${canSort ? "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-offset-background focus-visible:ring-[3px] focus-visible:ring-offset-2" : ""}`}
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
                              ? typeof header.column.columnDef.header ===
                                "string"
                                ? `Sort by ${header.column.columnDef.header}`
                                : "Sort column"
                              : undefined
                          }
                          aria-disabled={canSort ? undefined : true}
                        >
                          <div className="flex w-full min-w-0 flex-1 items-center gap-2 truncate">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </div>
                          {canSort ? (
                            <span
                              aria-hidden="true"
                              className={`ml-1 inline-flex h-4 w-4 items-center justify-center transition-all ${isSorted ? "text-primary" : "text-muted-foreground"} ${isSorted === "asc" ? "rotate-180" : ""} ${isSorted === false ? "opacity-80" : ""}`}
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={
                    "even:bg-muted/10 data-[state=selected]:bg-muted/40 h-11 data-[state=selected]:opacity-95"
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
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
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
      <div className="border-t p-4">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
