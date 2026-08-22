import type { AppTable } from "@/lib/table-features";
import type { ViewItem } from "@/lib/view-item";

import { useAdvancedSettings } from "@/components/advanced-settings-context";
import { AdvancedSettingsPanel } from "@/components/advanced-settings-panel";
import { ClearMarksButton } from "@/components/clear-marks-button";
import { EfficiencySettingsControl } from "@/components/efficiency";
import { FilterChips, NameFilter, TabbedFilter } from "@/components/filters";

type ToolbarProps<TData extends ViewItem> = {
  table: AppTable<TData>;
  onClearMarks?: () => void;
};

export function DataTableToolbar<TData extends ViewItem>({
  table,
  onClearMarks,
}: ToolbarProps<TData>) {
  const { settings, setSettings } = useAdvancedSettings();
  return (
    <div className="bg-background-200 grid grid-cols-1 gap-3 border-b p-3 xl:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <div className="grid grid-cols-[minmax(0,theme(maxWidth.3xs))_1fr] items-start gap-3 xl:flex xl:flex-nowrap xl:items-center">
          <div className="w-full min-w-0 xl:w-3xs xl:flex-none">
            <NameFilter table={table} />
          </div>

          <div className="w-full min-w-0 xl:w-auto xl:shrink-0">
            <TabbedFilter table={table} />
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
