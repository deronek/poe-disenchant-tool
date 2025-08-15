import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChaosOrbIcon } from "@/components/chaos-orb-icon";
import { DustIcon } from "@/components/dust-icon";
import { ArrowDown, ArrowUp, ArrowUpDown, Type } from "lucide-react";
import { Table } from "@tanstack/react-table";
import { COLUMN_IDS, type ColumnId } from "./columns";

type MobileSortingControlsProps<TData> = {
  table: Table<TData>;
};

export function MobileSortingControls<TData>({
  table,
}: MobileSortingControlsProps<TData>) {
  const sorting = table.getState().sorting;
  const currentSort = sorting[0] as
    | { id: ColumnId; desc?: boolean }
    | undefined;

  // Get current sorting information
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

  return (
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
                {getSortState(COLUMN_IDS.CALCULATED_DUST_VALUE) === "desc" ? (
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
  );
}
