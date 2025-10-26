import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Table } from "@tanstack/react-table";

type ClearMarksButtonProps<TData> = {
  table: Table<TData>;
  onClearMarks?: () => void;
  className?: string;
};

export function ClearMarksButton<TData>({
  table,
  onClearMarks,
  className,
}: ClearMarksButtonProps<TData>) {
  const numberOfSelectedRows = Object.keys(
    table.getState().rowSelection,
  ).length;

  return (
    onClearMarks && (
      <Button
        variant="secondary"
        onClick={onClearMarks}
        title="Clear all marked rows"
        aria-label="Clear all marked rows"
        disabled={numberOfSelectedRows === 0}
        className={cn("gap-1", className)}
      >
        Clear marks{" "}
        <span className="tabular-nums">({numberOfSelectedRows})</span>
      </Button>
    )
  );
}
