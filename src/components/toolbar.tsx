"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RangeFilter } from "@/components/range-filter";
import { ChaosOrbIcon } from "@/components/chaos-orb-icon";
import { NameFilter } from "@/components/name-filter";
import { Table } from "@tanstack/react-table";

type ToolbarProps<TData> = {
  table: Table<TData>;
  onClearMarks?: () => void;
};

export function DataTableToolbar<TData>({
  table,
  onClearMarks,
}: ToolbarProps<TData>) {
  const nameFilter =
    (table.getColumn("name")?.getFilterValue() as string) ?? "";
  const chaosRange = table.getColumn("chaos")?.getFilterValue() as
    | { min: number; max: number }
    | undefined;

  return (
    <div className="flex flex-col gap-3 border-b p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <NameFilter table={table} />
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
        <div className="flex items-center gap-2 md:ml-auto">
          {onClearMarks ? (
            <Button
              variant="outline"
              onClick={onClearMarks}
              title="Clear all marked rows"
              aria-label="Clear all marked rows"
            >
              Clear marks
            </Button>
          ) : null}
        </div>
      </div>

      {/* Active chips */}
      <div className="flex flex-wrap gap-2">
        {nameFilter !== "" ? (
          <Badge variant="outline">
            Name: {nameFilter}
            <Button
              variant="ghost"
              size="sm"
              className="h-5 cursor-pointer px-1"
              onClick={() => table.getColumn("name")?.setFilterValue("")}
              aria-label="Clear name filter"
            >
              ×
            </Button>
          </Badge>
        ) : null}
        {chaosRange ? (
          <Badge variant="outline" className="inline-flex items-center gap-1">
            <span className="inline-flex items-center gap-1">
              Price: {`${chaosRange.min}–${chaosRange.max}`}
              <ChaosOrbIcon />
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 cursor-pointer px-1"
              onClick={() =>
                table.getColumn("chaos")?.setFilterValue(undefined)
              }
              aria-label="Clear price filter"
            >
              ×
            </Button>
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
