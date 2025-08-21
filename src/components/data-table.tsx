"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  ColumnSizingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowData,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { type AdvancedSettings } from "@/components/advanced-settings-panel";
import { DataTableToolbar } from "@/components/toolbar";
import { MobileToolbar } from "@/components/mobile-toolbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Item } from "@/lib/itemData";
import { ChevronUp } from "lucide-react";
import * as React from "react";
import { DataTablePagination } from "./data-table-pagination";
import { MobileCardLayout } from "./mobile-card-layout";
import { usePersistentRowSelection } from "./usePersistentRowSelection";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
  }
}
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  advancedSettings: AdvancedSettings;
  onAdvancedSettingsChange: (settings: AdvancedSettings) => void;
}

export function DataTable<TData extends Item, TValue>({
  columns,
  data,
  advancedSettings,
  onAdvancedSettingsChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "dustPerChaos",
      desc: true,
    },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  // Keep column sizes in state to make widths stable
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});

  // Persistent row selection
  const { rowSelection, setRowSelection, clearSelection } =
    usePersistentRowSelection("poe-udt:selected:v1");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: "onChange",
    enableColumnResizing: true,
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
    <div className="mx-auto w-full max-w-md rounded-md border lg:max-w-screen-xl">
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
        <MobileCardLayout table={table} advancedSettings={advancedSettings} />
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
                      className={`hover:bg-accent/60 font-normal transition-colors select-none ${isSorted ? "text-primary" : "text-foreground"} `}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          role={canSort ? "button" : undefined}
                          tabIndex={canSort ? 0 : -1}
                          className={`flex w-full items-center justify-between gap-2 rounded-sm py-1 outline-none ${canSort ? "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-offset-background cursor-pointer focus-visible:ring-[3px] focus-visible:ring-offset-2" : ""}`}
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
                              className={`ml-1 inline-flex h-4 w-4 items-center justify-center transition-all ${isSorted ? "text-primary" : "text-muted-foreground"} ${isSorted === "desc" ? "rotate-180" : ""} ${isSorted === false ? "opacity-80" : ""}`}
                            >
                              <ChevronUp className="h-4 w-4" />
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
                    "even:bg-muted/10 hover:bg-accent/40 data-[state=selected]:bg-muted/60 h-11 data-[state=selected]:opacity-95"
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
