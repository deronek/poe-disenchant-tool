import type { AppTable } from "@/lib/table-features";

import { ViewItem } from "@/lib/view-item";
import { NameFilterChip } from "./name-filter-chip";
import { RangeFilterChip } from "./range-filter-chip";
import {
  RANGE_FILTER_FIELD_CONFIGS,
  RANGE_FILTER_FIELD_LIST,
} from "./range-filter-fields";

interface FilterChipsProps<TData extends ViewItem> {
  table: AppTable<TData>;
}

export function FilterChips<TData extends ViewItem>({
  table,
}: FilterChipsProps<TData>) {
  return (
    <div className="flex flex-wrap gap-x-1">
      <NameFilterChip table={table} />
      {RANGE_FILTER_FIELD_LIST.map((field) => {
        const config = RANGE_FILTER_FIELD_CONFIGS[field];
        return (
          <RangeFilterChip
            key={field}
            table={table}
            columnId={config.columnId}
            title={config.label}
            icon={<config.icon />}
            testId={`${field}-filter-chip`}
            ariaLabel={`Clear ${config.label} filter`}
          />
        );
      })}
    </div>
  );
}
