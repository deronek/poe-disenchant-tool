import React from "react";
import { Table } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  StretchHorizontal,
  Type,
} from "lucide-react";

import type { ColumnId } from "./columns";
import { ChaosOrbIcon } from "@/components/chaos-orb-icon";
import { DustIcon } from "@/components/dust-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { COLUMN_IDS } from "./columns";

const AscendingSortIcon = () => (
  <ArrowUp className="h-4 w-4" aria-label="ascending" />
);

const DescendingSortIcon = () => (
  <ArrowDown className="h-4 w-4" aria-label="descending" />
);
type MobileSortingControlsProps<TData> = {
  table: Table<TData>;
  className?: string;
};

type SortOption = {
  id: ColumnId;
  label: string;
  icons: React.ReactNode;
};

type SortState = "none" | "asc" | "desc";

const sortOptions: SortOption[] = [
  {
    id: COLUMN_IDS.DUST_PER_CHAOS,
    label: "Dust / Chaos",
    icons: (
      <>
        <DustIcon className="h-4 w-4" aria-hidden="true" alt="" />
        /
        <ChaosOrbIcon className="h-4 w-4" aria-hidden="true" alt="" />
      </>
    ),
  },
  {
    id: COLUMN_IDS.DUST_PER_CHAOS_PER_SLOT,
    label: "Dust / Chaos / Slot",
    icons: (
      <>
        <DustIcon className="h-4 w-4" aria-hidden="true" alt="" />
        /
        <ChaosOrbIcon className="h-4 w-4" aria-hidden="true" alt="" />
        /
        <StretchHorizontal
          className="h-4 w-4"
          aria-hidden="true"
          focusable="false"
        />
      </>
    ),
  },
  {
    id: COLUMN_IDS.NAME,
    label: "Name",
    icons: <Type className="h-4 w-4" aria-hidden="true" focusable="false" />,
  },
  {
    id: COLUMN_IDS.CHAOS,
    label: "Price",
    icons: <ChaosOrbIcon className="h-4 w-4" aria-hidden="true" alt="" />,
  },
  {
    id: COLUMN_IDS.CALCULATED_DUST_VALUE,
    label: "Dust Value",
    icons: <DustIcon className="h-4 w-4" aria-hidden="true" alt="" />,
  },
];

function SortingMenuItem({
  id,
  label,
  icons,
  onSort,
  sortState,
}: SortOption & {
  onSort: (id: ColumnId) => void;
  sortState: SortState;
}) {
  return (
    <DropdownMenuItem
      onSelect={() => onSort(id)}
      className="flex items-center justify-between"
    >
      <div className="flex flex-1 items-center gap-4">
        <div className="text-muted-foreground flex min-w-20 items-center gap-1">
          {icons}
        </div>
        <span className="min-w-32 flex-1 text-left">{label}</span>
      </div>
      {sortState !== "none" && (
        <span className="text-muted-foreground flex-shrink-0">
          {sortState === "desc" ? (
            <DescendingSortIcon />
          ) : (
            <AscendingSortIcon />
          )}
        </span>
      )}
    </DropdownMenuItem>
  );
}

export function MobileSortingControls<TData>({
  table,
  className,
}: MobileSortingControlsProps<TData>) {
  "use memo";
  const sorting = table.options.state?.sorting ?? [];
  const currentSort = sorting[0];

  // Get sort state for a column
  const getSortState = (columnId: ColumnId) => {
    const sort = sorting.find((sort) => sort.id === columnId);
    if (!sort) return "none";
    return sort.desc ? "desc" : "asc";
  };

  // Single-column bi-state: new -> desc; desc -> asc; asc -> desc
  const handleSort = (columnId: ColumnId) => {
    const [prev] = table.getState().sorting;
    if (!prev || prev.id !== columnId) {
      table.setSorting([{ id: columnId, desc: true }]);
      return;
    }
    if (prev.desc) {
      table.setSorting([{ id: columnId, desc: false }]);
    } else {
      table.setSorting([{ id: columnId, desc: true }]);
    }
  };

  return (
    <div className="lg:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={cn("gap-3", className)}>
            <ArrowUpDown className="h-4 w-4" />
            Sort
            {currentSort && (
              <span className="text-muted-foreground ml-1 inline-flex items-center font-normal">
                <span className="inline-flex gap-1">
                  {sortOptions.find((opt) => opt.id === currentSort.id)
                    ?.icons || currentSort.id}
                </span>
                <span className="ml-2">
                  {currentSort.desc ? (
                    <DescendingSortIcon />
                  ) : (
                    <AscendingSortIcon />
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
