import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { XButton } from "@/components/ui/x-button";
import { COLUMN_IDS } from "@/lib/column-ids";
import {
  getFilterValue,
  setColumnFilter,
  useNameFilterValue,
} from "@/lib/filters";
import { AppTable } from "@/lib/table-features";
import { ViewItem } from "@/lib/view-item";

export function NameFilter<TData extends ViewItem>({
  table,
}: {
  table: AppTable<TData>;
}) {
  const getExternal = () =>
    getFilterValue<string>(table.atoms.columnFilters.get(), COLUMN_IDS.NAME) ??
    "";

  // Local controlled state
  const [value, setValue] = useState<string>(getExternal());

  // Track what we last wrote into the column from this component
  const lastPushedValueRef = useRef<string>(getExternal());

  // React to external column filter changes (e.g., clear from chip)
  const nameFilterValue = useNameFilterValue(table);

  // Debounced filter setter
  useEffect(() => {
    const handler = setTimeout(() => {
      // Skip when the value already matches the table state (e.g., the initial
      // mount with an empty filter). Pushing a no-op value creates a new
      // columnFilters reference, which triggers TanStack Table's
      // _autoResetPageIndex and briefly snaps the page back mid-pagination,
      // which made some tests flaky.
      if (lastPushedValueRef.current === value) return;
      setColumnFilter(table, COLUMN_IDS.NAME, value);
      lastPushedValueRef.current = value;
    }, 250);

    return () => clearTimeout(handler);
  }, [value, table]);

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
  }, [nameFilterValue]);

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
            setColumnFilter(table, COLUMN_IDS.NAME, "");
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
