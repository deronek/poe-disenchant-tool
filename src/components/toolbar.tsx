"use client";

import { ChaosOrbIcon } from "@/components/chaos-orb-icon";
import { DustIcon } from "@/components/dust-icon";
import { NameFilter } from "@/components/name-filter";
import { RangeFilter } from "@/components/range-filter";
import {
  AdvancedSettingsPanel,
  type AdvancedSettings,
} from "@/components/advanced-settings-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { XButton } from "@/components/ui/x-button";
import type { Item } from "@/lib/itemData";
import { Table } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  HelpCircle,
  Info,
  Type,
} from "lucide-react";

import { COLUMN_IDS, type ColumnId } from "./columns";
import { NameFilterChip } from "./name-filter-chip";
import { PriceFilterChip } from "./price-filter-chip";

type ToolbarProps<TData extends Item> = {
  table: Table<TData>;
  onClearMarks?: () => void;
  advancedSettings: AdvancedSettings;
  onAdvancedSettingsChange: (settings: AdvancedSettings) => void;
};

export function DataTableToolbar<TData extends Item>({
  table,
  onClearMarks,
  advancedSettings,
  onAdvancedSettingsChange,
}: ToolbarProps<TData>) {
  const nameFilter =
    (table.getColumn(COLUMN_IDS.NAME)?.getFilterValue() as string) ?? "";
  const chaosRange = table.getColumn(COLUMN_IDS.CHAOS)?.getFilterValue() as
    | { min: number; max: number }
    | undefined;

  // Get current sorting information
  const sorting = table.getState().sorting;
  const currentSort = sorting[0] as
    | { id: ColumnId; desc?: boolean }
    | undefined;

  // Get column information for display
  const getSortLabel = (columnId: ColumnId) => {
    switch (columnId) {
      case COLUMN_IDS.DUST_PER_CHAOS:
        return "Dust per Chaos";
      case COLUMN_IDS.NAME:
        return "Name";
      case COLUMN_IDS.CHAOS:
        return "Price";
      case COLUMN_IDS.CALCULATED_DUST_VALUE:
        return "Dust Value";
      default:
        return columnId;
    }
  };

  // Handle sorting with tri-state toggle (desc -> asc -> none)
  const handleSort = (columnId: ColumnId) => {
    const column = table.getColumn(String(columnId));
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
      // No sorting, add descending (most common use case) - remove other sorts first
      table.setSorting([{ id: columnId, desc: true }]);
    }
  };

  // Get sort state for a column
  const getSortState = (columnId: ColumnId) => {
    const sort = sorting.find((sort) => sort.id === columnId);
    if (!sort) return "none";
    return sort.desc ? "desc" : "asc";
  };

  const numberOfSelectedrows = Object.keys(
    table.getState().rowSelection,
  ).length;

  return (
    <div className="flex flex-col gap-3 border-b p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <NameFilter table={table} />
        <div className="flex items-center gap-3 md:ml-2">
          {table.getColumn(COLUMN_IDS.CHAOS) && (
            <RangeFilter
              column={table.getColumn(COLUMN_IDS.CHAOS)}
              title="Price Filter"
              description="Filter items by chaos price range."
              min={0}
              max={600}
            />
          )}
          {/* Active chips */}
          <div className="flex flex-wrap gap-2">
            <NameFilterChip table={table} />
            <PriceFilterChip table={table} />
          </div>
        </div>

        {/* Sorting Controls - Mobile Only */}
        <div className="md:ml-2 md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-3">
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
            <DropdownMenuContent align="end" className="min-w-[207px]">
              <DropdownMenuItem
                onClick={() => handleSort(COLUMN_IDS.DUST_PER_CHAOS)}
                className="flex items-center justify-between gap-0"
              >
                <div className="flex items-start gap-6">
                  <div className="flex items-center gap-1">
                    <DustIcon className="h-4 w-4" />
                    <ChaosOrbIcon className="h-4 w-4" />
                  </div>
                  <span className="text-left">Dust per Chaos</span>
                </div>
                {getSortState(COLUMN_IDS.DUST_PER_CHAOS) !== "none" && (
                  <span className="text-muted-foreground">
                    {getSortState(COLUMN_IDS.DUST_PER_CHAOS) === "desc" ? (
                      <ArrowDown className="h-4 w-4" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSort(COLUMN_IDS.NAME)}
                className="flex items-center justify-between"
              >
                <div className="flex items-start gap-6">
                  <div className="flex items-center gap-1">
                    <Type className="h-4 w-4" />
                    <span className="w-4"></span>
                  </div>
                  <span className="text-left">Name</span>
                </div>
                {getSortState(COLUMN_IDS.NAME) !== "none" && (
                  <span className="text-muted-foreground">
                    {getSortState(COLUMN_IDS.NAME) === "desc" ? (
                      <ArrowDown className="h-4 w-4" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSort(COLUMN_IDS.CHAOS)}
                className="flex items-center justify-between"
              >
                <div className="flex items-start gap-6">
                  <div className="mr-5 flex items-center gap-1">
                    <ChaosOrbIcon className="h-4 w-4" />
                  </div>
                  <span className="text-left">Price</span>
                </div>
                {getSortState(COLUMN_IDS.CHAOS) !== "none" && (
                  <span className="text-muted-foreground">
                    {getSortState(COLUMN_IDS.CHAOS) === "desc" ? (
                      <ArrowDown className="h-4 w-4" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSort(COLUMN_IDS.CALCULATED_DUST_VALUE)}
                className="flex items-center justify-between"
              >
                <div className="flex items-start gap-6">
                  <div className="mr-5 flex items-center gap-1">
                    <DustIcon className="h-4 w-4" />
                  </div>
                  <span className="text-left">Dust Value</span>
                </div>
                {getSortState(COLUMN_IDS.CALCULATED_DUST_VALUE) !== "none" && (
                  <span className="text-muted-foreground">
                    {getSortState(COLUMN_IDS.CALCULATED_DUST_VALUE) ===
                    "desc" ? (
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
          {/* Advanced Settings */}
          <AdvancedSettingsPanel
            settings={advancedSettings}
            onSettingsChange={onAdvancedSettingsChange}
          />

          {onClearMarks ? (
            <Button
              variant="outline"
              onClick={onClearMarks}
              title="Clear all marked rows"
              aria-label="Clear all marked rows"
              disabled={numberOfSelectedrows === 0}
              className="gap-1"
            >
              Clear marks{" "}
              <span className="tabular-nums">({numberOfSelectedrows})</span>
            </Button>
          ) : null}

          {/* Mobile Help Section */}
          <div className="md:hidden">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  aria-label="Get help using this app"
                >
                  <HelpCircle className="h-4 w-4" />
                  Help
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="max-w-[320px] text-sm"
                side="bottom"
                align="end"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500 dark:text-blue-400" />
                    <div>
                      <p className="font-medium">Mark Items</p>
                      <p className="text-neutral-900 dark:text-neutral-100">
                        Check the box to mark items you&apos;ve traded recently.
                        Marks are saved locally and can be cleared anytime.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500 dark:text-blue-400" />
                    <div>
                      <p className="font-medium">Trade Settings</p>
                      <p className="text-neutral-900 dark:text-neutral-100">
                        Advanced trade settings and search information are
                        available in the Trade button dropdown. Configure
                        filters and learn about trade search behavior.
                      </p>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}
