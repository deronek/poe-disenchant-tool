import type { AppTable } from "@/lib/table-features";
import type { RowData } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { XButton } from "@/components/ui/x-button";
import { COLUMN_IDS } from "@/lib/column-ids";
import { setColumnFilter, useNameFilterValue } from "@/lib/filters";
import { useFilterStatus } from "./use-filter-status";

interface NameFilterChipProps<TData extends RowData> {
  table: AppTable<TData>;
}

export function NameFilterChip<TData extends RowData>({
  table,
}: NameFilterChipProps<TData>) {
  const value = useNameFilterValue(table);
  const hasValue = value && value.trim() !== "";

  const statusRef = useFilterStatus(
    !!hasValue,
    `Name filter applied: ${value}`,
    "Name filter cleared",
  );

  return (
    <>
      {/* Live region (always mounted) */}
      <span
        ref={statusRef}
        role="status"
        aria-live="polite"
        className="sr-only"
      />

      {!hasValue ? null : (
        <div className="w-auto min-w-0 xl:shrink-0">
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1 px-3"
            data-testid="name-filter-chip"
          >
            <span className="inline-flex min-w-0 flex-shrink-0 items-center gap-1 truncate">
              Name: {value}
            </span>
            <XButton
              onClick={() => setColumnFilter(table, COLUMN_IDS.NAME, "")}
              aria-label="Clear name filter"
              className="text-foreground/90"
            />
          </Badge>
        </div>
      )}
    </>
  );
}
