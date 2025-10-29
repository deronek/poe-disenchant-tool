import { XButton } from "@/components/ui/x-button";
import { Badge } from "@/components/ui/badge";
import { ChaosOrbIcon } from "@/components/chaos-orb-icon";
import type { PriceFilterValue } from "@/components/price-filter";

interface PriceFilterChipProps {
  value?: PriceFilterValue;
  onClear: () => void;
}

export function PriceFilterChip({ value, onClear }: PriceFilterChipProps) {
  if (!value) {
    return null;
  }

  const formatPriceRange = () => {
    if (value.max === undefined) {
      return `≥ ${value.min}`;
    }
    return `${value.min}–${value.max}`;
  };

  return (
    <Badge
      variant="outline"
      className="inline-flex items-center gap-1 px-3"
      data-testid="price-filter-chip"
    >
      <span className="inline-flex min-w-0 flex-shrink-0 items-center gap-1 truncate">
        Price: {formatPriceRange()}
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
