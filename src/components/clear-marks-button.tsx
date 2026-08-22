import type { AppTable } from "@/lib/table-features";
import type { RowData } from "@tanstack/react-table";
import { useSelector } from "@tanstack/react-store";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ClearMarksButtonProps<TData extends RowData> = {
  table: AppTable<TData>;
  onClearMarks?: () => void;
  className?: string;
};

export function ClearMarksButton<TData extends RowData>({
  table,
  onClearMarks,
  className,
}: ClearMarksButtonProps<TData>) {
  const numberOfSelectedRows = useSelector(
    table.atoms.rowSelection,
    (s) => Object.keys(s).length,
  );

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
        Clear Marks{" "}
        <span className="tabular-nums">({numberOfSelectedRows})</span>
      </Button>
    )
  );
}
