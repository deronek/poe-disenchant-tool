"use client";

import type { Item } from "@/lib/item-data";
import type { League } from "@/lib/leagues";
import type { ViewItem } from "@/lib/view-item";
import * as React from "react";

import { AdvancedSettingsProvider } from "@/components/advanced-settings-context";
import { createColumns, DataTable } from "@/components/data-table";
import {
  EfficiencySettingsProvider,
  useEfficiencySettings,
} from "@/components/efficiency";
import { HydrationMarker } from "@/components/hydration-marker";
import { LeagueSessionProvider } from "@/components/league-session-context";
import { getEfficiencyResult } from "@/lib/efficiency";

interface SharedDataViewProps {
  items: Item[];
  league: League;
  lowStockThreshold: number;
  divinePriceThreshold: number | null;
}

/**
 * Renders the shared data table with efficiency results calculated for each item.
 *
 * @param items - The items to display in the table
 * @param divinePriceThreshold - The price threshold used to configure divine price display
 */
function EfficiencyDataView({
  items,
  divinePriceThreshold,
}: Pick<SharedDataViewProps, "items" | "divinePriceThreshold">) {
  const { settings } = useEfficiencySettings();

  const columns = React.useMemo(
    () => createColumns(divinePriceThreshold),
    [divinePriceThreshold],
  );

  const viewItems = React.useMemo<ViewItem[]>(
    () =>
      items.map((item) => {
        const result = getEfficiencyResult(item, settings);

        return {
          ...item,
          efficiency: result.value,
          effectiveChaosCost: result.effectiveChaosCost,
        };
      }),
    [items, settings],
  );

  return <DataTable columns={columns} data={viewItems} />;
}

/**
 * Renders the shared data view with league, advanced settings, and efficiency contexts.
 *
 * @param league - The league whose session data configures the view
 * @param lowStockThreshold - The stock level at which items are considered low in stock
 * @param divinePriceThreshold - The optional divine price threshold used for efficiency calculations
 */
export function SharedDataView({
  items,
  league,
  lowStockThreshold,
  divinePriceThreshold,
}: SharedDataViewProps) {
  return (
    <LeagueSessionProvider
      league={league}
      lowStockThreshold={lowStockThreshold}
    >
      <AdvancedSettingsProvider>
        <EfficiencySettingsProvider>
          <EfficiencyDataView
            items={items}
            divinePriceThreshold={divinePriceThreshold}
          />
        </EfficiencySettingsProvider>
      </AdvancedSettingsProvider>

      <HydrationMarker />
    </LeagueSessionProvider>
  );
}
