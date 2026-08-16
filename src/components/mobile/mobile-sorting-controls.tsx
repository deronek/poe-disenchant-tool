import type { ColumnId } from "@/lib/column-ids";
import React from "react";
import { Table } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  StretchHorizontal,
  Type,
} from "lucide-react";

import { useEfficiencySettings } from "@/components/efficiency";
import { ChaosOrbIcon, DustIcon, GoldIcon } from "@/components/icons";
import { TotalCostIcon } from "@/components/icons/total-cost-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UnitSeparator } from "@/components/unit-separator";
import { COLUMN_IDS } from "@/lib/column-ids";
import { EFFICIENCY_MODES, EfficiencyMode } from "@/lib/efficiency";
import { assertNever, cn } from "@/lib/utils";

type SortOption = {
  id: ColumnId;
  label: string;
  icons: React.ReactNode;
};

type MobileSortingControlsProps<TData> = {
  table: Table<TData>;
  className?: string;
};

function getDirectionLabel(descending: boolean) {
  return descending ? "descending" : "ascending";
}

function getSortOptionLabel(
  option: SortOption,
  currentSort?: { id: string; desc: boolean },
) {
  if (currentSort?.id !== option.id) {
    return `Sort by ${option.label}, descending`;
  }

  const currentDirection = getDirectionLabel(currentSort.desc);
  const nextDirection = getDirectionLabel(!currentSort.desc);

  return `${option.label}, currently ${currentDirection}. Select to sort ${nextDirection}`;
}

function SortDirectionIcon({ descending }: { descending: boolean }) {
  const Icon = descending ? ArrowDown : ArrowUp;

  return <Icon className="size-4" aria-hidden="true" />;
}

function DustPerChaosIcons() {
  return (
    <>
      <DustIcon className="size-4" />
      <UnitSeparator />
      <ChaosOrbIcon className="size-4" />
    </>
  );
}

function EfficiencyIcons({ mode }: { mode: EfficiencyMode }) {
  switch (mode) {
    case "per-slot":
      return (
        <>
          <DustIcon className="size-4" />
          <UnitSeparator />
          <ChaosOrbIcon className="size-4" />
          <UnitSeparator />
          <StretchHorizontal className="size-4" />
        </>
      );

    case "per-gold":
      return (
        <>
          <DustIcon className="size-4" />
          <UnitSeparator />
          <GoldIcon className="size-4" />
        </>
      );

    case "total-cost":
      return (
        <>
          <DustIcon className="size-4" />
          <UnitSeparator />
          <TotalCostIcon className="size-4" />
        </>
      );

    default:
      return assertNever(mode);
  }
}

export function MobileSortingControls<TData>({
  table,
  className,
}: MobileSortingControlsProps<TData>) {
  "use memo";

  const { settings } = useEfficiencySettings();
  const sorting = table.options.state?.sorting ?? [];
  const currentSort = sorting[0];
  const sortOptions: SortOption[] = [
    {
      id: COLUMN_IDS.DUST_PER_CHAOS,
      label: "Dust / Chaos",
      icons: <DustPerChaosIcons />,
    },
    {
      id: COLUMN_IDS.EFFICIENCY,
      label: `Efficiency · ${EFFICIENCY_MODES[settings.mode].columnLabel}`,
      icons: <EfficiencyIcons mode={settings.mode} />,
    },
    {
      id: COLUMN_IDS.NAME,
      label: "Name",
      icons: <Type className="size-4" />,
    },
    {
      id: COLUMN_IDS.CHAOS,
      label: "Price",
      icons: <ChaosOrbIcon className="size-4" />,
    },
    {
      id: COLUMN_IDS.CALCULATED_DUST_VALUE,
      label: "Dust Value",
      icons: <DustIcon className="size-4" />,
    },
    {
      id: COLUMN_IDS.GOLD_FEE,
      label: "Gold Fee",
      icons: <GoldIcon className="size-4" />,
    },
  ];

  const currentOption = sortOptions.find(
    (option) => option.id === currentSort?.id,
  );

  const currentLabel = currentOption?.label ?? currentSort?.id;
  const currentDirection = currentSort
    ? getDirectionLabel(currentSort.desc)
    : undefined;

  const triggerLabel =
    currentLabel && currentDirection
      ? `Sort options. Current: ${currentLabel}, ${currentDirection}`
      : "Sort options";

  const handleSort = (columnId: ColumnId) => {
    const [previous] = table.getState().sorting;

    table.setSorting([
      {
        id: columnId,
        desc: !previous || previous.id !== columnId || !previous.desc,
      },
    ]);
  };

  return (
    <div className="lg:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn("group gap-3", className)}
            aria-label={triggerLabel}
          >
            <span aria-hidden="true" className="contents">
              <ArrowUpDown className="size-4 shrink-0" />

              <span>Sort</span>

              {currentSort && (
                <span className="text-muted-foreground ml-1 inline-flex min-w-0 items-center gap-2 font-normal">
                  <span className="inline-flex shrink-0 items-center gap-1">
                    {currentOption?.icons}
                  </span>

                  <SortDirectionIcon descending={currentSort.desc} />
                </span>
              )}
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="min-w-[270px]"
          aria-label="Sort options"
        >
          {sortOptions.map((option) => {
            const active = currentSort?.id === option.id;

            return (
              <DropdownMenuItem
                key={option.id}
                onSelect={() => handleSort(option.id)}
                className="flex items-center justify-between gap-3"
                aria-label={getSortOptionLabel(option, currentSort)}
              >
                <span
                  className="flex min-w-0 items-center justify-between gap-3"
                  aria-hidden="true"
                >
                  <span className="flex min-w-0 items-center gap-4">
                    <span className="text-muted-foreground flex min-w-20 shrink-0 items-center gap-1">
                      {option.icons}
                    </span>

                    <span className="truncate">{option.label}</span>
                  </span>

                  {active && (
                    <span className="text-muted-foreground shrink-0">
                      <SortDirectionIcon descending={currentSort.desc} />
                    </span>
                  )}
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
