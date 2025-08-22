import { XButton } from "@/components/ui/x-button";
import { Badge } from "@/components/ui/badge";
import { ChaosOrbIcon } from "@/components/chaos-orb-icon";

interface PriceFilterChipProps {
  value?: { min: number; max: number };
  onClear: () => void;
}

export function PriceFilterChip({ value, onClear }: PriceFilterChipProps) {
  if (!value) {
    return null;
  }

  return (
    <Badge variant="outline" className="inline-flex items-center gap-1 px-3">
      <span className="inline-flex min-w-0 flex-shrink-0 items-center gap-1 truncate">
        Price: {`${value.min}–${value.max}`}
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
