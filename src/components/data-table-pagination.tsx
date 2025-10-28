import { Table } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Rows per page select as memo
const RowsPerPageSelect = React.memo(function RowsPerPageSelect({
  pageSize,
  onPageSizeChange,
}: {
  pageSize: number;
  onPageSizeChange: (value: number) => void;
}) {
  return (
    <Select
      value={`${pageSize}`}
      onValueChange={(value) => {
        onPageSizeChange(Number(value));
      }}
    >
      <SelectTrigger
        className="h-8 w-[70px]"
        data-testid="rows-per-page-select-trigger"
      >
        <SelectValue placeholder={pageSize}>{String(pageSize)}</SelectValue>
      </SelectTrigger>
      <SelectContent side="top" data-testid="rows-per-page-select-content">
        {[10, 20, 30, 40, 50].map((size) => (
          <SelectItem key={size} value={`${size}`} data-value={`${size}`}>
            {size}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  // Compute start–end of total using the filtered row model
  const total = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;

  const start = total === 0 ? 0 : pageIndex * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(total, start + pageSize - 1);

  const canPrev = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();

  return (
    <div
      className="flex items-baseline justify-between px-3 py-2"
      data-testid="pagination-container"
    >
      {/* Left caption: start–end of total */}
      <div
        className="text-muted-foreground min-w-24 text-sm"
        aria-live="polite"
        data-testid="pagination-summary"
      >
        Showing {start}–{end} of {total} items.
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 md:gap-6 lg:gap-10">
        {/* Rows per page */}
        <div className="hidden items-center gap-2 lg:flex">
          <p className="flex-none text-sm font-semibold">Rows per page</p>
          <RowsPerPageSelect
            pageSize={pageSize}
            onPageSizeChange={table.setPageSize}
          />
        </div>

        {/* Page x of y */}
        <div
          className="flex w-[100px] items-center justify-center text-sm font-semibold"
          data-testid="page-indicator"
        >
          Page {pageIndex + 1} of {table.getPageCount()}
        </div>

        {/* Pager buttons with aria-disabled mirroring */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 md:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!canPrev}
            aria-disabled={!canPrev}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!canPrev}
            aria-disabled={!canPrev}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!canNext}
            aria-disabled={!canNext}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 md:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!canNext}
            aria-disabled={!canNext}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
