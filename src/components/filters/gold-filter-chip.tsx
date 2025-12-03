import type { RangeFilterValue } from "@/lib/range-filter";

import { GoldIcon } from "@/components/gold-icon";
import { Badge } from "@/components/ui/badge";
import { XButton } from "@/components/ui/x-button";
import { hasMaxFilter, hasMinFilter } from "@/lib/range-filter";

interface GoldFilterChipProps {
  value?: RangeFilterValue;
  onClear: () => void;
}

export function GoldFilterChip({ value, onClear }: GoldFilterChipProps) {
  if (!value) return null;

  const hasMin = hasMinFilter(value);
  const hasMax = hasMaxFilter(value);
  if (!hasMin && !hasMax) return null;

  const formatGoldRange = () => {
    if (!hasMin) return `≤ ${value.max?.toLocaleString()}`;
    if (!hasMax) return `≥ ${value.min?.toLocaleString()}`;

    return (
      <>
        {value.min?.toLocaleString()}
        <GoldIcon />– {value.max?.toLocaleString()}
      </>
    );
  };

  return (
    <Badge
      variant="outline"
      className="inline-flex items-center gap-1 px-3"
      data-testid="gold-filter-chip"
    >
      <span className="inline-flex min-w-0 flex-shrink-0 items-center gap-1 truncate">
        Gold {formatGoldRange()}
        <span className="flex-shrink-0">
          <GoldIcon />
        </span>
      </span>
      <XButton
        onClick={onClear}
        aria-label="Clear gold filter"
        className="text-foreground/90"
      />
    </Badge>
  );
}
