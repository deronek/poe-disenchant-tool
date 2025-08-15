import { Button } from "@/components/ui/button";
import type { Table } from "@tanstack/react-table";

type ClearMarksButtonProps<TData> = {
  table: Table<TData>;
  onClearMarks?: () => void;
};

export function ClearMarksButton<TData>({
  table,
  onClearMarks,
}: ClearMarksButtonProps<TData>) {
  const numberOfSelectedrows = Object.keys(
    table.getState().rowSelection,
  ).length;

  return (
    onClearMarks && (
      <Button
        variant="outline"
        onClick={onClearMarks}
        title="Clear all marked rows"
        aria-label="Clear all marked rows"
        disabled={numberOfSelectedrows === 0}
        className="w-full gap-1 xl:w-auto"
      >
        Clear marks{" "}
        <span className="tabular-nums">({numberOfSelectedrows})</span>
      </Button>
    )
  );
}
