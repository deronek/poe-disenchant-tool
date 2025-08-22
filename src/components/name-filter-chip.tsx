import { XButton } from "@/components/ui/x-button";
import { Badge } from "@/components/ui/badge";

interface NameFilterChipProps {
  value: string;
  onClear: () => void;
}

export function NameFilterChip({ value, onClear }: NameFilterChipProps) {
  if (value === "") {
    return null;
  }

  return (
    <Badge variant="outline" className="px-3">
      Name: {value}
      <XButton
        onClick={onClear}
        aria-label="Clear name filter"
        className="text-foreground/90"
      />
    </Badge>
  );
}
