import type { RangeFilterValue } from "@/lib/filters";
import type { Column } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { XButton } from "@/components/ui/x-button";
import { hasMaxFilter, hasMinFilter } from "@/lib/filters";
import { useFilterStatus } from "./use-filter-status";

export interface RangeFilterChipProps<TData> {
  column: Column<TData, unknown>;
  title: string;
  icon: React.ReactNode;
  testId: string;
  ariaLabel: string;
}

export function RangeFilterChip<TData>({
  column,
  title,
  icon,
  testId,
  ariaLabel,
}: RangeFilterChipProps<TData>) {
  const value = column?.getFilterValue() as RangeFilterValue | undefined;

  const hasMin = value && hasMinFilter(value);
  const hasMax = value && hasMaxFilter(value);
  const hasValue = hasMin || hasMax;

  const formatRange = () => {
    if (!value) return "";
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
    if (!value || !hasValue) return "";
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
            onClick={() => column?.setFilterValue(undefined)}
            aria-label={ariaLabel}
            className="text-foreground/90"
          />
        </Badge>
      )}
    </>
  );
}
