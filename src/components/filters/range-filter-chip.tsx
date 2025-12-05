import type { RangeFilterValue } from "@/lib/range-filter";
import type { Column } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { XButton } from "@/components/ui/x-button";
import { hasMaxFilter, hasMinFilter } from "@/lib/range-filter";

export interface RangeFilterChipProps<TData> {
  column: Column<TData, unknown> | undefined;
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

  if (!value) return null;

  const hasMin = hasMinFilter(value);
  const hasMax = hasMaxFilter(value);
  if (!hasMin && !hasMax) return null;

  const formatRange = () => {
    if (!hasMin) return `≤ ${value.max!.toLocaleString()}`;
    if (!hasMax) return `≥ ${value.min!.toLocaleString()}`;

    return (
      <>
        {value.min!.toLocaleString()}
        {icon}– {value.max!.toLocaleString()}
      </>
    );
  };

  return (
    <div className="w-auto min-w-0 xl:shrink-0">
      <Badge
        variant="outline"
        className="inline-flex items-center gap-1 px-3"
        data-testid={testId}
      >
        <span className="inline-flex min-w-0 flex-shrink-0 items-center gap-1 truncate">
          {title} {formatRange()}
          <span className="flex-shrink-0">{icon}</span>
        </span>
        <XButton
          onClick={() => column?.setFilterValue(undefined)}
          aria-label={ariaLabel}
          className="text-foreground/90"
        />
      </Badge>
    </div>
  );
}
