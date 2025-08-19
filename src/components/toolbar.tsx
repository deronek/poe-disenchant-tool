"use client";

import {
  AdvancedSettingsPanel,
  type AdvancedSettings,
} from "@/components/advanced-settings-panel";
import { NameFilter } from "@/components/name-filter";
import { RangeFilter } from "@/components/range-filter";
import type { Item } from "@/lib/itemData";
import { Table } from "@tanstack/react-table";

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
    <div className="flex gap-3 border-b p-3">
      <div className="w-full">
        <div className="grid grid-cols-[minmax(0,theme(maxWidth.3xs))_1fr] items-start gap-3 xl:flex xl:flex-nowrap xl:items-center">
          <div className="w-full min-w-0 xl:w-3xs xl:flex-none">
            <NameFilter table={table} />
          </div>

          <div className="w-full min-w-0 xl:w-auto xl:shrink-0">
            <RangeFilter
              column={table.getColumn(COLUMN_IDS.CHAOS)}
              title="Price Filter"
              description="Filter items by chaos price range."
              min={0}
              max={600}
            />
          </div>

          <div className="w-auto min-w-0 xl:ml-2 xl:shrink-0">
            <NameFilterChip table={table} />
          </div>

          <div className="w-auto min-w-0 xl:ml-2 xl:shrink-0">
            <PriceFilterChip table={table} />
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
        />

        <ClearMarksButton table={table} onClearMarks={onClearMarks} />

        {/* Mobile Help Section */}
        {/* <div className="md:hidden">
            <MobileHelpPopover />
          </div> */}
      </div>
    </div>
  );
}
