import type { AdvancedSettings } from "@/components/advanced-settings-panel";
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

type ToolbarProps<TData extends Item> = {
  table: Table<TData>;
  onClearMarks?: () => void;
  advancedSettings: AdvancedSettings;
  onAdvancedSettingsChange: (settings: AdvancedSettings) => void;
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
            <PriceFilter
              column={table.getColumn(COLUMN_IDS.CHAOS)}
              min={1}
              max={500}
            />
          </div>

          {(() => {
            const nameFilter =
              (table.getColumn(COLUMN_IDS.NAME)?.getFilterValue() as string) ??
              "";
            const chaosRange = table
              .getColumn(COLUMN_IDS.CHAOS)
              ?.getFilterValue() as { min: number; max: number } | undefined;

            return (
              <>
                {nameFilter !== "" && (
                  <div className="w-auto min-w-0 xl:shrink-0">
                    <NameFilterChip
                      value={nameFilter}
                      onClear={() =>
                        table.getColumn(COLUMN_IDS.NAME)?.setFilterValue("")
                      }
                    />
                  </div>
                )}

                {chaosRange && (
                  <div className="w-auto min-w-0 xl:shrink-0">
                    <PriceFilterChip
                      value={chaosRange}
                      onClear={() =>
                        table
                          .getColumn(COLUMN_IDS.CHAOS)
                          ?.setFilterValue(undefined)
                      }
                    />
                  </div>
                )}
              </>
            );
          })()}
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
