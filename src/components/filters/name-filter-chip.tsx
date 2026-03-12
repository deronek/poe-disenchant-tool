import type { Column } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { XButton } from "@/components/ui/x-button";
import { useFilterStatus } from "./use-filter-status";

interface NameFilterChipProps<TData> {
  column: Column<TData, unknown> | undefined;
}

export function NameFilterChip<TData>({ column }: NameFilterChipProps<TData>) {
  const value = column?.getFilterValue() as string | undefined;
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
              onClick={() => column?.setFilterValue("")}
              aria-label="Clear name filter"
              className="text-foreground/90"
            />
          </Badge>
        </div>
      )}
    </>
  );
}
