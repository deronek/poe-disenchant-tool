import type { Item } from "@/lib/itemData";
import { useLayoutEffect, useRef } from "react";
import { Table } from "@tanstack/react-table";
import { useDebouncedCallback } from "use-debounce";

import { Input } from "@/components/ui/input";
import { XButton } from "./ui/x-button";

export function NameFilter<TData extends Item>({
  table,
}: {
  table: Table<TData>;
}) {
  const column = table.getColumn("name");
  const externalValue = (column?.getFilterValue() as string) ?? "";

  const inputRef = useRef<HTMLInputElement>(null);
  const latestExternalValue = useRef(externalValue);

  // Debounced setter for the table’s filter value
  const debouncedSetFilter = useDebouncedCallback((newValue: string) => {
    column?.setFilterValue(newValue || undefined);
  }, 250);

  // Keep external table changes reflected in the input (e.g. cleared from elsewhere)
  useLayoutEffect(() => {
    if (latestExternalValue.current !== externalValue) {
      latestExternalValue.current = externalValue;
      if (inputRef.current && inputRef.current.value !== externalValue) {
        inputRef.current.value = externalValue;
      }
    }
  }, [externalValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    latestExternalValue.current = newValue;
    // Immediate UI reflection happens because it's an uncontrolled input
    debouncedSetFilter(newValue);
  };

  const handleClear = () => {
    debouncedSetFilter.cancel();
    latestExternalValue.current = "";
    if (inputRef.current) inputRef.current.value = "";
    column?.setFilterValue(undefined);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        defaultValue={externalValue}
        placeholder="Filter by name or variant..."
        onChange={handleChange}
        aria-label="Filter by name or variant"
        className="pr-8"
        maxLength={50}
      />
      {externalValue.length > 0 && (
        <XButton
          aria-label="Clear name filter"
          className="absolute top-1/2 right-1.5 h-8 w-8 -translate-y-1/2"
          onClick={handleClear}
        >
          ×
        </XButton>
      )}
    </div>
  );
}
