import type { AdvancedSettings } from "@/components/advanced-settings-panel";
import type { Item } from "@/lib/item-data";
import { Table } from "@tanstack/react-table";

import { AdvancedSettingsPanel } from "@/components/advanced-settings-panel";
import { ClearMarksButton } from "@/components/clear-marks-button";
import { FilterChips, NameFilter, TabbedFilter } from "@/components/filters";
import { MobileSortingControls } from "@/components/mobile";
import { COLUMN_IDS } from "@/lib/column-ids";

type ToolbarProps<TData extends Item> = {
  table: Table<TData>;
  onClearMarks?: () => void;
  advancedSettings: AdvancedSettings;
  onAdvancedSettingsChange: (
    update: AdvancedSettings | ((prev: AdvancedSettings) => AdvancedSettings),
  ) => void;
};

export function DataTableToolbar<TData extends Item>({
  table,
  onClearMarks,
  advancedSettings,
  onAdvancedSettingsChange,
}: ToolbarProps<TData>) {
  return (
    <div className="bg-background-200 flex gap-3 border-b p-3">
      <div className="w-full">
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

          <div className="xl:col-span-auto col-span-2">
            <FilterChips table={table} />
          </div>
        </div>
      </div>

      {/* Sorting Controls - Mobile Only */}
      <MobileSortingControls table={table} />

      <div className="flex flex-col items-center gap-2 md:ml-auto xl:flex-row">
        {/* Advanced Settings */}
        <AdvancedSettingsPanel
          settings={advancedSettings}
          onSettingsChange={onAdvancedSettingsChange}
          className="w-full xl:w-auto"
        />

        <ClearMarksButton
          table={table}
          onClearMarks={onClearMarks}
          className="w-full xl:w-auto"
        />
      </div>
    </div>
  );
}
