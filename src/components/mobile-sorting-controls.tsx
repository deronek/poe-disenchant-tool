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
import { cn } from "@/lib/utils";

type MobileSortingControlsProps<TData> = {
  table: Table<TData>;
  className?: string;
};

export function MobileSortingControls<TData>({
  table,
  className,
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

  type SortOption = {
    id: ColumnId;
    label: string;
    icons: React.ReactNode;
  };

  const sortOptions: SortOption[] = [
    {
      id: COLUMN_IDS.DUST_PER_CHAOS,
      label: "Dust per Chaos",
      icons: (
        <>
          <DustIcon className="h-4 w-4" />
          <ChaosOrbIcon className="h-4 w-4" />
        </>
      ),
    },
    {
      id: COLUMN_IDS.NAME,
      label: "Name",
      icons: <Type className="h-4 w-4" />,
    },
    {
      id: COLUMN_IDS.CHAOS,
      label: "Price",
      icons: <ChaosOrbIcon className="h-4 w-4" />,
    },
    {
      id: COLUMN_IDS.CALCULATED_DUST_VALUE,
      label: "Dust Value",
      icons: <DustIcon className="h-4 w-4" />,
    },
  ];

  function SortingMenuItem({
    id,
    label,
    icons,
    onSort,
    sortState,
  }: SortOption & { onSort: (id: ColumnId) => void; sortState: string }) {
    return (
      <DropdownMenuItem
        onClick={() => onSort(id)}
        className="flex items-center justify-between"
      >
        <div className="flex flex-1 items-center gap-6">
          <div className="flex min-w-10 items-center gap-1">{icons}</div>
          <span className="flex-1 text-left">{label}</span>
        </div>
        {sortState !== "none" && (
          <span className="text-muted-foreground flex-shrink-0">
            {sortState === "desc" ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </span>
        )}
      </DropdownMenuItem>
    );
  }

  return (
    <div className="lg:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={cn("gap-3", className)}>
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
          {sortOptions.map((option) => (
            <SortingMenuItem
              key={option.id}
              {...option}
              onSort={handleSort}
              sortState={getSortState(option.id)}
            />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
