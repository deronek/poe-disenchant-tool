import { Input } from "@/components/ui/input";
import type { Item } from "@/lib/itemData";
import { Table } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { XButton } from "./ui/x-button";

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

  // Debounced filter setter
  const debouncedSetFilter = useDebouncedCallback((newValue: string) => {
    column?.setFilterValue(newValue);
  }, 250);

  // Keep local state in sync if external table state changes (e.g., clear from chip)
  useEffect(() => {
    const external = (column?.getFilterValue() as string) ?? "";
    setValue(external);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.getState().columnFilters]);

  return (
    <div className="relative">
      <Input
        placeholder="Filter by name or variant..."
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          setValue(v);
          debouncedSetFilter(v);
        }}
        aria-label="Filter by name or variant"
        className="pr-8"
        maxLength={50}
      />
      {value.length > 0 && (
        <XButton
          aria-label="Clear name filter"
          className="absolute top-1/2 right-1.5 h-8 w-8 -translate-y-1/2"
          onClick={() => {
            column?.setFilterValue("");
            setValue("");
          }}
        >
          ×
        </XButton>
      )}
    </div>
  );
}
