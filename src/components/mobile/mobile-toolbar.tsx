import { Table } from "@tanstack/react-table";

import { useAdvancedSettings } from "@/components/advanced-settings-context";
import { AdvancedSettingsPanel } from "@/components/advanced-settings-panel";
import { ClearMarksButton } from "@/components/clear-marks-button";
import { EfficiencySettingsControl } from "@/components/efficiency";
import { FilterChips, NameFilter, TabbedFilter } from "@/components/filters";
import { EfficiencySortingControls } from "@/components/mobile";
import { COLUMN_IDS } from "@/lib/column-ids";
import { ViewItem } from "@/lib/view-item";

type MobileToolbarProps<TData extends ViewItem> = {
  table: Table<TData>;
  onClearMarks?: () => void;
};

export function MobileToolbar<TData extends ViewItem>({
  table,
  onClearMarks,
}: MobileToolbarProps<TData>) {
  const { settings, setSettings } = useAdvancedSettings();

  return (
    <div className="bg-background-200 flex flex-col gap-3 border-b px-2 py-4 sm:px-3">
      <div className="grid grid-cols-2 gap-2">
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
          className="w-full"
        />

        <EfficiencySortingControls table={table} className="w-full" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <EfficiencySettingsControl className="w-full" />

        <AdvancedSettingsPanel
          settings={settings}
          onSettingsChange={setSettings}
          className="w-full"
        />

        <ClearMarksButton
          table={table}
          onClearMarks={onClearMarks}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="md:w-3xs">
          <NameFilter table={table} />
        </div>

        <FilterChips table={table} />
      </div>
    </div>
  );
}
