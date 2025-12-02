import type { RangeFilterValue } from "@/lib/range-filter";

import { ChaosOrbIcon } from "@/components/chaos-orb-icon";
import { Badge } from "@/components/ui/badge";
import { XButton } from "@/components/ui/x-button";
import { hasMaxFilter, hasMinFilter } from "@/lib/range-filter";

interface PriceFilterChipProps {
  value?: RangeFilterValue;
  onClear: () => void;
}

export function PriceFilterChip({ value, onClear }: PriceFilterChipProps) {
  if (!value) return null;

  const hasMin = hasMinFilter(value);
  const hasMax = hasMaxFilter(value);
  if (!hasMin && !hasMax) return null;

  const formatPriceRange = () => {
    if (!hasMin) return `≤ ${value.max}`;
    if (!hasMax) return `≥ ${value.min}`;
    return (
      <>
        {value.min}
        <ChaosOrbIcon />– {value.max}
      </>
    );
  };
  return (
    <Badge
      variant="outline"
      className="inline-flex items-center gap-1 px-3"
      data-testid="price-filter-chip"
    >
      <span className="inline-flex min-w-0 flex-shrink-0 items-center gap-1 truncate">
        Price {formatPriceRange()}
        <span className="flex-shrink-0">
          <ChaosOrbIcon />
        </span>
      </span>
      <XButton
        onClick={onClear}
        aria-label="Clear price filter"
        className="text-foreground/90"
      />
    </Badge>
  );
}
