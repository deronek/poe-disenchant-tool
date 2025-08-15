import { XButton } from "@/components/ui/x-button";
import { Badge } from "@/components/ui/badge";
import { ChaosOrbIcon } from "@/components/chaos-orb-icon";
import { Table } from "@tanstack/react-table";
import { COLUMN_IDS } from "./columns";

interface PriceFilterChipProps<TData> {
  table: Table<TData>;
}

export function PriceFilterChip<TData>({ table }: PriceFilterChipProps<TData>) {
  const chaosRange = table.getColumn(COLUMN_IDS.CHAOS)?.getFilterValue() as
    | { min: number; max: number }
    | undefined;

  if (!chaosRange) {
    return null;
  }

  return (
    <Badge variant="outline" className="inline-flex items-center gap-1">
      <span className="inline-flex min-w-0 flex-shrink-0 items-center gap-1 truncate">
        Price: {`${chaosRange.min}–${chaosRange.max}`}
        <span className="flex-shrink-0">
          <ChaosOrbIcon />
        </span>
      </span>
      <XButton
        onClick={() =>
          table.getColumn(COLUMN_IDS.CHAOS)?.setFilterValue(undefined)
        }
        aria-label="Clear price filter"
        className="text-foreground/90"
      />
    </Badge>
  );
}
