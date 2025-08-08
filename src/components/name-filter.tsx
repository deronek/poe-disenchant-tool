"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Table } from "@tanstack/react-table";
import type { Item } from "@/lib/itemData";

export function NameFilter<TData extends Item>({
  table,
}: {
  table: Table<TData>;
}) {
  const column = table.getColumn("name");

  // Local controlled state to avoid stale refs from table.getColumn()
  const [value, setValue] = useState<string>(
    (column?.getFilterValue() as string) ?? "",
  );

  // Keep local state in sync if external table state changes (e.g., clear from chip)
  useEffect(() => {
    const external = (column?.getFilterValue() as string) ?? "";
    setValue(external);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.getState().columnFilters]);

  return (
    <div className="relative w-full md:max-w-xs">
      <Input
        placeholder="Filter by name or variant..."
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          setValue(v);
          column?.setFilterValue(v);
        }}
        aria-label="Filter by name or variant"
        className="text-sm"
      />
      {value.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Clear name filter"
          className="text-muted-foreground absolute top-1/2 right-1.5 h-7 w-7 -translate-y-1/2 cursor-pointer rounded-md p-0"
          onClick={() => {
            column?.setFilterValue("");
            setValue("");
          }}
        >
          ×
        </Button>
      )}
    </div>
  );
}
