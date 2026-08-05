import type { Item } from "@/lib/item-data";
import { useEffect, useRef, useState } from "react";
import { Table } from "@tanstack/react-table";

import { Input } from "@/components/ui/input";
import { XButton } from "@/components/ui/x-button";

export function NameFilter<TData extends Item>({
  table,
}: {
  table: Table<TData>;
}) {
  const column = table.getColumn("name");
  const getExternal = () => (column?.getFilterValue() as string) ?? "";

  // Local controlled state
  const [value, setValue] = useState<string>(getExternal());

  // Track what we last wrote into the column from this component
  const lastPushedValueRef = useRef<string>(getExternal());

  // Debounced filter setter
  useEffect(() => {
    const handler = setTimeout(() => {
      if (!column) return;
      // Skip when the value already matches the table state (e.g., the initial
      // mount with an empty filter). Pushing a no-op value creates a new
      // columnFilters reference, which triggers TanStack Table's
      // _autoResetPageIndex and resets the current page.
      if (getExternal() === value) return;
      column.setFilterValue(value);
      lastPushedValueRef.current = value;
    }, 250);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, column]);

  // Keep local state in sync if external table state changes (e.g., clear from chip),
  // but avoid overwriting active user input with stale values.
  useEffect(() => {
    const external = getExternal();

    // If the external value matches what we last intentionally pushed,
    // it's just our own update coming back through the table; ignore.
    if (external === lastPushedValueRef.current) {
      return;
    }

    // Otherwise, treat as a true external change and adopt it.
    setValue(external);
    lastPushedValueRef.current = external;
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
            lastPushedValueRef.current = "";
          }}
        >
          ×
        </XButton>
      )}
    </div>
  );
}
