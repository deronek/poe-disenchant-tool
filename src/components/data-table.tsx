"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowData,
  SortingState,
  Updater,
  ColumnSizingState,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as React from "react";
import { DataTablePagination } from "./data-table-pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RangeFilter } from "./range-filter";
import { ChaosOrbIcon } from "./chaos-orb-icon";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
  }
}
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
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

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnSizingChange: setColumnSizing as (
      updater: Updater<ColumnSizingState>,
    ) => void,
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    state: {
      sorting,
      columnFilters,
      columnSizing,
    },
    // Provide sensible defaults in case columns do not specify size
    defaultColumn: {
      minSize: 60,
      size: 150,
      maxSize: 500,
    },
  });

  return (
    <div className="mx-auto w-full max-w-screen-xl rounded-md border">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Name + variant quick filter */}
          <div className="relative w-full md:max-w-xs">
            <Input
              placeholder="Filter by name or variant..."
              value={
                (table.getColumn("name")?.getFilterValue() as string) ?? ""
              }
              onChange={(e) => {
                // Store only in the name column filter; variant matching is handled in the Name column filterFn.
                table.getColumn("name")?.setFilterValue(e.target.value);
              }}
              aria-label="Filter by name or variant"
            />
            {((table.getColumn("name")?.getFilterValue() as string) ?? "")
              .length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Clear name filter"
                className="text-muted-foreground hover:text-foreground hover:bg-accent/60 focus-visible:ring-ring/50 focus-visible:border-ring absolute top-1/2 right-1.5 h-7 w-7 -translate-y-1/2 cursor-pointer rounded-md p-0 focus-visible:ring-[3px]"
                onClick={() => table.getColumn("name")?.setFilterValue("")}
              >
                ×
              </Button>
            )}
          </div>

          {/* Price range filter moved here */}
          <div className="md:ml-2">
            <RangeFilter
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              column={table.getColumn("chaos") as any}
              title="Price Filter"
              description="Filter items by chaos price range."
              min={0}
              max={600}
            />
          </div>

          {/* Right spacer */}
          <div className="md:ml-auto" />
        </div>

        {/* Active filter chips */}
        <div className="flex flex-wrap gap-2">
          {(() => {
            const v =
              (table.getColumn("name")?.getFilterValue() as string) ?? "";
            return v !== "" ? (
              <Badge variant="outline">
                Name: {v}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-5 cursor-pointer px-1"
                  onClick={() => {
                    table.getColumn("name")?.setFilterValue("");
                    table
                      .getColumn("variant")
                      ?.setFilterValue?.(undefined as unknown);
                  }}
                  aria-label="Clear name filter"
                >
                  ×
                </Button>
              </Badge>
            ) : null;
          })()}
          {(() => {
            const rng = table.getColumn("chaos")?.getFilterValue() as
              | { min: number; max: number }
              | undefined;
            return rng ? (
              <Badge
                variant="outline"
                className="inline-flex items-center gap-1"
              >
                <span className="inline-flex items-center gap-1">
                  Price: {`${rng.min}–${rng.max}`}
                  <ChaosOrbIcon />
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-5 cursor-pointer px-1"
                  onClick={() =>
                    table.getColumn("chaos")?.setFilterValue(undefined)
                  }
                  aria-label="Clear price filter"
                >
                  ×
                </Button>
              </Badge>
            ) : null;
          })()}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full table-fixed text-sm">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const width = header.getSize();
                  const isSorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width }}
                      aria-sort={
                        isSorted === "asc"
                          ? "ascending"
                          : isSorted === "desc"
                            ? "descending"
                            : "none"
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, idx) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`${idx % 2 === 0 ? "bg-muted/10" : ""} hover:bg-accent/40 h-11`}
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
      <DataTablePagination table={table} />
    </div>
  );
}
