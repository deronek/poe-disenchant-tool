import { XButton } from "@/components/ui/x-button";
import { Badge } from "@/components/ui/badge";

interface NameFilterChipProps {
  value: string;
  onClear: () => void;
}

export function NameFilterChip({ value, onClear }: NameFilterChipProps) {
  // Ignores whitespace-only or empty filter
  if (value.trim() === "") {
    return null;
  }

  return (
    <Badge variant="outline" className="px-3" data-testid="name-filter-chip">
      Name: {value}
      <XButton
        onClick={onClear}
        aria-label="Clear name filter"
        className="text-foreground/90"
      />
    </Badge>
  );
}
