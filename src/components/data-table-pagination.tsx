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
      <SelectTrigger className="h-8 w-[70px]">
        <SelectValue placeholder={pageSize} />
      </SelectTrigger>
      <SelectContent side="top">
        {[10, 20, 25, 30, 40, 50].map((size) => (
          <SelectItem key={size} value={`${size}`}>
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
    <div className="flex items-center justify-between px-3 py-2">
      {/* Left caption: start–end of total */}
      <div
        className="text-muted-foreground hidden flex-1 text-sm sm:block"
        aria-live="polite"
      >
        {start}–{end} of {total} items in the table.
      </div>

      <div className="flex flex-1 items-center justify-end space-x-6 lg:space-x-8">
        {/* Rows per page */}
        <div className="hidden items-center space-x-2 md:flex">
          <p className="flex-none text-sm font-medium">Rows per page</p>
          <RowsPerPageSelect
            pageSize={pageSize}
            onPageSizeChange={table.setPageSize}
          />
        </div>

        {/* Page x of y */}
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {pageIndex + 1} of {table.getPageCount()}
        </div>

        {/* Pager buttons with aria-disabled mirroring */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
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
            className="hidden size-8 lg:flex"
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
