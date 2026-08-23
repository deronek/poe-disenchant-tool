import type { AppTable } from "@/lib/table-features";
import type { RowData } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { XButton } from "@/components/ui/x-button";
import { ColumnId } from "@/lib/column-ids";
import {
  hasMaxFilter,
  hasMinFilter,
  resetColumnFilter,
  useRangeFilterValue,
} from "@/lib/filters";
import { useFilterStatus } from "./use-filter-status";

export interface RangeFilterChipProps<TData extends RowData> {
  table: AppTable<TData>;
  columnId: ColumnId;
  title: string;
  icon: React.ReactNode;
  testId: string;
  ariaLabel: string;
}

export function RangeFilterChip<TData extends RowData>({
  table,
  columnId,
  title,
  icon,
  testId,
  ariaLabel,
}: RangeFilterChipProps<TData>) {
  const value = useRangeFilterValue(table, columnId);

  const hasMin = hasMinFilter(value);
  const hasMax = hasMaxFilter(value);
  const hasValue = hasMin || hasMax;

  const formatRange = () => {
    if (!hasValue) return "";
    if (!hasMin) return `≤ ${value.max!.toLocaleString() ?? ""}`;
    if (!hasMax) return `≥ ${value.min!.toLocaleString() ?? ""}`;

    return (
      <>
        {value.min.toLocaleString()}
        {icon}– {value.max.toLocaleString()}
      </>
    );
  };

  const formatLiveRegionText = () => {
    if (!hasValue) return "";
    if (!hasMin)
      return `${title} filter applied: ≤ ${value.max.toLocaleString()}`;
    if (!hasMax)
      return `${title} filter applied: ≥ ${value.min.toLocaleString()}`;
    return `${title} filter applied: ${value.min.toLocaleString()} – ${value.max.toLocaleString()}`;
  };

  const statusRef = useFilterStatus(
    !!hasValue,
    formatLiveRegionText(),
    `${title} filter cleared`,
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
        <Badge
          variant="outline"
          className="inline-flex min-w-0 items-center gap-1 px-3"
          data-testid={testId}
        >
          <span className="inline-flex min-w-0 items-center gap-1 truncate tabular-nums">
            {title} {formatRange()}
            <span className="flex-shrink-0">{icon}</span>
          </span>
          <XButton
            onClick={() => resetColumnFilter(table, columnId)}
            aria-label={ariaLabel}
            className="text-foreground/90"
          />
        </Badge>
      )}
    </>
  );
}
