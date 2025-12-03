import type { RangeFilterValue } from "@/lib/range-filter";

import { DustIcon } from "@/components/dust-icon";
import { Badge } from "@/components/ui/badge";
import { XButton } from "@/components/ui/x-button";
import { hasMaxFilter, hasMinFilter } from "@/lib/range-filter";

interface DustFilterChipProps {
  value?: RangeFilterValue;
  onClear: () => void;
}

export function DustFilterChip({ value, onClear }: DustFilterChipProps) {
  if (!value) return null;

  const hasMin = hasMinFilter(value);
  const hasMax = hasMaxFilter(value);
  if (!hasMin && !hasMax) return null;

  const formatDustRange = () => {
    if (!hasMin) return `≤ ${value.max?.toLocaleString()}`;
    if (!hasMax) return `≥ ${value.min?.toLocaleString()}`;

    return (
      <>
        {value.min?.toLocaleString()}
        <DustIcon />– {value.max?.toLocaleString()}
      </>
    );
  };

  return (
    <Badge
      variant="outline"
      className="inline-flex items-center gap-1 px-3"
      data-testid="dust-filter-chip"
    >
      <span className="inline-flex min-w-0 flex-shrink-0 items-center gap-1 truncate">
        Dust {formatDustRange()}
        <span className="flex-shrink-0">
          <DustIcon />
        </span>
      </span>
      <XButton
        onClick={onClear}
        aria-label="Clear dust filter"
        className="text-foreground/90"
      />
    </Badge>
  );
}
