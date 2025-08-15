import { XButton } from "@/components/ui/x-button";
import { Badge } from "@/components/ui/badge";
import { Table } from "@tanstack/react-table";
import { COLUMN_IDS } from "./columns";

interface NameFilterChipProps<TData> {
  table: Table<TData>;
}

export function NameFilterChip<TData>({ table }: NameFilterChipProps<TData>) {
  const nameFilter =
    (table.getColumn(COLUMN_IDS.NAME)?.getFilterValue() as string) ?? "";

  if (nameFilter === "") {
    return null;
  }

  return (
    <Badge variant="outline">
      Name: {nameFilter}
      <XButton
        onClick={() => table.getColumn(COLUMN_IDS.NAME)?.setFilterValue("")}
        aria-label="Clear name filter"
        className="text-foreground/90"
      />
    </Badge>
  );
}
