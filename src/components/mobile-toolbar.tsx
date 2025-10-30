import type { AdvancedSettings } from "@/components/advanced-settings-panel";
import type { PriceFilterValue } from "@/components/price-filter";
import type { Item } from "@/lib/itemData";
import { Table } from "@tanstack/react-table";

import { AdvancedSettingsPanel } from "@/components/advanced-settings-panel";
import { NameFilter } from "@/components/name-filter";
import { PriceFilter } from "@/components/price-filter";
import { ClearMarksButton } from "./clear-marks-button";
import { COLUMN_IDS } from "./columns";
import { MobileSortingControls } from "./mobile-sorting-controls";
import { NameFilterChip } from "./name-filter-chip";
import { PriceFilterChip } from "./price-filter-chip";

type MobileToolbarProps<TData extends Item> = {
  table: Table<TData>;
  onClearMarks?: () => void;
  advancedSettings: AdvancedSettings;
  onAdvancedSettingsChange: (settings: AdvancedSettings) => void;
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
          <PriceFilter
            column={table.getColumn(COLUMN_IDS.CHAOS)}
            min={1}
            max={500}
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
            ?.getFilterValue() as PriceFilterValue | undefined;

          const hasActiveFilters = nameFilter !== "" || !!chaosRange;

          return hasActiveFilters ? (
            <div className="flex flex-wrap gap-1">
              <NameFilterChip
                value={nameFilter}
                onClear={() =>
                  table.getColumn(COLUMN_IDS.NAME)?.setFilterValue("")
                }
              />
              <PriceFilterChip
                value={chaosRange}
                onClear={() =>
                  table.getColumn(COLUMN_IDS.CHAOS)?.setFilterValue(undefined)
                }
              />
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
}
