import type { AdvancedSettings } from "@/components/advanced-settings-panel";
import type { Item } from "@/lib/item-data";
import { Table } from "@tanstack/react-table";

import { AdvancedSettingsPanel } from "@/components/advanced-settings-panel";
import { ClearMarksButton } from "@/components/clear-marks-button";
import { FilterChips, NameFilter, TabbedFilter } from "@/components/filters";
import { MobileSortingControls } from "@/components/mobile";
import { COLUMN_IDS } from "@/lib/column-ids";

type MobileToolbarProps<TData extends Item> = {
  table: Table<TData>;
  onClearMarks?: () => void;
  advancedSettings: AdvancedSettings;
  onAdvancedSettingsChange: (
    update: AdvancedSettings | ((prev: AdvancedSettings) => AdvancedSettings),
  ) => void;
};

export function MobileToolbar<TData extends Item>({
  table,
  onClearMarks,
  advancedSettings,
  onAdvancedSettingsChange,
}: MobileToolbarProps<TData>) {
  return (
    <div className="bg-background-200 flex flex-col gap-3 border-b px-2 py-4 sm:px-3">
      <div className="flex justify-between gap-2">
        {/* Primary Actions Row - Most Important Features */}

        <div className="flex max-w-[220px] flex-1 flex-col gap-1">
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
          <MobileSortingControls table={table} className="w-full" />
        </div>
        <div className="flex flex-col gap-1">
          <ClearMarksButton
            table={table}
            onClearMarks={onClearMarks}
            className="w-auto"
          />
          <AdvancedSettingsPanel
            settings={advancedSettings}
            onSettingsChange={onAdvancedSettingsChange}
            className="w-auto"
          />
        </div>
      </div>
      {/* Secondary Actions Row */}
      <div className="flex flex-col gap-2">
        <div className="md:w-3xs">
          <NameFilter table={table} />
        </div>

        <FilterChips table={table} />
      </div>
    </div>
  );
}
