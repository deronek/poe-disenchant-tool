import type { AdvancedSettings } from "@/components/advanced-settings-panel";
import type { Item } from "@/lib/itemData";
import { Table } from "@tanstack/react-table";

import { AdvancedSettingsPanel } from "@/components/advanced-settings-panel";
import {
  DustFilterChip,
  NameFilter,
  NameFilterChip,
  PriceFilterChip,
  TabbedFilter,
} from "@/components/filters";
import { RangeFilterValue } from "@/lib/range-filter";
import { ClearMarksButton } from "./clear-marks-button";
import { COLUMN_IDS } from "./columns";
import { MobileSortingControls } from "./mobile-sorting-controls";

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
            priceMin={0}
            priceMax={500}
            dustMin={2000}
            dustMax={5000000}
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

        {(() => {
          const nameFilter =
            (table.getColumn(COLUMN_IDS.NAME)?.getFilterValue() as string) ??
            "";
          const chaosRange = table
            .getColumn(COLUMN_IDS.CHAOS)
            ?.getFilterValue() as RangeFilterValue | undefined;
          const dustRange = table
            .getColumn(COLUMN_IDS.CALCULATED_DUST_VALUE)
            ?.getFilterValue() as RangeFilterValue | undefined;

          const hasActiveFilters =
            nameFilter !== "" || !!chaosRange || !!dustRange;

          return hasActiveFilters ? (
            <div className="flex flex-wrap gap-1">
              <NameFilterChip
                value={nameFilter}
                onClear={() =>
                  table.getColumn(COLUMN_IDS.NAME)?.setFilterValue("")
                }
              />
              {chaosRange && (
                <PriceFilterChip
                  value={chaosRange}
                  onClear={() =>
                    table.getColumn(COLUMN_IDS.CHAOS)?.setFilterValue(undefined)
                  }
                />
              )}
              {dustRange && (
                <DustFilterChip
                  value={dustRange}
                  onClear={() =>
                    table
                      .getColumn(COLUMN_IDS.CALCULATED_DUST_VALUE)
                      ?.setFilterValue(undefined)
                  }
                />
              )}
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
}
