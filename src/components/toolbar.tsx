import type { ViewItem } from "@/lib/view-item";
import { Table } from "@tanstack/react-table";

import { useAdvancedSettings } from "@/components/advanced-settings-context";
import { AdvancedSettingsPanel } from "@/components/advanced-settings-panel";
import { ClearMarksButton } from "@/components/clear-marks-button";
import { EfficiencySettingsControl } from "@/components/efficiency";
import { FilterChips, NameFilter, TabbedFilter } from "@/components/filters";
import { COLUMN_IDS } from "@/lib/column-ids";

type ToolbarProps<TData extends ViewItem> = {
  table: Table<TData>;
  onClearMarks?: () => void;
};

export function DataTableToolbar<TData extends ViewItem>({
  table,
  onClearMarks,
}: ToolbarProps<TData>) {
  const { settings, setSettings } = useAdvancedSettings();
  return (
    <div className="bg-background-200 grid grid-cols-1 items-start gap-3 border-b p-3 xl:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <div className="grid grid-cols-[minmax(0,theme(maxWidth.3xs))_1fr] items-start gap-3 xl:flex xl:flex-nowrap xl:items-center">
          <div className="w-full min-w-0 xl:w-3xs xl:flex-none">
            <NameFilter table={table} />
          </div>

          <div className="w-full min-w-0 xl:w-auto xl:shrink-0">
            <TabbedFilter
              priceColumn={table.getColumn(COLUMN_IDS.CHAOS)}
              dustColumn={table.getColumn(COLUMN_IDS.CALCULATED_DUST_VALUE)}
              goldColumn={table.getColumn(COLUMN_IDS.GOLD_FEE)}
              priceMin={0}
              priceMax={500}
              dustMin={2000}
              dustMax={5000000}
              goldMin={1500}
              goldMax={80000}
            />
          </div>

          <div className="col-span-2 xl:col-span-1">
            <FilterChips table={table} />
          </div>
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-end gap-2">
        <EfficiencySettingsControl />

        <AdvancedSettingsPanel
          settings={settings}
          onSettingsChange={setSettings}
          className="w-auto shrink-0"
        />

        <ClearMarksButton
          table={table}
          onClearMarks={onClearMarks}
          className="w-auto shrink-0"
        />
      </div>
    </div>
  );
}
