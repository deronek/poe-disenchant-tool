import type { AppTable } from "@/lib/table-features";

import { useAdvancedSettings } from "@/components/advanced-settings-context";
import { AdvancedSettingsPanel } from "@/components/advanced-settings-panel";
import { ClearMarksButton } from "@/components/clear-marks-button";
import { EfficiencySettingsControl } from "@/components/efficiency";
import { FilterChips, NameFilter, TabbedFilter } from "@/components/filters";
import { MobileSortingControls } from "@/components/mobile";
import { ViewItem } from "@/lib/view-item";

type MobileToolbarProps<TData extends ViewItem> = {
  table: AppTable<TData>;
  onClearMarks?: () => void;
};

export function MobileToolbar<TData extends ViewItem>({
  table,
  onClearMarks,
}: MobileToolbarProps<TData>) {
  const { settings, setSettings } = useAdvancedSettings();

  return (
    <div className="bg-background-200 grid grid-cols-6 gap-2 border-b px-2 py-4 sm:px-3">
      <div className="col-span-3 min-w-0">
        <TabbedFilter table={table} className="w-full" />
      </div>

      <div className="col-span-3 min-w-0">
        <MobileSortingControls table={table} className="w-full" />
      </div>

      <div className="col-span-3 min-w-0 md:col-span-2">
        <EfficiencySettingsControl className="w-full" />
      </div>

      <div className="col-span-3 min-w-0 md:col-span-2">
        <AdvancedSettingsPanel
          settings={settings}
          onSettingsChange={setSettings}
          className="w-full"
        />
      </div>

      <div className="col-span-6 flex min-w-0 gap-2 md:contents">
        <div className="min-w-0 flex-1 md:order-7 md:col-span-6">
          <div className="min-w-0 md:w-3xs">
            <NameFilter table={table} />
          </div>
        </div>

        <div className="max-w-1/2 shrink-0 md:order-6 md:col-span-2 md:max-w-none">
          <ClearMarksButton
            table={table}
            onClearMarks={onClearMarks}
            className="w-full whitespace-nowrap"
          />
        </div>
      </div>

      <div className="col-span-6 min-w-0 md:order-8">
        <FilterChips table={table} />
      </div>
    </div>
  );
}
