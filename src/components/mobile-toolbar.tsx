"use client";

import {
  AdvancedSettingsPanel,
  type AdvancedSettings,
} from "@/components/advanced-settings-panel";
import { NameFilter } from "@/components/name-filter";
import { PriceFilter } from "@/components/price-filter";
import type { Item } from "@/lib/itemData";
import { Table } from "@tanstack/react-table";

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
    <div className="flex flex-col gap-3 border-b px-2 py-4 sm:px-3">
      <div className="flex justify-between gap-2">
        {/* Primary Actions Row - Most Important Features */}

        <div className="flex max-w-[220px] flex-1 flex-col gap-1">
          <PriceFilter
            column={table.getColumn(COLUMN_IDS.CHAOS)}
            description="Filter items by chaos price range."
            min={0}
            max={600}
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

        <div className="flex flex-wrap gap-1">
          <NameFilterChip table={table} />
          <PriceFilterChip table={table} />
        </div>
      </div>
    </div>
  );
}
