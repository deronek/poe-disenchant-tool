"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RangeFilter } from "@/components/range-filter";
import { ChaosOrbIcon } from "@/components/chaos-orb-icon";
import { NameFilter } from "@/components/name-filter";
import { Table } from "@tanstack/react-table";
import type { Item } from "@/lib/itemData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DustIcon } from "@/components/dust-icon";
import { ArrowUpDown, ArrowUp, ArrowDown, X, Type } from "lucide-react";

type ToolbarProps<TData extends Item> = {
  table: Table<TData>;
  onClearMarks?: () => void;
};

export function DataTableToolbar<TData extends Item>({
  table,
  onClearMarks,
}: ToolbarProps<TData>) {
  const nameFilter =
    (table.getColumn("name")?.getFilterValue() as string) ?? "";
  const chaosRange = table.getColumn("chaos")?.getFilterValue() as
    | { min: number; max: number }
    | undefined;

  // Get current sorting information
  const sorting = table.getState().sorting;
  const currentSort = sorting[0]; // Get the first (and currently only) sort

  // Get column information for display
  const getSortLabel = (columnId: string) => {
    switch (columnId) {
      case "dustPerChaos":
        return "Dust per Chaos";
      case "name":
        return "Name";
      case "chaos":
        return "Price";
      case "dustValIlvl84Q20":
        return "Dust Value";
      default:
        return columnId;
    }
  };

  // Handle sorting with tri-state toggle (desc -> asc -> none)
  const handleSort = (columnId: string) => {
    const column = table.getColumn(columnId);
    if (!column) return;

    const currentSort = sorting.find((sort) => sort.id === columnId);

    if (currentSort) {
      // Cycle: desc -> asc -> none
      if (currentSort.desc) {
        // Currently descending, change to ascending
        table.setSorting([
          ...sorting.filter((sort) => sort.id !== columnId),
          { id: columnId, desc: false },
        ]);
      } else {
        // Currently ascending, remove sorting
        table.setSorting(sorting.filter((sort) => sort.id !== columnId));
      }
    } else {
      // No sorting, add descending (most common use case)
      table.setSorting([...sorting, { id: columnId, desc: true }]);
    }
  };

  // Get sort state for a column
  const getSortState = (columnId: string) => {
    const sort = sorting.find((sort) => sort.id === columnId);
    if (!sort) return "none";
    return sort.desc ? "desc" : "asc";
  };

  return (
    <div className="flex flex-col gap-3 border-b p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <NameFilter table={table} />
        <div className="md:ml-2">
          {table.getColumn("chaos") && (
            <RangeFilter
              column={table.getColumn("chaos")}
              title="Price Filter"
              description="Filter items by chaos price range."
              min={0}
              max={600}
            />
          )}
        </div>

        {/* Sorting Controls - Mobile Only */}
        <div className="md:ml-2 md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Sort
                {currentSort && (
                  <span className="text-muted-foreground inline-flex items-center font-normal">
                    {getSortLabel(currentSort.id)}
                    <span className="ml-1">
                      {currentSort.desc ? (
                        <ArrowDown className="h-4 w-4" />
                      ) : (
                        <ArrowUp className="h-4 w-4" />
                      )}
                    </span>
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[200px]">
              <DropdownMenuItem
                onClick={() => handleSort("dustPerChaos")}
                className="flex items-center justify-between gap-0"
              >
                <div className="flex items-start gap-6">
                  <div className="flex items-center gap-1">
                    <DustIcon className="h-4 w-4" />
                    <ChaosOrbIcon className="h-4 w-4" />
                  </div>
                  <span className="text-left">Dust per Chaos</span>
                </div>
                {getSortState("dustPerChaos") !== "none" && (
                  <span className="text-muted-foreground">
                    {getSortState("dustPerChaos") === "desc" ? (
                      <ArrowDown className="h-4 w-4" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSort("name")}
                className="flex items-center justify-between"
              >
                <div className="flex items-start gap-6">
                  <div className="flex items-center gap-1">
                    <Type className="h-4 w-4" />
                    <span className="w-4"></span>
                  </div>
                  <span className="text-left">Name</span>
                </div>
                {getSortState("name") !== "none" && (
                  <span className="text-muted-foreground">
                    {getSortState("name") === "desc" ? (
                      <ArrowDown className="h-4 w-4" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSort("chaos")}
                className="flex items-center justify-between"
              >
                <div className="flex items-start gap-6">
                  <div className="mr-5 flex items-center gap-1">
                    <ChaosOrbIcon className="h-4 w-4" />
                  </div>
                  <span className="text-left">Price</span>
                </div>
                {getSortState("chaos") !== "none" && (
                  <span className="text-muted-foreground">
                    {getSortState("chaos") === "desc" ? (
                      <ArrowDown className="h-4 w-4" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSort("dustValIlvl84Q20")}
                className="flex items-center justify-between"
              >
                <div className="flex items-start gap-6">
                  <div className="mr-5 flex items-center gap-1">
                    <DustIcon className="h-4 w-4" />
                  </div>
                  <span className="text-left">Dust Value</span>
                </div>
                {getSortState("dustValIlvl84Q20") !== "none" && (
                  <span className="text-muted-foreground">
                    {getSortState("dustValIlvl84Q20") === "desc" ? (
                      <ArrowDown className="h-4 w-4" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </span>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
              <X className="h-3 w-3" />
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
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
