"use client";

import type { AdvancedSettings } from "@/components/advanced-settings-panel";
import type { Item } from "@/lib/item-data";
import * as React from "react";

import {
  AdvancedSettingsSchema,
  DEFAULT_ADVANCED_SETTINGS,
} from "@/components/advanced-settings-panel";
import { createColumns, DataTable } from "@/components/data-table";
import { League } from "@/lib/leagues";
import { useLocalStorage } from "@/lib/use-local-storage";

interface SharedDataViewProps {
  items: Item[];
  league: League;
  lowStockThreshold: number;
  divinePriceThreshold: number | null;
}

export function SharedDataView({
  items,
  league,
  lowStockThreshold,
  divinePriceThreshold,
}: SharedDataViewProps) {
  const [advancedSettings, setAdvancedSettings] =
    useLocalStorage<AdvancedSettings>(
      DEFAULT_ADVANCED_SETTINGS,
      "poe-udt:trade-settings:v1",
      {
        debounceDelay: 300,
        schema: AdvancedSettingsSchema,
      },
    );

  // Generate columns with current settings and league
  const columns = React.useMemo(
    () =>
      createColumns(
        advancedSettings,
        lowStockThreshold,
        league,
        divinePriceThreshold,
      ),
    [advancedSettings, lowStockThreshold, league, divinePriceThreshold],
  );

  return (
    <DataTable
      columns={columns}
      data={items}
      advancedSettings={advancedSettings}
      onAdvancedSettingsChange={setAdvancedSettings}
      league={league}
      lowStockThreshold={lowStockThreshold}
    />
  );
}
